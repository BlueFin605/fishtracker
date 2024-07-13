using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<HttpWrapper<CatchDetails>> GetCatch(string tripId, Guid catchId);
        Task<IEnumerable<CatchDetails>> GetTripCatch(string tripId);
        Task<CatchDetails> NewCatch(string tripId, NewCatch newCatch);
        Task<CatchDetails> UpdateCatch(CatchDetails updateCatch);
        Task<CatchDetails> PatchCatch(string tripId, Guid catchId, UpdateCatchDetails updateCatch);
    }
}

