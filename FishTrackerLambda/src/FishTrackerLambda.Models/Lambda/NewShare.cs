namespace FishTrackerLambda.Models.Lambda;

public record NewShare(
    string[] TripIds,
    string RecipientEmail,
    bool FuzzLocation,
    int? ExpiresInDays,
    string? Message);
