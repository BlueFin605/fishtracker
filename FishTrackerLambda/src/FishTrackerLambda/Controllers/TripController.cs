using Microsoft.AspNetCore.Mvc;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;

namespace FishTrackerLambda.Controllers;

[Route("api/[controller]")]
public class TripController : ControllerBase
{
    private readonly ICatchService m_catchService;
    private readonly ITripService m_tripService;

    private readonly ILogger<TripController> m_logger;

    public TripController(ICatchService catchService, ITripService tripService, ILogger<TripController> logger)
    {
        m_catchService = catchService;
        m_tripService = tripService;
        m_logger = logger;
    }

    [HttpGet("{tripId}/catch/{catchId}")]
    public Task<CatchDetails> GetCatch([FromRoute] string tripId, [FromRoute] string catchId)
    {
        try
        {
            var claims = User.Claims; 
            m_logger.LogInformation("Claims:");
            foreach (var claim in claims)
            {
                m_logger.LogInformation($"{claim.Type}: {claim.Value}");
            }

            m_logger.LogInformation($"GetCatch tripId:[{tripId}] catchId:[${catchId}]");
            return m_catchService.GetCatch(Guid.Parse(tripId), Guid.Parse(catchId));
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetCatch Exception {e.Message}");
            throw;
        }
    }

    [HttpGet]
    public Task<IEnumerable<TripDetails>> GetAllTrips()
    {
        try
        {
            //get the subject from the JWT access bearer token
            string subjectClaim = LocateSubject();
            m_logger.LogInformation($"GetAllTrips tripId:[{subjectClaim}]");
            return m_tripService.GetTrips(subjectClaim);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetAllTrips Exception {e.Message}");
            throw;
        }
    }

    [HttpGet("{tripId}")]
    public Task<TripDetails> GetTrip([FromRoute] string tripId)
    {
        try
        {
            //get the subject from the JWT access bearer token
            string subjectClaim = LocateSubject();
            m_logger.LogInformation($"GetTrip tripId:[{subjectClaim}][{tripId}]");
            return m_tripService.GetTrip(subjectClaim, Guid.Parse(tripId));
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetTrip Exception {e.Message}");
            throw;
        }
    }

    private string LocateSubject()
    {
        var claims = User.Claims;
        var subjectClaim = claims.FirstOrDefault(claim => claim.Type == "principalId")?.Value ?? throw new Exception("No Subject[principalId] in claim");
        return subjectClaim;
    }

    [HttpPost]
    public Task<TripDetails> NewTrip([FromBody] NewTrip newTrip)
    {
        try
        {
            string subjectClaim = LocateSubject();
            m_logger.LogInformation($"NewTrip tripId:[{subjectClaim}]");
            return m_tripService.NewTrip(subjectClaim, newTrip);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"NewTrip Exception {e.Message}");
            throw;
        }
    }

    [HttpGet("{tripId}/catch")]
    public Task<IEnumerable<CatchDetails>> GetTripCatch([FromRoute] string tripId)
    {
        try
        {
            m_logger.LogInformation($"GetTripCatch tripId:[{tripId}]");
            return m_catchService.GetTripCatch(Guid.Parse(tripId));
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetTripCatch Exception {e.Message}");
            throw;
        }
    }

    // POST api/catch
    [HttpPost("{tripId}/catch")]
    public Task<CatchDetails> NewCatch([FromRoute] string tripId, [FromBody] NewCatch newCatch)
    {
        try {
            m_logger.LogInformation($"NewCatch tripId:[{tripId}]");
            return m_catchService.NewCatch(Guid.Parse(tripId), newCatch);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"NewCatch Exception {e.Message}");
            throw;
        }
    }
}