using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<HttpWrapper<CatchDetails>> GetCatch(string tripId, Guid catchId);
        Task<HttpWrapper<IEnumerable<CatchDetails>>> GetTripCatch(string tripId);
        Task<HttpWrapper<CatchDetails>> NewCatch(string tripId, NewCatch newCatch);
        Task<HttpWrapper<CatchDetails>> UpdateCatch(CatchDetails updateCatch);
        Task<HttpWrapper<CatchDetails>> PatchCatch(string tripId, Guid catchId, UpdateCatchDetails updateCatch);
    }
}

