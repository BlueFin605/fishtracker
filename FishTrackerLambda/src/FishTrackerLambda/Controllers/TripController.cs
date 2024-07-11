using Microsoft.AspNetCore.Mvc;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;

namespace FishTrackerLambda.Controllers;

[Route("api/[controller]")]
public class TripController : ControllerBase
{
    private readonly ICatchService m_catchService;
    private readonly ITripService m_tripService;
    private readonly IClaimHandler m_claimHandler;

    private readonly ILogger<TripController> m_logger;

    public TripController(IClaimHandler claimHandler, ICatchService catchService, ITripService tripService, ILogger<TripController> logger)
    {
        m_catchService = catchService;
        m_tripService = tripService;
        m_logger = logger;
        m_claimHandler = claimHandler;
    }

    [HttpGet]
    public Task<IEnumerable<TripDetails>> GetAllTrips()
    {
        try
        {
            //get the subject from the JWT access bearer token
            string subjectClaim = m_claimHandler.ExtractSubject(User.Claims);
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
            string subjectClaim = m_claimHandler.ExtractSubject(User.Claims);
            m_logger.LogInformation($"GetTrip tripId:[{subjectClaim}][{tripId}]");
            return m_tripService.GetTrip(subjectClaim, tripId);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetTrip Exception {e.Message}");
            throw;
        }
    }

    [HttpPost]
    public Task<TripDetails> NewTrip([FromBody] NewTrip newTrip)
    {
        try
        {
            string subjectClaim = m_claimHandler.ExtractSubject(User.Claims);
            m_logger.LogInformation($"NewTrip tripId:[{subjectClaim}]");
            return m_tripService.NewTrip(subjectClaim, newTrip);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"NewTrip Exception {e.Message}");
            throw;
        }
    }

    [HttpPut("{tripId}")]
    public Task<TripDetails> UpdateTrip([FromRoute] string tripId, [FromBody] TripDetails trip)
    {
        try
        {
            string subjectClaim = m_claimHandler.ExtractSubject(User.Claims);
            m_logger.LogInformation($"UpdateTrip tripId:[{subjectClaim}][{tripId}]");

            if (trip.tripId != tripId)
                throw new Exception($"Cannot change tripId from[{trip.tripId}] to[{tripId}]");

            return m_tripService.UpdateTrip(subjectClaim, trip);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"UpdateTrip Exception {e.Message}");
            throw;
        }
    }

    [HttpPatch("{tripId}")]
    public Task<TripDetails> PatchTrip([FromRoute] string tripId, [FromBody] UpdateTripDetails trip)
    {
        try
        {
            string subjectClaim = m_claimHandler.ExtractSubject(User.Claims);
            m_logger.LogInformation($"PatchTrip tripId:[{subjectClaim}][{tripId}]");
            return m_tripService.PatchTrip(subjectClaim, tripId, trip);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"PatchTrip Exception {e.Message}");
            throw;
        }
    }

    [HttpGet("{tripId}/catch")]
    public Task<IEnumerable<CatchDetails>> GetAllCatches([FromRoute] string tripId)
    {
        try
        {
            m_logger.LogInformation($"GetTripCatch tripId:[{tripId}]");
            return m_catchService.GetTripCatch(tripId);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetTripCatch Exception {e.Message}");
            throw;
        }
    }

    [HttpGet("{tripId}/catch/{catchId}")]
    public Task<CatchDetails> GetCatch([FromRoute] string tripId, [FromRoute] Guid catchId)
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
            return m_catchService.GetCatch(tripId, catchId);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"GetCatch Exception {e.Message}");
            throw;
        }
    }

    // POST api/catch
    [HttpPost("{tripId}/catch")]
    public Task<CatchDetails> NewCatch([FromRoute] string tripId, [FromBody] NewCatch newCatch)
    {
        try {
            m_logger.LogInformation($"NewCatch tripId:[{tripId}]");
            return m_catchService.NewCatch(tripId, newCatch);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"NewCatch Exception {e.Message}");
            throw;
        }
    }

    [HttpPut("{tripId}/catch/{catchId}")]
    public Task<CatchDetails> UpdateCatch([FromRoute] string tripId, [FromRoute] Guid catchId, [FromBody] CatchDetails updateCatch)
    {
        try
        {
            m_logger.LogInformation($"UpdateCatch tripId:[{tripId}] catchId:[${catchId}]");

            if (updateCatch.tripId != tripId)
                throw new Exception($"Cannot change tripId from[{updateCatch.tripId}] to[{tripId}]");

            if (updateCatch.catchId != catchId)
                throw new Exception($"Cannot change catchId from[{updateCatch.tripId}] to[{tripId}]");

            return m_catchService.UpdateCatch(updateCatch);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"UpdateCatch Exception {e.Message}");
            throw;
        }
    }

    [HttpPatch("{tripId}/catch/{catchId}")]
    public Task<CatchDetails> PatchCatch([FromRoute] string tripId, [FromRoute] Guid catchId, [FromBody] UpdateCatchDetails updateCatch)
    {
        try
        {
            m_logger.LogInformation($"PatchCatch tripId:[{tripId}] catchId:[${catchId}]");
            return m_catchService.PatchCatch(tripId, catchId, updateCatch);
        }
        catch (Exception e)
        {
            m_logger.LogError(e, $"PatchCatch Exception {e.Message}");
            throw;
        }
    }


}