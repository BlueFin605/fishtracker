using Amazon.CDK;
using System;
using System.IO;
using System.Text.Json;
using FishTracker.Cdk;

var app = new App();

// Load config from file (preferred) or fall back to context params
var configFile = app.Node.TryGetContext("configFile")?.ToString() ?? "../config.json";
var config = LoadConfigFromFile(configFile);

var domainName = TryGetConfigString(config, "domain")
    ?? app.Node.TryGetContext("domainName")?.ToString()
    ?? throw new Exception("domain is required in config.json or via -c domainName=...");

var region = TryGetConfigString(config, "region")
    ?? app.Node.TryGetContext("region")?.ToString()
    ?? "eu-central-1";

var environment = TryGetConfigString(config, "environment")
    ?? app.Node.TryGetContext("environment")?.ToString()
    ?? "Prod";

var sesFromAddress = TryGetConfigString(config, "sesFromAddress")
    ?? app.Node.TryGetContext("sesFromAddress")?.ToString();

var sesFromName = TryGetConfigString(config, "sesFromName")
    ?? app.Node.TryGetContext("sesFromName")?.ToString();

// Shared external identity: CDK context only (never config.json). Both or neither.
var identityUserPoolId = app.Node.TryGetContext("identityUserPoolId")?.ToString();
var identityDomain = app.Node.TryGetContext("identityDomain")?.ToString();
if (string.IsNullOrWhiteSpace(identityUserPoolId) != string.IsNullOrWhiteSpace(identityDomain))
    throw new Exception("context \"identityUserPoolId\" and \"identityDomain\" must be provided together (or both omitted)");

var env = new Amazon.CDK.Environment
{
    Account = System.Environment.GetEnvironmentVariable("CDK_DEFAULT_ACCOUNT"),
    Region = region
};

new FishTrackerStack(app, $"FishTracker-{environment}", new FishTrackerStackProps
{
    Env = env,
    Environment = environment,
    DomainName = domainName,
    SesFromAddress = sesFromAddress,
    SesFromName = sesFromName,
    IdentityUserPoolId = identityUserPoolId,
    IdentityDomain = identityDomain
});

Tags.Of(app).Add("Project", "FishTracker");
Tags.Of(app).Add("Environment", environment);

app.Synth();

// --- Config helpers ---

static JsonElement? LoadConfigFromFile(string path)
{
    if (!File.Exists(path))
        return null;

    try
    {
        var json = File.ReadAllText(path);
        var doc = JsonDocument.Parse(json);

        if (doc.RootElement.TryGetProperty("fishtracker", out var section))
            return section;

        return null;
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Warning: Could not read config file '{path}': {ex.Message}");
        return null;
    }
}

static string? TryGetConfigString(JsonElement? config, string property)
{
    if (config == null) return null;
    if (config.Value.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String)
    {
        var str = value.GetString();
        return string.IsNullOrWhiteSpace(str) ? null : str;
    }
    return null;
}
