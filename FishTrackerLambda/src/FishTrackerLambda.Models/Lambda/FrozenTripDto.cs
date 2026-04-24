namespace FishTrackerLambda.Models.Lambda;

public record FrozenTripDto(
    string TripId,
    DateTimeOffset StartTime,
    DateTimeOffset? EndTime,
    string Notes,
    TripRating Rating,
    List<TripTags> Tags,
    string[] Species,
    string DefaultSpecies,
    List<FrozenCatchDto> Catches);
