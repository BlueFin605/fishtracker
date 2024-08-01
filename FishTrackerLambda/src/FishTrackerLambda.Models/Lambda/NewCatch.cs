namespace FishTrackerLambda.Models.Lambda;

public record class NewCatch(
    String SpeciesId,
    Location caughtLocation,
    DateTimeOffset? caughtWhen,
    String? timeZone,
    FishSize caughtSize,
    double caughtLength);