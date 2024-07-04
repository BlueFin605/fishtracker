namespace FishTrackerLambda.Models.Lambda;

public record class TripDetails(
    String subject,
    Guid tripId,
    DateTime startTime,
    DateTime? endTime,
    String notes,
    uint catchSize,
    TripRating rating,
    HashSet<TripTags> tags
);
