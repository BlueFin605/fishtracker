using System.Security.Claims;
using System.Text.Json.Serialization;
using Amazon.DynamoDBv2;
using Amazon.Runtime;
using FishTrackerLambda.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ICatchService, CatchService>();
builder.Services.AddSingleton<ITripService, TripService>();
builder.Services.AddLogging(logging => SetupLogger(false, logging, builder.Configuration));

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
//builder.Services.Configure<Microsoft.AspNetCore.Mvc.JsonOptions>(options =>
//{
//    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
//});


if (builder.Configuration.GetSection("Environment")?.Value == "Development")
{
    builder.Services.AddSingleton<IClaimHandler, LocalDebugClaimHandler>();
    Func<IAmazonDynamoDB> create = () =>
    {
        AmazonDynamoDBConfig clientConfig = new AmazonDynamoDBConfig();
        // Set the endpoint URL
        clientConfig.ServiceURL = "http://localhost:8000";
        var credentials = new BasicAWSCredentials("xxx", "xxx");
        AmazonDynamoDBClient client = new AmazonDynamoDBClient(credentials, clientConfig);
        return (IAmazonDynamoDB)client;
    };
    builder.Services.AddSingleton(create());
}
else
{
    builder.Services.AddSingleton<IClaimHandler, LambdaClaimHandler>();
    builder.Services.AddTransient<IAmazonDynamoDB, AmazonDynamoDBClient>();
}
// Add services to the container.
builder.Services.AddControllers();

// Add AWS Lambda support. When application is run in Lambda Kestrel is swapped out as the web server with Amazon.Lambda.AspNetCoreServer. This
// package will act as the webserver translating request and responses between the Lambda event source and ASP.NET Core.
builder.Services.AddAWSLambdaHosting(LambdaEventSource.RestApi);

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.MapRoutes();

app.Run();


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
