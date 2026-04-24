namespace FishTrackerLambda.Services
{
    public record ShareEmailContext(
        string ShareId,
        string OwnerDisplayName,
        string RecipientEmail,
        int TripCount,
        int CatchCount,
        string? Message,
        string? ThumbnailUrl,
        string ViewUrl,
        DateTimeOffset? ExpiresAt);

    public interface IShareEmailer
    {
        Task SendAsync(ShareEmailContext ctx, CancellationToken ct);
    }
}
