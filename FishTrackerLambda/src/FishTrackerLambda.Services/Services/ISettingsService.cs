using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ISettingsService
    {
        Task<HttpWrapper<SettingsDetails>> GetSettings();
        Task<HttpWrapper<SettingsDetails>> UpdateSettings(SettingsDetails updateCatch);
    }
}

