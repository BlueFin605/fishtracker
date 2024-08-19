using Amazon.Lambda.Core;
using Amazon.Lambda.Annotations;
using Amazon.Lambda.Annotations.APIGateway;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.Services;
using System.Text.Json.Serialization;
using FishTrackerLambda.Functional;
using Microsoft.Extensions.Logging;
using Amazon.Lambda.APIGatewayEvents;
using System.Text.Json;
using FishTrackerLambda.Models.Lambda;
using System.Security.Claims;

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

    private JsonSerializerOptions m_jsonOptions;
    public Functions(IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ILogger<Functions> logger)
    {
        m_claimHandler = claimHandler;
        m_catchService = catchService;
        m_tripService = tripService;
        m_logger = logger;

        m_jsonOptions = new JsonSerializerOptions
        {
            Converters = { new JsonStringEnumConverter() }
        };
    }

    /// <summary>
    /// Get all trips.
    /// </summary>
    /// <returns>List of trips.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Get, "api/trip/")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> GetTrips([FromQuery] string? view, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"GetAllTrips subject:[{subjectClaim}] view:[{view}]", async () => await m_tripService.GetTrips(subjectClaim, view));
    }

    /// <summary>
    /// Get a specific trip by ID.
    /// </summary>
    /// <returns>Trip details.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Get, "api/trip/{tripId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> GetTrip(string tripId, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"GetTrip tripId:[{subjectClaim}][{tripId}]", async () => await m_tripService.GetTrip(subjectClaim, tripId));
    }

    /// <summary>
    /// Delete a specific trip by ID.
    /// </summary>
    /// <returns>Deletion result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Delete, "api/trip/{tripId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> DeleteTrip(string tripId, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"DeleteTrip tripId:[{subjectClaim}][{tripId}]", async () => await m_tripService.DeleteTrip(subjectClaim, tripId));
    }

    /// <summary>
    /// Create a new trip.
    /// </summary>
    /// <returns>Creation result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Post, "api/trip")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> CreateTrip([FromBody] NewTrip trip, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"CreateTrip subject:[{subjectClaim}]", async () => await m_tripService.NewTrip(subjectClaim, trip));
    }

    /// <summary>
    /// Update an existing trip by ID.
    /// </summary>
    /// <returns>Update result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Put, "api/trip/{tripId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> UpdateTrip(string tripId, [FromBody] TripDetails trip, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"UpdateTrip tripId:[{subjectClaim}][{tripId}]", async () => await m_tripService.UpdateTrip(subjectClaim, tripId, trip));
    }

    /// <summary>
    /// Update an existing trip by ID.
    /// </summary>
    /// <returns>Update result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Patch, "api/trip/{tripId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> PatchTrip(string tripId, [FromBody] UpdateTripDetails trip, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"PatchTrip tripId:[{subjectClaim}][{tripId}]", async () => await m_tripService.PatchTrip(subjectClaim, tripId, trip));
    }

    /// <summary>
    /// End trip by ID.
    /// </summary>
    /// <returns>End trip.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Patch, "api/trip/{tripId}/endtrip")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> EndTrip(string tripId, [FromBody] EndTripDetails trip, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"EndTrip tripId:[{subjectClaim}][{tripId}]", async () => await m_tripService.EndTrip(subjectClaim, tripId, trip));
    }

    /// <summary>
    /// Get all catches for a trip.
    /// </summary>
    /// <returns>List of catches.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Get, "api/trip/{tripId}/catch")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> GetCatches(string tripId, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"GetCatches tripId:[{tripId}]", async () => await m_catchService.GetTripCatch(subjectClaim, tripId));
    }

    /// <summary>
    /// Get a specific catch by ID.
    /// </summary>
    /// <returns>Catch details.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Get, "api/trip/{tripId}/catch/{catchId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> GetCatch(string tripId, Guid catchId, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"GetCatch tripId:[{tripId}] catchId:[{catchId}]", async () => await m_catchService.GetCatch(subjectClaim, tripId, catchId));
    }

    /// <summary>
    /// Create a new catch for a trip.
    /// </summary>
    /// <returns>Creation result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Post, "api/trip/{tripId}/catch")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> NewCatch(string tripId, [FromBody] NewCatch newCatch, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"NewCatch tripId:[{tripId}]", async () => await m_catchService.NewCatch(subjectClaim, tripId, newCatch));
    }

    /// <summary>
    /// Update an existing catch for a trip.
    /// </summary>
    /// <returns>Update result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Put, "api/trip/{tripId}/catch/{catchId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> UpdateCatch(string tripId, Guid catchId, [FromBody] CatchDetails updateCatch, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"UpdateCatch tripId:[{tripId}] catchId:[{catchId}]", async () => await m_catchService.UpdateCatch(subjectClaim, tripId, catchId, updateCatch));
    }

    /// <summary>
    /// Patch an existing catch for a trip.
    /// </summary>
    /// <returns>Patch result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Patch, "api/trip/{tripId}/catch/{catchId}")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> PatchCatch(string tripId, Guid catchId, [FromBody] UpdateCatchDetails updateCatch, APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"PatchCatch tripId:[{tripId}] catchId:[{catchId}]", async () => await m_catchService.PatchCatch(subjectClaim, tripId, catchId, updateCatch));
    }

    /// <summary>
    /// Fix trips.
    /// </summary>
    /// <returns>Fix result.</returns>
    [LambdaFunction()]
    [HttpApi(LambdaHttpMethod.Patch, "api/fix")]
    public async Task<APIGatewayHttpApiV2ProxyResponse> FixTrips(APIGatewayHttpApiV2ProxyRequest proxy)
    {
        string subjectClaim = m_claimHandler.ExtractSubject(proxy);
        return await ExecuteService($"Fix", async () => await m_tripService.FixTrips());
    }


    private async Task<APIGatewayHttpApiV2ProxyResponse> ExecuteService<T>(string logDesc, Func<Task<HttpWrapper<T>>> func)
    {
        try
        {

            m_logger.LogInformation(logDesc);
            var result = await func();
            var httpResult = result.Result;
            m_logger.LogInformation($"response code:[{httpResult.StatusCode}] message:[{httpResult.Message}] object:[{httpResult.Object}]");
            if (httpResult.StatusCode == 200)
            {
                var resp = new APIGatewayHttpApiV2ProxyResponse();
                resp.StatusCode = 200;
                resp.Body = JsonSerializer.Serialize(httpResult.Object, m_jsonOptions);
                resp.Headers = new Dictionary<string, string> { { "Content-Type", "application/json" } };
                return resp;
                //return HttpResults.Ok(httpResult.Object).AddHeader("target-language", "mylang");
            }
            else
            {
                var resp = new APIGatewayHttpApiV2ProxyResponse();
                resp.StatusCode = httpResult.StatusCode;
                resp.Body = httpResult.Message;
                return resp;
                //HttpResults.NewResult((System.Net.HttpStatusCode)httpResult.StatusCode, httpResult.Message);
            }
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"{logDesc} Exception {e.Message}");
            throw;
        }
    }

}
