﻿using System;
using System.Text.Json.Serialization;

namespace FishTrackerLambda.Models.Lambda;

public record class CatchDetails(
    Guid tripId,
    Guid catchId,
    Guid SpeciesId,
    Location caughtLocation,
    DateTime caughtWhen,
    FishSize caughtSize,
    double caughtLength,
    WeatherAttributes? weather);
