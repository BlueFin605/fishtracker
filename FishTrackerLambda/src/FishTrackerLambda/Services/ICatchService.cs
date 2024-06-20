using FishTracker.Models.Lambda;

namespace FishTracker.Services
{
    public interface ICatchService
    {
        Task<CatchDetails> GetCatch(Guid catchId);
        Task<CatchDetails> NewCatch(NewCatch newCatch);
    }
}

