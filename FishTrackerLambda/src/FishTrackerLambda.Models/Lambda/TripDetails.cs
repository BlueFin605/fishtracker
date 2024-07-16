namespace FishTrackerLambda.Models.Lambda;

public record class TripDetails(
    String subject,
    string tripId,
    DateTimeOffset startTime,
    DateTimeOffset? endTime,
    String notes,
    uint catchSize,
    TripRating rating,
    HashSet<TripTags> tags
);
