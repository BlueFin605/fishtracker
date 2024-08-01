namespace FishTrackerLambda.Models.Lambda;

public record class UpdateCatchDetails(
    String? SpeciesId,
    Location? caughtLocation,
    DateTimeOffset? caughtWhen,
    FishSize? caughtSize,
    double? caughtLength,
    WeatherAttributes? weather);
