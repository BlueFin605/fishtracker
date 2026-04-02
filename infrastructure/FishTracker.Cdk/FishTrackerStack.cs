using Amazon.CDK;
using Amazon.CDK.AWS.APIGateway;
using Amazon.CDK.AWS.CertificateManager;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.Cognito;
using Amazon.CDK.AWS.DynamoDB;
using Amazon.CDK.AWS.IAM;
using Amazon.CDK.AWS.Lambda;
using Amazon.CDK.AWS.Route53;
using Amazon.CDK.AWS.Route53.Targets;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.SSM;
using Constructs;
using Attribute = Amazon.CDK.AWS.DynamoDB.Attribute;
using Function = Amazon.CDK.AWS.Lambda.Function;
using FunctionProps = Amazon.CDK.AWS.Lambda.FunctionProps;

namespace FishTracker.Cdk;

public class FishTrackerStackProps : StackProps
{
    public required string Environment { get; set; }
    public required string DomainName { get; set; }
}

public class FishTrackerStack : Stack
{
    public FishTrackerStack(Construct scope, string id, FishTrackerStackProps props)
        : base(scope, id, props)
    {
        var env = props.Environment; // e.g. "Prod", "Dev", "Test"
        var isProd = env == "Prod";

        // Domain convention: prod = fishtracker.domain, other = {env}.fishtracker.domain
        var subdomainPrefix = isProd ? "fishtracker" : $"{env.ToLower()}.fishtracker";
        var websiteDomain = $"{subdomainPrefix}.{props.DomainName}";
        var apiDomain = $"api.{subdomainPrefix}.{props.DomainName}";
        var authDomain = $"auth.{subdomainPrefix}.{props.DomainName}";

        // Look up secrets from SSM Parameter Store
        var certificateArn = StringParameter.ValueForStringParameter(this, "/fishtracker/certificate-arn");
        var googleClientId = StringParameter.ValueForStringParameter(this, "/fishtracker/google-client-id");
        var googleClientSecret = StringParameter.ValueFromLookup(this, "/fishtracker/google-client-secret");

        var hostedZone = HostedZone.FromLookup(this, "HostedZone", new HostedZoneProviderProps
        {
            DomainName = props.DomainName
        });

        var certificate = Certificate.FromCertificateArn(this, "Certificate", certificateArn);

        // =====================================================================
        // DynamoDB Tables
        // =====================================================================

        var tripsTable = new Table(this, "TripsTable", new TableProps
        {
            TableName = $"FishTracker-Trips-{env}",
            BillingMode = BillingMode.PAY_PER_REQUEST,
            PartitionKey = new Attribute { Name = "Subject", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "TripId", Type = AttributeType.STRING },
            RemovalPolicy = RemovalPolicy.RETAIN
        });

        var catchTable = new Table(this, "CatchTable", new TableProps
        {
            TableName = $"FishTracker-Catch-{env}",
            BillingMode = BillingMode.PAY_PER_REQUEST,
            PartitionKey = new Attribute { Name = "TripKey", Type = AttributeType.STRING },
            SortKey = new Attribute { Name = "CatchId", Type = AttributeType.STRING },
            RemovalPolicy = RemovalPolicy.RETAIN
        });

        var profileTable = new Table(this, "ProfileTable", new TableProps
        {
            TableName = $"FishTracker-Profile-{env}",
            BillingMode = BillingMode.PAY_PER_REQUEST,
            PartitionKey = new Attribute { Name = "Subject", Type = AttributeType.STRING },
            RemovalPolicy = RemovalPolicy.RETAIN
        });

        var settingsTable = new Table(this, "SettingsTable", new TableProps
        {
            TableName = $"FishTracker-Settings-{env}",
            BillingMode = BillingMode.PAY_PER_REQUEST,
            PartitionKey = new Attribute { Name = "Settings", Type = AttributeType.STRING },
            RemovalPolicy = RemovalPolicy.RETAIN
        });

        // =====================================================================
        // Cognito
        // =====================================================================

        var userPool = new UserPool(this, "UserPool", new UserPoolProps
        {
            UserPoolName = $"fishtracker-userpool-{env.ToLower()}",
            SelfSignUpEnabled = true,
            SignInAliases = new SignInAliases { Email = true },
            AutoVerify = new AutoVerifiedAttrs { Email = true },
            PasswordPolicy = new PasswordPolicy { MinLength = 6 },
            Email = UserPoolEmail.WithCognito(),
            UserVerification = new UserVerificationConfig
            {
                EmailSubject = "Account Confirmation",
                EmailBody = "Your confirmation code is {####}",
                EmailStyle = VerificationEmailStyle.CODE
            },
            StandardAttributes = new StandardAttributes
            {
                Email = new StandardAttribute { Required = true, Mutable = true },
                Fullname = new StandardAttribute { Required = true, Mutable = true }
            },
            RemovalPolicy = RemovalPolicy.RETAIN
        });

        var googleProvider = new UserPoolIdentityProviderGoogle(this, "GoogleProvider", new UserPoolIdentityProviderGoogleProps
        {
            UserPool = userPool,
            ClientId = googleClientId,
            ClientSecretValue = SecretValue.UnsafePlainText(googleClientSecret),
            Scopes = new[] { "openid", "profile", "email" },
            AttributeMapping = new AttributeMapping
            {
                Email = ProviderAttribute.GOOGLE_EMAIL,
                Fullname = ProviderAttribute.GOOGLE_NAME,
                Custom = new Dictionary<string, ProviderAttribute>
                {
                    ["username"] = ProviderAttribute.Other("sub")
                }
            }
        });

        var oauthScopes = new[]
        {
            OAuthScope.COGNITO_ADMIN,
            OAuthScope.EMAIL,
            OAuthScope.OPENID,
            OAuthScope.PROFILE
        };

        var callbackUrls = new[] { "http://localhost:4200/callback", $"https://{websiteDomain}/callback" };
        var logoutUrls = new[] { "http://localhost:4200/login", $"https://{websiteDomain}/login" };

        var identityProviders = new[]
        {
            UserPoolClientIdentityProvider.COGNITO,
            UserPoolClientIdentityProvider.GOOGLE
        };

        var implicitClient = userPool.AddClient("ImplicitClient", new UserPoolClientOptions
        {
            UserPoolClientName = $"fishtracker-client-{env.ToLower()}",
            GenerateSecret = false,
            AccessTokenValidity = Duration.Days(1),
            IdTokenValidity = Duration.Hours(1),
            RefreshTokenValidity = Duration.Days(30),
            SupportedIdentityProviders = identityProviders,
            OAuth = new OAuthSettings
            {
                Flows = new OAuthFlows { ImplicitCodeGrant = true },
                Scopes = oauthScopes,
                CallbackUrls = callbackUrls,
                LogoutUrls = logoutUrls
            }
        });
        implicitClient.Node.AddDependency(googleProvider);

        var authCodeClient = userPool.AddClient("AuthCodeClient", new UserPoolClientOptions
        {
            UserPoolClientName = $"fishtracker-client-auth-code-{env.ToLower()}",
            GenerateSecret = false,
            AccessTokenValidity = Duration.Minutes(5),
            IdTokenValidity = Duration.Hours(1),
            RefreshTokenValidity = Duration.Days(30),
            SupportedIdentityProviders = identityProviders,
            OAuth = new OAuthSettings
            {
                Flows = new OAuthFlows { AuthorizationCodeGrant = true },
                Scopes = oauthScopes,
                CallbackUrls = callbackUrls,
                LogoutUrls = logoutUrls
            }
        });
        authCodeClient.Node.AddDependency(googleProvider);

        var domain = userPool.AddDomain("CustomDomain", new UserPoolDomainOptions
        {
            CustomDomain = new CustomDomainOptions
            {
                DomainName = authDomain,
                Certificate = certificate
            }
        });

        new ARecord(this, "AuthDnsRecord", new ARecordProps
        {
            Zone = hostedZone,
            RecordName = authDomain,
            Target = RecordTarget.FromAlias(new UserPoolDomainTarget(domain))
        });

        // =====================================================================
        // IAM Roles
        // =====================================================================

        var lambdaRole = new Role(this, "LambdaRole", new RoleProps
        {
            // RoleName intentionally omitted — CDK generates unique name to avoid conflict with Terraform
            AssumedBy = new CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com"),
                new ServicePrincipal("apigateway.amazonaws.com")
            ),
            ManagedPolicies = new[]
            {
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            }
        });

        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[]
            {
                "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem",
                "dynamodb:PutItem", "dynamodb:DeleteItem", "dynamodb:GetItem",
                "dynamodb:Scan", "dynamodb:Query", "dynamodb:UpdateItem",
                "dynamodb:DescribeTable"
            },
            Resources = new[] { $"arn:aws:dynamodb:*:{this.Account}:table/*" }
        }));

        lambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[] { "dynamodb:Scan", "dynamodb:Query" },
            Resources = new[] { $"arn:aws:dynamodb:*:{this.Account}:table/*/index/*" }
        }));

        var authLambdaRole = new Role(this, "AuthLambdaRole", new RoleProps
        {
            // RoleName intentionally omitted — CDK generates unique name to avoid conflict with Terraform
            AssumedBy = new ServicePrincipal("apigateway.amazonaws.com"),
            ManagedPolicies = new[]
            {
                ManagedPolicy.FromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            }
        });

        authLambdaRole.AddToPolicy(new PolicyStatement(new PolicyStatementProps
        {
            Actions = new[] { "lambda:InvokeFunction" },
            Resources = new[] { "*" }
        }));

        // =====================================================================
        // Lambda Functions
        // =====================================================================

        // Derive Cognito values from the resources CDK creates
        var tokenIssuer = $"https://cognito-idp.{this.Region}.amazonaws.com/{userPool.UserPoolId}";
        var jwksUri = $"{tokenIssuer}/.well-known/jwks.json";

        var lambdaEnvironment = new Dictionary<string, string>
        {
            ["JWKS_URI"] = jwksUri,
            ["AUDIENCE"] = authCodeClient.UserPoolClientId,
            ["TOKEN_ISSUER"] = tokenIssuer,
            ["IS_LAMBDA"] = "true"
        };

        var dotnetLambda = new Function(this, "DotnetLambda", new FunctionProps
        {
            FunctionName = $"FishTracker-Lambda-Function-{env}",
            Runtime = Runtime.DOTNET_8,
            Architecture = Architecture.ARM_64,
            Handler = "FishTrackerLambda",
            Timeout = Duration.Seconds(20),
            Role = lambdaRole,
            Code = Code.FromAsset("../FishTrackerLambda/publish")
        });

        var nodejsLambda = new Function(this, "NodejsLambda", new FunctionProps
        {
            FunctionName = $"FishTracker-Lambda-NodeJs-{env}",
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Timeout = Duration.Seconds(20),
            Role = lambdaRole,
            Code = Code.FromAsset("../FishTrackerLambdaNode/bundle", new Amazon.CDK.AWS.S3.Assets.AssetOptions
            {
                Exclude = new[] { "*.zip" }
            }),
            Environment = lambdaEnvironment
        });

        var validatorLambda = new Function(this, "ValidatorLambda", new FunctionProps
        {
            FunctionName = $"FishTracker-Lambda-Validator-{env}",
            Runtime = Runtime.NODEJS_22_X,
            Handler = "index.handler",
            Timeout = Duration.Seconds(20),
            Role = lambdaRole,
            Code = Code.FromAsset("../FishTrackerLambdaValidator", new Amazon.CDK.AWS.S3.Assets.AssetOptions
            {
                Exclude = new[] { "*.zip", "*.sample", "testjwt.js", "LICENSE", "README.md" }
            }),
            Environment = new Dictionary<string, string>
            {
                ["JWKS_URI"] = jwksUri,
                ["AUDIENCE"] = authCodeClient.UserPoolClientId,
                ["TOKEN_ISSUER"] = tokenIssuer
            }
        });

        // =====================================================================
        // API Gateway
        // =====================================================================

        var apiCustomDomain = new DomainName_(this, "ApiDomain", new DomainNameProps
        {
            DomainName = apiDomain,
            Certificate = certificate,
            EndpointType = EndpointType.EDGE
        });

        var api = new RestApi(this, "FishTrackerApi", new RestApiProps
        {
            RestApiName = $"fishtracker-api-{env.ToLower()}",
            Description = $"FishTracker API Gateway ({env})",
            EndpointConfiguration = new EndpointConfiguration
            {
                Types = new[] { EndpointType.REGIONAL }
            },
            DeployOptions = new StageOptions
            {
                StageName = env,
                ThrottlingBurstLimit = 5,
                ThrottlingRateLimit = 1,
                MetricsEnabled = true
            },
            DefaultCorsPreflightOptions = new CorsOptions
            {
                AllowOrigins = Cors.ALL_ORIGINS,
                AllowMethods = new[] { "GET", "PUT", "PATCH", "DELETE", "POST", "OPTIONS" },
                AllowHeaders = new[]
                {
                    "Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key",
                    "X-Amz-Security-Token", "x-amz-content-sha256"
                }
            }
        });

        new BasePathMapping(this, "ApiMapping", new BasePathMappingProps
        {
            DomainName = apiCustomDomain,
            RestApi = api,
            Stage = api.DeploymentStage
        });

        new ARecord(this, "ApiDnsRecord", new ARecordProps
        {
            Zone = hostedZone,
            RecordName = apiDomain,
            Target = RecordTarget.FromAlias(new ApiGatewayDomain(apiCustomDomain))
        });

        var authorizer = new TokenAuthorizer(this, "CustomAuthorizer", new TokenAuthorizerProps
        {
            AuthorizerName = $"fishtracker-api-cognito-custom-authoriser-{env.ToLower()}",
            Handler = validatorLambda,
            AssumeRole = authLambdaRole,
            IdentitySource = "method.request.header.Authorization",
            ValidationRegex = @"^Bearer [-0-9a-zA-Z\._]*$",
            ResultsCacheTtl = Duration.Seconds(0)
        });

        var queryValidator = new RequestValidator(this, "QueryValidator", new RequestValidatorProps
        {
            RestApi = api,
            RequestValidatorName = "Validate query string parameters",
            ValidateRequestParameters = true,
            ValidateRequestBody = false
        });

        var lambdaIntegration = new LambdaIntegration(nodejsLambda, new LambdaIntegrationOptions
        {
            Proxy = true
        });

        var authMethodOptions = new MethodOptions
        {
            AuthorizationType = AuthorizationType.CUSTOM,
            Authorizer = authorizer
        };

        var authWithQueryValidation = new MethodOptions
        {
            AuthorizationType = AuthorizationType.CUSTOM,
            Authorizer = authorizer,
            RequestValidator = queryValidator,
            RequestParameters = new Dictionary<string, bool>
            {
                ["method.request.querystring.view"] = false
            }
        };

        // API Resources & Methods
        var apiResource = api.Root.AddResource("api");

        var settings = apiResource.AddResource("settings");
        settings.AddMethod("GET", lambdaIntegration, authWithQueryValidation);
        settings.AddMethod("PATCH", lambdaIntegration, authMethodOptions);

        var species = settings.AddResource("species");
        species.AddMethod("POST", lambdaIntegration, authMethodOptions);

        var profile = apiResource.AddResource("profile");
        profile.AddMethod("GET", lambdaIntegration, authWithQueryValidation);
        profile.AddMethod("PATCH", lambdaIntegration, authMethodOptions);

        var trip = apiResource.AddResource("trip");
        trip.AddMethod("GET", lambdaIntegration, authWithQueryValidation);
        trip.AddMethod("POST", lambdaIntegration, authMethodOptions);

        var tripProxy = trip.AddResource("{tripid}");
        tripProxy.AddMethod("GET", lambdaIntegration, authMethodOptions);
        tripProxy.AddMethod("PUT", lambdaIntegration, authMethodOptions);
        tripProxy.AddMethod("PATCH", lambdaIntegration, authMethodOptions);
        tripProxy.AddMethod("DELETE", lambdaIntegration, authMethodOptions);

        var endTrip = tripProxy.AddResource("endtrip");
        endTrip.AddMethod("POST", lambdaIntegration, authMethodOptions);

        var catchResource = tripProxy.AddResource("catch");
        catchResource.AddMethod("GET", lambdaIntegration, authMethodOptions);
        catchResource.AddMethod("POST", lambdaIntegration, authMethodOptions);

        var catchProxy = catchResource.AddResource("{catchid}");
        catchProxy.AddMethod("GET", lambdaIntegration, authMethodOptions);
        catchProxy.AddMethod("PUT", lambdaIntegration, authMethodOptions);
        catchProxy.AddMethod("PATCH", lambdaIntegration, authMethodOptions);

        var fixup = apiResource.AddResource("fixup");
        fixup.AddMethod("PATCH", lambdaIntegration, authMethodOptions);

        // =====================================================================
        // Website (S3 + CloudFront)
        // =====================================================================

        // DnsValidatedCertificate is deprecated but required for cross-region (us-east-1) certs from eu-central-1
        #pragma warning disable CS0618
        var websiteCertificate = new DnsValidatedCertificate(this, "WebsiteCertificate", new DnsValidatedCertificateProps
        {
            DomainName = websiteDomain,
            HostedZone = hostedZone,
            Region = "us-east-1"
        });
        #pragma warning restore CS0618

        var websiteBucket = new Bucket(this, "WebsiteBucket", new BucketProps
        {
            // BucketName intentionally omitted — CDK generates unique name to avoid conflict with Terraform
            BlockPublicAccess = BlockPublicAccess.BLOCK_ALL,
            RemovalPolicy = RemovalPolicy.DESTROY,
            AutoDeleteObjects = true
        });

        var distribution = new Distribution(this, "WebsiteDistribution", new DistributionProps
        {
            DefaultBehavior = new BehaviorOptions
            {
                Origin = S3BucketOrigin.WithOriginAccessControl(websiteBucket),
                ViewerProtocolPolicy = ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                CachePolicy = CachePolicy.CACHING_DISABLED
            },
            DomainNames = new[] { websiteDomain },
            Certificate = websiteCertificate,
            DefaultRootObject = "index.html",
            PriceClass = PriceClass.PRICE_CLASS_100,
            ErrorResponses = new[]
            {
                new ErrorResponse
                {
                    HttpStatus = 404,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html",
                    Ttl = Duration.Seconds(0)
                },
                new ErrorResponse
                {
                    HttpStatus = 403,
                    ResponseHttpStatus = 200,
                    ResponsePagePath = "/index.html",
                    Ttl = Duration.Seconds(0)
                }
            }
        });

        new ARecord(this, "WebsiteDnsRecord", new ARecordProps
        {
            Zone = hostedZone,
            RecordName = websiteDomain,
            Target = RecordTarget.FromAlias(new CloudFrontTarget(distribution))
        });

        // =====================================================================
        // Outputs
        // =====================================================================

        _ = new CfnOutput(this, "ApiUrl", new CfnOutputProps
        {
            Value = api.Url,
            Description = "API Gateway URL"
        });

        _ = new CfnOutput(this, "WebsiteBucketName", new CfnOutputProps
        {
            Value = websiteBucket.BucketName,
            Description = "S3 bucket for website content"
        });

        _ = new CfnOutput(this, "DistributionId", new CfnOutputProps
        {
            Value = distribution.DistributionId,
            Description = "CloudFront distribution ID (for cache invalidation)"
        });

        _ = new CfnOutput(this, "UserPoolId", new CfnOutputProps
        {
            Value = userPool.UserPoolId,
            Description = "Cognito User Pool ID"
        });
    }
}
