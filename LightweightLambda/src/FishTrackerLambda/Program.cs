using System.Security.Claims;
using Amazon.DynamoDBv2;
using Amazon.Runtime;
using FishTrackerLambda.Services;
using Microsoft.Extensions.Configuration;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ICatchService, CatchService>();
builder.Services.AddSingleton<ITripService, TripService>();
builder.Services.AddLogging(logging => SetupLogger(false, logging, builder.Configuration));

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

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapGet("api/trip/", async (IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ClaimsPrincipal user) =>
{
    string subjectClaim = claimHandler.ExtractSubject(user.Claims);
    return await ExecuteService(app.Logger, $"GetAllTrips tripId subject:[{subjectClaim}]", async () => await tripService.GetTrips(subjectClaim));
});


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


static async Task<IResult> ExecuteService<T>(ILogger logger, string logDesc, Func<Task<T>> func)
{
    try
    {
        logger.LogInformation(logDesc);
        var result = await func();
        return Results.Ok(result);
    }
    catch (Exception e)
    {
        logger.LogError(e, $"{logDesc} Exception {e.Message}");
        throw;
    }
};
