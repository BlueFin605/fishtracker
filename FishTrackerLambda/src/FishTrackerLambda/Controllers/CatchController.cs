using Microsoft.AspNetCore.Mvc;
using FishTracker.Models.Lambda;
using FishTracker.Services;

namespace FishTracker.Controllers;

[Route("api/[controller]")]
public class CatchController : ControllerBase
{
    private readonly ICatchService m_catchService;

    private readonly ILogger<CatchController> m_logger;

    public CatchController(ICatchService catchService, ILogger<CatchController> logger)
    {
        m_catchService = catchService;
        m_logger = logger;
    }

    // GET api/catch/8e480c5f-11da-4922-8684-679b9b198a2e
    [HttpGet("{catchId}")]
    //[Route("api/catch/{catchId}")]
    public Task<CatchDetails> GetCatch([FromRoute] string catchId)
    {
        return m_catchService.GetCatch(Guid.Parse(catchId));
    }

    // POST api/catch
    [HttpPost]
    public Task<CatchDetails> NewCatch([FromBody] NewCatch newCatch)
    {
        return m_catchService.NewCatch(newCatch);
    }
}