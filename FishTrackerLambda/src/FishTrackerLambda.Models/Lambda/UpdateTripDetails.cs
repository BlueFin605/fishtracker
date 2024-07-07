namespace FishTrackerLambda.Models.Lambda;

public record class UpdateTripDetails(
    DateTime? startTime,
    DateTime? endTime,
    String? notes,
    uint? catchSize,
    TripRating? rating,
    HashSet<TripTags>? tags
);
