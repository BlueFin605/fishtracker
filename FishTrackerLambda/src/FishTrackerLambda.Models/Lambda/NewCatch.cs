namespace FishTrackerLambda.Models.Lambda;

public record class NewCatch(
    Guid SpeciesId,
    Location caughtLocation,
    DateTimeOffset? caughtWhen,
    String? timeZone,
    FishSize caughtSize,
    double caughtLength);