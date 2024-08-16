using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ITripService
    {
        Task<HttpWrapper<TripDetails>> GetTrip(string subject, string tripId);
        Task<HttpWrapper<IEnumerable<TripDetails>>> GetTrips(string subject, string? view);
        Task<HttpWrapper<TripDetails>> NewTrip(string subject, NewTrip newTrip);
        Task<HttpWrapper<TripDetails>> UpdateTrip(string subject, string tripId, TripDetails trip);
        Task<HttpWrapper<TripDetails>> PatchTrip(string subject, string tripId, UpdateTripDetails trip);
        Task<HttpWrapper<IEnumerable<CatchDetails>>> DeleteTrip(string subject, string tripId);
        Task<HttpWrapper<IEnumerable<CatchDetails>>> FixTrips();
        Task<HttpWrapper<TripDetails>> EndTrip(string subject, string tripId, EndTripDetails trip);
    }
}

