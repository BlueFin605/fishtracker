using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public record OwnedCatch(
        string CatchId,
        string SpeciesId,
        Location CaughtLocation,
        DateTimeOffset CaughtWhen,
        FishSize CaughtSize,
        double CaughtLength,
        WeatherAttributes? Weather);

    public record OwnedTrip(
        string TripId,
        DateTimeOffset StartTime,
        DateTimeOffset? EndTime,
        string Notes,
        TripRating Rating,
        List<TripTags> Tags,
        string[] Species,
        string DefaultSpecies,
        List<OwnedCatch> Catches);

    public interface ITripLookup
    {
        /// <summary>Returns only trips that belong to the given owner, with their catches loaded.</summary>
        Task<List<OwnedTrip>> GetOwnedTrips(string ownerSubject, string[] tripIds);
    }
}
