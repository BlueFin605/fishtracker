using System.Text.Json.Serialization;
using Amazon.DynamoDBv2;
using GradientOfAgreementLambda.AWSProxy;
using GradientOfAgreementLambda.Services;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using Microsoft.IdentityModel.Logging;
using Newtonsoft.Json;

namespace GradientOfAgreementLambda;

public class Startup
{
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    // This method gets called by the runtime. Use this method to add services to the container
    public void ConfigureServices(IServiceCollection services)
    {
        //services.AddLogging();

        services.AddLogging(logging => SetupLogger(false, logging, Configuration));


        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            });

        services.AddCors(o => o.AddPolicy("MyPolicy", builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        }));

        services.AddSingleton<IAmazonSecurityTokenServiceClientProxy, AmazonSecurityTokenServiceClient_AWS>();
        services.AddSingleton<IQuestionService, QuestionService>();
        services.AddTransient<IAmazonDynamoDB, AmazonDynamoDBClient>();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseRouting();

        app.UseCors("MyPolicy");

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapGet("/", async context =>
            {
                await context.Response.WriteAsync("Welcome to running ASP.NET Core on AWS Lambda");
            });
        });
    }

    //taken from https://medium.com/@piotrkarpaa/lambda-logging-in-asp-net-core-d6fe148c2760
    public static void SetupLogger(bool isDevelopment, ILoggingBuilder logging, IConfiguration configuration)
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