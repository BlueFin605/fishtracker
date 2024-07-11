using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface ITripService
    {
        Task<TripDetails> GetTrip(string subject, string tripId);
        Task<IEnumerable<TripDetails>> GetTrips(string subject);
        Task<TripDetails> NewTrip(string subject, NewTrip newTrip);
        Task<TripDetails> UpdateTrip(string subject, TripDetails trip);
        Task<TripDetails> PatchTrip(string subject, string tripId, UpdateTripDetails trip);
    }
}

