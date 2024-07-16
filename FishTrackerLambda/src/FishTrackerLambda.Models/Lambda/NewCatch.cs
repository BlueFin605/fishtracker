namespace FishTrackerLambda.Models.Lambda;

public record class NewCatch(
    Guid SpeciesId,
    Location caughtLocation,
    DateTimeOffset caughtWhen,
    FishSize caughtSize,
    double caughtLength);