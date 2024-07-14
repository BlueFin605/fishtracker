namespace FishTrackerLambda.Models.Lambda;

public record class NewTrip(
    DateTime? startTime,
    String notes,
    HashSet<TripTags> tags

);
