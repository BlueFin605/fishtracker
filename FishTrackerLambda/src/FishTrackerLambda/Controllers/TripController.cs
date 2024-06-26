using Microsoft.AspNetCore.Mvc;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;

namespace FishTrackerLambda.Controllers;

[Route("api/[controller]")]
public class TripController : ControllerBase
{
    private readonly ICatchService m_catchService;

    private readonly ILogger<TripController> m_logger;

    public TripController(ICatchService catchService, ILogger<TripController> logger)
    {
        m_catchService = catchService;
        m_logger = logger;
    }

    // GET api/catch/8e480c5f-11da-4922-8684-679b9b198a2e
    [HttpGet("{tripId}/catch/{catchId}")]
    //[Route("api/catch/{catchId}")]
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

    [HttpGet("{tripId}/catch")]
    //[Route("api/catch/{catchId}")]
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