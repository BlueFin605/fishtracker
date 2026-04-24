namespace FishTrackerLambda.Models.Lambda;

public record ShareSummary(
    string ShareId,
    string OwnerDisplayName,
    string RecipientEmail,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? RevokedAt,
    int TripCount,
    int CatchCount,
    int ViewCount,
    DateTimeOffset? LastViewedAt);
