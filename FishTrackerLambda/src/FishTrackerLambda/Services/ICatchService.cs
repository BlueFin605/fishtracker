using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<CatchDetails> GetCatch(Guid tripId, Guid catchId);
        Task<IEnumerable<CatchDetails>> GetTripCatch(Guid tripId);
        Task<CatchDetails> NewCatch(Guid tripId, NewCatch newCatch);
    }
}

