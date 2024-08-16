using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda;

[Amazon.Lambda.Annotations.LambdaStartup]
public class Startup
{
    /// <summary>
    /// Services for Lambda functions can be registered in the services dependency injection container in this method. 
    ///
    /// The services can be injected into the Lambda function through the containing type's constructor or as a
    /// parameter in the Lambda function using the FromService attribute. Services injected for the constructor have
    /// the lifetime of the Lambda compute container. Services injected as parameters are created within the scope
    /// of the function invocation.
    /// </summary>
    public void ConfigureServices(IServiceCollection services)
    {
        // Here we'll add an instance of our calculator service that will be used by each function
        services.AddSingleton<ICalculatorService>(new CalculatorService());
        services.AddSingleton<ICatchService, CatchService>();
        services.AddSingleton<ITripService, TripService>();
        services.AddLogging(logging => SetupLogger(false, logging, builder.Configuration));

        //// Example of creating the IConfiguration object and
        //// adding it to the dependency injection container.
        var builder = new ConfigurationBuilder()
                            .AddJsonFile("appsettings.json", true);
        var configuration = builder.Build();


        if (configuration.GetSection("Environment")?.Value == "Development")
        {
            services.AddSingleton<IClaimHandler, LocalDebugClaimHandler>();
            Func<IAmazonDynamoDB> create = () =>
            {
                AmazonDynamoDBConfig clientConfig = new AmazonDynamoDBConfig();
                // Set the endpoint URL
                clientConfig.ServiceURL = "http://localhost:8000";
                var credentials = new BasicAWSCredentials("xxx", "xxx");
                AmazonDynamoDBClient client = new AmazonDynamoDBClient(credentials, clientConfig);
                return (IAmazonDynamoDB)client;
            };
            services.AddSingleton(create());
        }
        else
        {
            services.AddSingleton<IClaimHandler, LambdaClaimHandler>();
            services.AddTransient<IAmazonDynamoDB, AmazonDynamoDBClient>();
        }

        services.AddSingleton<IConfiguration>(configuration);

        //// Example of using the AWSSDK.Extensions.NETCore.Setup NuGet package to add
        //// the Amazon S3 service client to the dependency injection container.
        //services.AddAWSService<Amazon.S3.IAmazonS3>();
    }

    static void SetupLogger(bool isDevelopment, ILoggingBuilder logging, IConfiguration configuration)
    {
        if (logging == null)
        {
            throw new ArgumentNullException(nameof(logging));
        }

        // Create and populate LambdaLoggerOptions object
        var loggerOptions = new LambdaLoggerOptions
        {
            IncludeCategory = true,
            IncludeLogLevel = true,
            IncludeNewline = true,
            IncludeEventId = true,
            IncludeException = true
        };

        // Configure Lambda logging
        logging.AddLambdaLogger(loggerOptions);

        logging.SetMinimumLevel(LogLevel.Trace);

        if (isDevelopment)
        {
            logging.AddConsole();
        }
    }

}

