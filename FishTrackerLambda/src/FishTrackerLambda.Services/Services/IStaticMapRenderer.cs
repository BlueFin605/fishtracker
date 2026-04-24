using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public interface IStaticMapRenderer
    {
        Task<byte[]> RenderAsync(
            IReadOnlyList<(Location Location, FishSize Size, string CatchId)> catches,
            CancellationToken ct);
    }

    public class StaticMapException : Exception
    {
        public StaticMapException(string msg) : base(msg) { }
        public StaticMapException(string msg, Exception inner) : base(msg, inner) { }
    }
}
