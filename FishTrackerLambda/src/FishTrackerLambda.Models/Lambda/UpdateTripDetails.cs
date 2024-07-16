namespace FishTrackerLambda.Models.Lambda;

public record class UpdateTripDetails(
    DateTimeOffset? startTime,
    DateTimeOffset? endTime,
    String? notes,
    uint? catchSize,
    TripRating? rating,
    HashSet<TripTags>? tags
);
