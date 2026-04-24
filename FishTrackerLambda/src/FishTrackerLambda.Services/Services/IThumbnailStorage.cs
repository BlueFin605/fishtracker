namespace FishTrackerLambda.Services
{
    public interface IThumbnailStorage
    {
        Task<string> PutAsync(string shareId, byte[] png, CancellationToken ct);
        Task DeleteAsync(string key, CancellationToken ct);
        string PublicUrl(string key);
    }
}
