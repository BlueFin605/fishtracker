using System.Net;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Contrib.HttpClient;
using Xunit;

namespace FishTrackerLambda.Tests
{
    public class GoogleStaticMapRendererTests
    {
        private static (GoogleStaticMapRenderer renderer, Mock<HttpMessageHandler> handler)
            MakeSut()
        {
            var handler = new Mock<HttpMessageHandler>();
            var client = handler.CreateClient();
            var renderer = new GoogleStaticMapRenderer(client, () => Task.FromResult("TEST_KEY"), NullLogger<GoogleStaticMapRenderer>.Instance);
            return (renderer, handler);
        }

        private static IEnumerable<(Location loc, FishSize size, string catchId)> MakeCatches(int n)
        {
            var sizes = new[] { FishSize.Undersize, FishSize.Small, FishSize.Medium, FishSize.Large, FishSize.VeryLarge };
            for (var i = 0; i < n; i++)
                yield return (new Location(144.96 + i * 0.001, -37.8 + i * 0.001), sizes[i % 5], $"c{i}");
        }

        [Fact]
        public async Task Render_CapsMarkersAt20_WhenInputExceeds()
        {
            var (renderer, handler) = MakeSut();
            handler.SetupRequest(HttpMethod.Get, r => true)
                   .ReturnsResponse(HttpStatusCode.OK, new byte[] { 1, 2, 3 }, "image/png");

            await renderer.RenderAsync(MakeCatches(50).ToList(), CancellationToken.None);

            handler.VerifyRequest(r => CountMarkers(r.RequestUri!.ToString()) <= 20, Times.Once());
        }

        [Fact]
        public async Task Render_UrlStaysUnder16kChars()
        {
            var (renderer, handler) = MakeSut();
            handler.SetupRequest(HttpMethod.Get, r => true)
                   .ReturnsResponse(HttpStatusCode.OK, new byte[] { 1, 2, 3 }, "image/png");

            await renderer.RenderAsync(MakeCatches(100).ToList(), CancellationToken.None);

            handler.VerifyRequest(r => r.RequestUri!.ToString().Length < 16_384, Times.Once());
        }

        [Fact]
        public async Task Render_HttpFailure_ThrowsStaticMapException()
        {
            var (renderer, handler) = MakeSut();
            handler.SetupRequest(HttpMethod.Get, r => true)
                   .ReturnsResponse(HttpStatusCode.InternalServerError);

            await Assert.ThrowsAsync<StaticMapException>(
                () => renderer.RenderAsync(MakeCatches(3).ToList(), CancellationToken.None));
        }

        [Fact]
        public async Task Render_ApiKey_IsNotInLogs()
        {
            // Logger spy
            var logged = new List<string>();
            var logger = new SpyLogger<GoogleStaticMapRenderer>(logged);
            var handler = new Mock<HttpMessageHandler>();
            var client = handler.CreateClient();
            handler.SetupRequest(HttpMethod.Get, r => true)
                   .ReturnsResponse(HttpStatusCode.OK, new byte[] { 1 }, "image/png");
            var renderer = new GoogleStaticMapRenderer(client, () => Task.FromResult("SENSITIVE_KEY_12345"), logger);

            await renderer.RenderAsync(MakeCatches(3).ToList(), CancellationToken.None);

            Assert.DoesNotContain(logged, s => s.Contains("SENSITIVE_KEY_12345"));
        }

        private static int CountMarkers(string url)
        {
            var idx = 0; var n = 0;
            while ((idx = url.IndexOf("markers=", idx, StringComparison.Ordinal)) >= 0) { n++; idx += 8; }
            return n;
        }
    }

    internal class SpyLogger<T> : Microsoft.Extensions.Logging.ILogger<T>
    {
        private readonly List<string> _sink;
        public SpyLogger(List<string> sink) { _sink = sink; }
        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;
        public bool IsEnabled(Microsoft.Extensions.Logging.LogLevel logLevel) => true;
        public void Log<TState>(Microsoft.Extensions.Logging.LogLevel logLevel, Microsoft.Extensions.Logging.EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => _sink.Add(formatter(state, exception));
        private class NullScope : IDisposable { public static NullScope Instance = new(); public void Dispose() {} }
    }
}
