using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<HttpWrapper<CatchDetails>> GetCatch(string subject, string tripId, Guid catchId);
        Task<HttpWrapper<IEnumerable<CatchDetails>>> GetTripCatch(string subject, string tripId);
        Task<HttpWrapper<CatchDetails>> NewCatch(string subject, string tripId, NewCatch newCatch);
        Task<HttpWrapper<CatchDetails>> UpdateCatch(string subject, string tripId, Guid catchId, CatchDetails updateCatch);
        Task<HttpWrapper<CatchDetails>> PatchCatch(string subject, string tripId, Guid catchId, UpdateCatchDetails updateCatch);
    }
}

