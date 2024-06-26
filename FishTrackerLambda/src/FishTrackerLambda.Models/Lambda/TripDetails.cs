﻿namespace FishTrackerLambda.Models.Lambda;

public record class TripDetails(
    String subject,
    Guid tripId,
    DateTime startTime,
    DateTime? endtime,
    String notes,
    uint catchSize,
    TripRating rating,
    List<TripTags> tags
);
