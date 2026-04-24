namespace FishTrackerLambda.Models.Lambda;

public record FrozenCatchDto(
    string CatchId,
    string SpeciesId,
    Location DisplayLocation,
    DateTimeOffset CaughtWhen,
    FishSize CaughtSize,
    double CaughtLength,
    WeatherAttributes? Weather);
