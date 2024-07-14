using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ITripService
    {
        Task<HttpWrapper<TripDetails>> GetTrip(string subject, string tripId);
        Task<HttpWrapper<IEnumerable<TripDetails>>> GetTrips(string subject);
        Task<HttpWrapper<TripDetails>> NewTrip(string subject, NewTrip newTrip);
        Task<HttpWrapper<TripDetails>> UpdateTrip(string subject, TripDetails trip);
        Task<HttpWrapper<TripDetails>> PatchTrip(string subject, string tripId, UpdateTripDetails trip);
    }
}

