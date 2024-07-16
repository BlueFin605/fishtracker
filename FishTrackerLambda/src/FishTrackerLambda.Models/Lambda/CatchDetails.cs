using System;
using System.Text.Json.Serialization;

namespace FishTrackerLambda.Models.Lambda;

public record class CatchDetails(
    string tripId,
    Guid catchId,
    Guid SpeciesId,
    Location caughtLocation,
    DateTimeOffset caughtWhen,
    FishSize caughtSize,
    double caughtLength,
    WeatherAttributes? weather);
