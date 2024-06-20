using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.DataCollection;
using Moq;

namespace FishTrackerLambda;

/// <summary>
/// This class extends from APIGatewayProxyFunction which contains the method FunctionHandlerAsync which is the 
/// actual Lambda function entry point. The Lambda handler field should be set to
/// 
/// FishTracker::FishTracker.LambdaEntryPoint::FunctionHandlerAsync
/// </summary>
public class TestEntryPoint :

    // The base class must be set to match the AWS service invoking the Lambda function. If not Amazon.Lambda.AspNetCoreServer
    // will fail to convert the incoming request correctly into a valid ASP.NET Core request.
    //
    // API Gateway REST API                         -> Amazon.Lambda.AspNetCoreServer.APIGatewayProxyFunction
    // API Gateway HTTP API payload version 1.0     -> Amazon.Lambda.AspNetCoreServer.APIGatewayProxyFunction
    // API Gateway HTTP API payload version 2.0     -> Amazon.Lambda.AspNetCoreServer.APIGatewayHttpApiV2ProxyFunction
    // Application Load Balancer                    -> Amazon.Lambda.AspNetCoreServer.ApplicationLoadBalancerFunction
    // 
    // Note: When using the AWS::Serverless::Function resource with an event type of "HttpApi" then payload version 2.0
    // will be the default and you must make Amazon.Lambda.AspNetCoreServer.APIGatewayHttpApiV2ProxyFunction the base class.

    Amazon.Lambda.AspNetCoreServer.APIGatewayProxyFunction
{
    /// <summary>
    /// The builder has configuration, logging and Amazon API Gateway already configured. The startup class
    /// needs to be configured in this method using the UseStartup<>() method.
    /// </summary>
    /// <param name="builder"></param>
    protected override void Init(IWebHostBuilder builder)
    {
        builder
            .UseStartup<TestStartup>();
    }

    /// <summary>
    /// Use this override to customize the services registered with the IHostBuilder. 
    /// 
    /// It is recommended not to call ConfigureWebHostDefaults to configure the IWebHostBuilder inside this method.
    /// Instead customize the IWebHostBuilder in the Init(IWebHostBuilder) overload.
    /// </summary>
    /// <param name="builder"></param>
    protected override void Init(IHostBuilder builder)
    {
        var qservice = new Moq.Mock<ICatchService>();
        qservice.Setup(s => s.GetCatch(It.IsAny<Guid>())).Returns(Task.FromResult<CatchDetails>(new CatchDetails(Guid.Parse("5acb3a1b-9311-447b-95e5-7dfca626a3d2"), Guid.Parse("6cc39752-b9b1-4bb4-befe-f1b082cc9e3d"), Guid.Parse("aa632249-1ab4-423b-bc4d-3eeb9f2dbaa0"), new Location(1,2), DateTime.UnixEpoch, FishSize.Medium, 10, null)));
        qservice.Setup(s => s.NewCatch(It.IsAny<NewCatch>())).Returns(Task.FromResult<CatchDetails>(new CatchDetails(Guid.Parse("5acb3a1b-9311-447b-95e5-7dfca626a3d2"), Guid.Parse("6cc39752-b9b1-4bb4-befe-f1b082cc9e3d"), Guid.Parse("aa632249-1ab4-423b-bc4d-3eeb9f2dbaa0"), new Location(1, 2), DateTime.UnixEpoch, FishSize.Medium, 10, null)));

        builder.ConfigureServices(services => {
            services.AddSingleton< IAmazonDynamoDB>(sp => (new Moq.Mock<IAmazonDynamoDB>()).Object);
            services.AddSingleton<ICatchService>(sp => qservice.Object);
        });
    }
}