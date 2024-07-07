namespace FishTrackerLambda.Models.Lambda;

public record class UpdateCatchDetails(
    Guid? SpeciesId,
    Location? caughtLocation,
    DateTime? caughtWhen,
    FishSize? caughtSize,
    double? caughtLength,
    WeatherAttributes? weather);
