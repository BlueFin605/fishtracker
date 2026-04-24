using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ILocationFuzzer
    {
        Location Fuzz(Location original, string shareId, string catchId);
    }
}
