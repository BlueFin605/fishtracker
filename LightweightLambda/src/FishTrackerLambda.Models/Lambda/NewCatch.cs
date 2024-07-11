namespace FishTrackerLambda.Models.Lambda;

public record class NewCatch(
    Guid SpeciesId,
    Location caughtLocation,
    DateTime caughtWhen,
    FishSize caughtSize,
    double caughtLength);