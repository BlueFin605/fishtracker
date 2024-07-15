namespace FishTrackerLambda.Models.Lambda;

public record class NewTrip(
    DateTimeOffset? startTime,
    //String timeZone,
    String notes,
    HashSet<TripTags> tags
);
