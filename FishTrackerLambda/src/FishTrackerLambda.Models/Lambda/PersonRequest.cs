namespace FishTracker.Models.Lambda
{
    public record PersonRequest(
        string sessionId,
        string Name,
        string Email);
}

