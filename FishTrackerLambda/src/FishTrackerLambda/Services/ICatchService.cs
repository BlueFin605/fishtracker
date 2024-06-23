using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<CatchDetails> GetCatch(Guid tripId, Guid catchId);
        Task<CatchDetails> NewCatch(Guid tripId, NewCatch newCatch);
    }
}

