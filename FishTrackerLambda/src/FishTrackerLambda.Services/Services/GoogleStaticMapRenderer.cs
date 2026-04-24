using System.Net;
using System.Text;
using FishTrackerLambda.Models.Lambda;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public class GoogleStaticMapRenderer : IStaticMapRenderer
    {
        private const int MaxMarkers = 20;
        private const int MaxUrlLength = 16_384;
        private const string Endpoint = "https://maps.googleapis.com/maps/api/staticmap";

        private static readonly Dictionary<FishSize, string> ColorByFishSize = new()
        {
            [FishSize.Undersize] = "gray",
            [FishSize.Small]     = "blue",
            [FishSize.Medium]    = "green",
            [FishSize.Large]     = "orange",
            [FishSize.VeryLarge] = "red"
        };

        private readonly HttpClient _http;
        private readonly Func<Task<string>> _keyProvider;
        private readonly ILogger<GoogleStaticMapRenderer> _log;

        public GoogleStaticMapRenderer(HttpClient http, Func<Task<string>> keyProvider, ILogger<GoogleStaticMapRenderer> log)
        {
            _http = http;
            _keyProvider = keyProvider;
            _log = log;
        }

        public async Task<byte[]> RenderAsync(
            IReadOnlyList<(Location Location, FishSize Size, string CatchId)> catches,
            CancellationToken ct)
        {
            if (catches.Count == 0)
                throw new StaticMapException("No catches to render");

            var sampled = SampleEvenly(catches, MaxMarkers);
            var apiKey  = await _keyProvider();
            var url     = BuildUrl(sampled, apiKey);

            if (url.Length >= MaxUrlLength)
                throw new StaticMapException($"Static-map URL too long: {url.Length} chars");

            _log.LogInformation("Rendering static map: {Count} markers, url length {Len}",
                sampled.Count, url.Length);   // deliberately does not log URL itself

            using var resp = await _http.GetAsync(url, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _log.LogWarning("Static map HTTP {Status}", (int)resp.StatusCode);
                throw new StaticMapException($"Static map HTTP {(int)resp.StatusCode}");
            }

            return await resp.Content.ReadAsByteArrayAsync(ct);
        }

        private static List<(Location Location, FishSize Size, string CatchId)> SampleEvenly(
            IReadOnlyList<(Location Location, FishSize Size, string CatchId)> source, int cap)
        {
            if (source.Count <= cap) return source.ToList();
            var step = (double)source.Count / cap;
            var picks = new List<(Location Location, FishSize Size, string CatchId)>(cap);
            for (var i = 0; i < cap; i++)
                picks.Add(source[(int)(i * step)]);
            return picks;
        }

        private static string BuildUrl(
            IReadOnlyList<(Location Location, FishSize Size, string CatchId)> catches,
            string apiKey)
        {
            var sb = new StringBuilder(Endpoint);
            sb.Append("?size=600x300&maptype=terrain");
            foreach (var c in catches)
            {
                var color = ColorByFishSize.TryGetValue(c.Size, out var hex) ? hex : "gray";
                sb.Append("&markers=color:").Append(color)
                  .Append('|').Append(c.Location.Latitude.ToString("F6"))
                  .Append(',').Append(c.Location.Longitude.ToString("F6"));
            }
            sb.Append("&key=").Append(Uri.EscapeDataString(apiKey));
            return sb.ToString();
        }
    }
}
