using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ICatchService
    {
        Task<CatchDetails> GetCatch(Guid catchId);
        Task<CatchDetails> NewCatch(NewCatch newCatch);
    }
}

