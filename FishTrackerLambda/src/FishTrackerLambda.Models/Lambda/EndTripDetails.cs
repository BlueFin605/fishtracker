namespace FishTrackerLambda.Models.Lambda;

public record class EndTripDetails(
    String? timeZone,
    DateTimeOffset? endTime,
    String? notes,
    TripRating? rating,
    HashSet<TripTags>? tags
);
