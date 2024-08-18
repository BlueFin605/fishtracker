using Amazon.Lambda.Core;
using Amazon.Lambda.Annotations;
using Amazon.Lambda.Annotations.APIGateway;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc.ViewEngines;
using FishTrackerLambda.Functional;
using Microsoft.Extensions.Logging;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace FishTrackerLambda;

/// <summary>
/// A collection of sample Lambda functions that provide a REST api for doing simple math calculations. 
/// </summary>
public class Functions
{
    private IClaimHandler m_claimHandler;
    private ICatchService m_catchService;
    private ITripService m_tripService;
    // private ClaimsPrincipal m_user;
    private ILogger<Functions> m_logger;

    public Functions(IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ILogger<Functions> logger)
    {
        m_claimHandler = claimHandler;
        m_catchService = catchService;
        m_tripService = tripService;
        m_logger = logger;
    }

    /// <summary>
    /// Default constructor.
    /// </summary>
    /// <remarks>
    /// The <see cref="ICalculatorService"/> implementation that we
    /// instantiated in <see cref="Startup"/> will be injected here.
    /// 
    /// As an alternative, a dependency could be injected into each 
    /// Lambda function handler via the [FromServices] attribute.
    /// </remarks>

    /// <summary>
    /// Root route that provides information about the other requests that can be made.
    /// </summary>
    /// <returns>API descriptions.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Get, "api/trip/")]
    public async Task<IHttpResult> GetTrips()
    {
        // string subjectClaim = m_claimHandler.ExtractSubject(m_user.Claims);
        string subjectClaim = "myprincipal";
        string view = "all";
        return await ExecuteService($"GetAllTrips tripId subject:[{subjectClaim}] view:[{view}]", async () => await m_tripService.GetTrips(subjectClaim, view));
    }

    private async Task<IHttpResult> ExecuteService<T>(string logDesc, Func<Task<HttpWrapper<T>>> func)
    {
        try
        {
            m_logger.LogInformation(logDesc);
            var result = await func();
            var httpResult = result.Result;
            m_logger.LogInformation($"response code:[{httpResult.StatusCode}] message:[{httpResult.Message}] object:[{httpResult.Object}]");
            if (httpResult.StatusCode == 200)
                return HttpResults.Ok(httpResult.Object);
            else
                return HttpResults.NewResult((System.Net.HttpStatusCode)httpResult.StatusCode, httpResult.Message);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"{logDesc} Exception {e.Message}");
            throw;
        }
    }

}
