using System;
using System.Text.Json.Serialization;

namespace FishTracker.Models.Lambda;

public record class CatchDetails(
    Guid catchId,
    Guid TripId,
    Guid SpeciesId,
    Location caughtLocation,
    DateTime caughtWhen,
    FishSize caughtSize,
    double caughtLength,
    WeatherAttributes? weather);
