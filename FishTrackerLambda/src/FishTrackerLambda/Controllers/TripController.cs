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
        return m_catchService.GetCatch(Guid.Parse(tripId), Guid.Parse(catchId));
    }

    // POST api/catch
    [HttpPost("{tripId}/catch")]
    public Task<CatchDetails> NewCatch([FromRoute] string tripId, [FromBody] NewCatch newCatch)
    {
        return m_catchService.NewCatch(Guid.Parse(tripId), newCatch);
    }
}