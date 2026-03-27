var builder = DistributedApplication.CreateBuilder(args);

// =====================================================================
// LocalStack — provides DynamoDB (and other AWS services if needed)
// Maps container port 4566 → host port 8000 so existing Lambda code
// works without changes (both .NET and Node.js hardcode localhost:8000)
// =====================================================================

var localstack = builder.AddContainer("localstack", "localstack/localstack", "latest")
    .WithEndpoint(port: 8000, targetPort: 4566, name: "gateway", scheme: "http")
    .WithEnvironment("SERVICES", "dynamodb")
    .WithEnvironment("DEFAULT_REGION", "eu-central-1")
    .WithEnvironment("EAGER_SERVICE_LOADING", "1")
    .WithEnvironment("LOCALSTACK_ACKNOWLEDGE_ACCOUNT_REQUIREMENT", "1")
    .WithBindMount("../localstack", "/etc/localstack/init/ready.d", isReadOnly: true)
    .WithLifetime(ContainerLifetime.Persistent);

// =====================================================================
// Node.js Lambda — runs as Express server locally
// When IS_LAMBDA is unset, it starts Express on PORT and configures
// local DynamoDB at localhost:8000
// =====================================================================

var nodejsLambda = builder.AddJavaScriptApp("nodejs-api", "../../FishTrackerLambdaNode", "start")
    .WithHttpEndpoint(port: 3000, targetPort: 3000, env: "PORT", isProxied: false)
    .WaitFor(localstack);

// =====================================================================
// Angular frontend — runs ng serve with 'local' configuration
// which points API calls at the local Node.js API (localhost:3000)
// =====================================================================

var angular = builder.AddJavaScriptApp("angular-app", "../../angular", "start:local")
    .WithHttpEndpoint(port: 4201, isProxied: false)
    .WaitFor(nodejsLambda);

builder.Build().Run();
