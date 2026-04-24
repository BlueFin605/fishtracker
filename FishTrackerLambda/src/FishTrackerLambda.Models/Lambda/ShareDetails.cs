namespace FishTrackerLambda.Models.Lambda;

public record ShareDetails(
    string ShareId,
    string OwnerDisplayName,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ExpiresAt,
    bool FuzzLocation,
    string? Message,
    List<FrozenTripDto> Trips);
