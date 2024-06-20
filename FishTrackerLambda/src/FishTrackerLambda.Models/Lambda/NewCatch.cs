namespace FishTracker.Models.Lambda;

public record class NewCatch(
    Guid TripId,
    Guid SpeciesId,
    Location caughtLocation,
    DateTime caughtWhen,
    FishSize caughtSize,
    double caughtLength);