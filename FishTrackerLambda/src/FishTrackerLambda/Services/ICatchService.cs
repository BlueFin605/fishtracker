using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<CatchDetails> GetCatch(Guid catchId, Guid tripId);
        Task<CatchDetails> NewCatch(Guid tripId, NewCatch newCatch);
    }
}

