﻿using Amazon.DynamoDBv2;
using Amazon.Runtime;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.Services;
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
        Console.WriteLine("dvide by zero iminent");
        //var y = 10 + 5 - 15;
        //var x = 10 / y;

        // Here we'll add an instance of our calculator service that will be used by each function
        services.AddSingleton<ICatchService, CatchService>();
        services.AddSingleton<ITripService, TripService>();

        //// Example of creating the IConfiguration object and
        //// adding it to the dependency injection container.
        //var builder = new ConfigurationBuilder()

        var environment = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
        Console.WriteLine($"Environment  envvar[{System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}]  environment[{environment}]");
        var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables();
        var configuration = builder.Build();
        services.AddLogging(logging => SetupLogger(true, logging, configuration));

        configuration.GetChildren().ToList().ForEach(i => Console.WriteLine($"key:[{i.Key}] value:[{i.Value}] path:[{i.Path}]"));

        if (configuration.GetSection("Environment")?.Value == "Development")
        {
            Console.WriteLine("Development");
            services.AddSingleton<IClaimHandler, LocalDebugClaimHandler>();
            Func<IAmazonDynamoDB> create = () =>
            {
                Console.WriteLine("setup aws dynamo client");
                AmazonDynamoDBConfig clientConfig = new AmazonDynamoDBConfig();
                // Set the endpoint URL
                //clientConfig.ServiceURL = "http://localhost:8000";
                clientConfig.ServiceURL = "http://dynamodb-local:8000";
                var credentials = new BasicAWSCredentials("dummy", "dummy");
                AmazonDynamoDBClient client = new AmazonDynamoDBClient(credentials, clientConfig);
                return (IAmazonDynamoDB)client;
            };
            services.AddSingleton(create());
        }
        else
        {
            Console.WriteLine("Production");
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
        //var loggerOptions = new LambdaLoggerOptions
        //{
        //    IncludeCategory = true,
        //    IncludeLogLevel = true,
        //    IncludeNewline = true,
        //    IncludeEventId = true,
        //    IncludeException = true
        //};

        //// Configure Lambda logging
        //logging.AddLambdaLogger(loggerOptions);

        logging.SetMinimumLevel(LogLevel.Trace);

        if (isDevelopment)
        {
            Console.WriteLine("Add console logger");
            logging.AddConsole();
        }
    }

}

