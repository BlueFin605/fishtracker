namespace FishTrackerLambda.Models.Lambda;

public record class UpdateCatchDetails(
    Guid? SpeciesId,
    Location? caughtLocation,
    DateTimeOffset? caughtWhen,
    FishSize? caughtSize,
    double? caughtLength,
    WeatherAttributes? weather);
