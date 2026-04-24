using System.Security.Claims;
using System.Text.Json.Serialization;
using Amazon.DynamoDBv2;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.SecretsManager;
using Amazon.SecretsManager.Model;
using Amazon.SimpleEmailV2;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ICatchService, CatchService>();
builder.Services.AddSingleton<ITripService, TripService>();
builder.Services.AddSingleton<ISettingsService, SettingsService>();
builder.Services.AddSingleton<IProfileService, ProfileService>();

// --- Shares feature ---
var sharesTableName   = $"FishTracker-Shares-{Environment.GetEnvironmentVariable("FISHTRACKER_ENV") ?? "Prod"}";
var thumbBucket       = Environment.GetEnvironmentVariable("SHARE_THUMBNAILS_BUCKET") ?? "";
var shareSender       = Environment.GetEnvironmentVariable("SHARE_SENDER") ?? "";
var shareTemplateName = Environment.GetEnvironmentVariable("SHARE_TEMPLATE_NAME") ?? "";
var staticMapsSecret  = Environment.GetEnvironmentVariable("STATIC_MAPS_SECRET_NAME") ?? "";
var shareViewUrlBase  = Environment.GetEnvironmentVariable("SHARE_VIEW_URL_BASE") ?? "";
var awsRegion         = Environment.GetEnvironmentVariable("AWS_REGION") ?? "ap-southeast-2";

builder.Services.AddSingleton<IAmazonS3, AmazonS3Client>();
builder.Services.AddSingleton<IAmazonSimpleEmailServiceV2, AmazonSimpleEmailServiceV2Client>();
builder.Services.AddSingleton<IAmazonSecretsManager, AmazonSecretsManagerClient>();
builder.Services.AddHttpClient<IStaticMapRenderer, GoogleStaticMapRenderer>()
                .ConfigureHttpClient(c => c.Timeout = TimeSpan.FromSeconds(8));

builder.Services.AddSingleton<ILocationFuzzer, LocationFuzzer>();

builder.Services.AddSingleton<IShareRepository>(sp =>
    new DynamoShareRepository(
        sp.GetRequiredService<IAmazonDynamoDB>(),
        sharesTableName,
        sp.GetRequiredService<ILogger<DynamoShareRepository>>()));

builder.Services.AddSingleton<IThumbnailStorage>(sp =>
    new S3ThumbnailStorage(
        sp.GetRequiredService<IAmazonS3>(),
        thumbBucket,
        awsRegion,
        sp.GetRequiredService<ILogger<S3ThumbnailStorage>>()));

builder.Services.AddSingleton<IShareEmailer>(sp =>
    new SesShareEmailer(
        sp.GetRequiredService<IAmazonSimpleEmailServiceV2>(),
        shareSender,
        shareTemplateName,
        sp.GetRequiredService<ILogger<SesShareEmailer>>()));

builder.Services.AddSingleton<ITripLookup, DynamoTripLookup>();

// Static Maps key provider - cached per Lambda cold-start
string? cachedKey = null;
builder.Services.AddSingleton<Func<Task<string>>>(sp => async () =>
{
    if (cachedKey is not null) return cachedKey;
    var sm = sp.GetRequiredService<IAmazonSecretsManager>();
    var resp = await sm.GetSecretValueAsync(new GetSecretValueRequest { SecretId = staticMapsSecret });
    cachedKey = resp.SecretString;
    return cachedKey!;
});

builder.Services.AddSingleton<IShareService>(sp =>
    new ShareService(
        sp.GetRequiredService<ILogger<ShareService>>(),
        sp.GetRequiredService<IShareRepository>(),
        sp.GetRequiredService<ILocationFuzzer>(),
        sp.GetRequiredService<IStaticMapRenderer>(),
        sp.GetRequiredService<IThumbnailStorage>(),
        sp.GetRequiredService<IShareEmailer>(),
        sp.GetRequiredService<ITripLookup>(),
        shareViewUrlBase));
// --- end Shares ---

builder.Services.AddLogging(logging => SetupLogger(false, logging, builder.Configuration));

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
//builder.Services.Configure<Microsoft.AspNetCore.Mvc.JsonOptions>(options =>
//{
//    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
//});

builder.Services.AddCors(o => o.AddPolicy("MyPolicy", builder =>
{
    builder.AllowAnyOrigin()
           .AllowAnyMethod()
           .AllowAnyHeader();
}));


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
app.UseCors("MyPolicy");

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
