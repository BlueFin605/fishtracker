namespace FishTrackerLambda.Models.Lambda;

public record class TripDetails(
    string sub,
    Guid tripId,
    DateTime startTime,
    DateTime? endtime,
    String notes,
    uint catchSize,
    TripRating rating,
    List<TripTags> tags
);

public record class NewTrip(
    string sub,
    DateTime startTime,
    String notes
);
