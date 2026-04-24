using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using FishTrackerLambda.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Moq;
using Xunit;

namespace FishTrackerLambda.Tests
{
    /// <summary>
    /// In-memory <see cref="IShareRepository"/> for endpoint integration tests — emulates
    /// the DynamoDB-backed implementation enough for the share lifecycle to round-trip
    /// through the minimal-API endpoints.
    /// </summary>
    internal class InMemoryShareRepository : IShareRepository
    {
        private readonly Dictionary<string, DynamoDbShare> _byShareId = new();

        public Task<DynamoDbShare?> GetByOwner(string ownerSubject, string shareId)
        {
            _byShareId.TryGetValue(shareId, out var s);
            return Task.FromResult(s != null && s.OwnerSubject == ownerSubject ? s : null);
        }

        public Task<List<DynamoDbShare>> ListByOwner(string ownerSubject) =>
            Task.FromResult(_byShareId.Values.Where(s => s.OwnerSubject == ownerSubject).ToList());

        public Task<DynamoDbShare?> GetByShareId(string shareId)
        {
            _byShareId.TryGetValue(shareId, out var s);
            return Task.FromResult(s);
        }

        public Task<List<DynamoDbShare>> ListByRecipientEmail(string lowerCaseEmail) =>
            Task.FromResult(_byShareId.Values
                .Where(s => string.Equals(s.RecipientEmail, lowerCaseEmail, StringComparison.OrdinalIgnoreCase))
                .ToList());

        public Task<DynamoDbShare> Save(DynamoDbShare share)
        {
            _byShareId[share.ShareId] = share;
            return Task.FromResult(share);
        }

        public Task<DynamoDbShare> Update(DynamoDbShare share)
        {
            _byShareId[share.ShareId] = share;
            return Task.FromResult(share);
        }
    }

    /// <summary>
    /// Stub <see cref="IClaimHandler"/> whose returned values are reconfigurable per-test.
    /// The endpoints inject this via DI; tests adjust the desired-caller fields between calls.
    /// </summary>
    internal class StubClaimHandler : IClaimHandler
    {
        public string Subject { get; set; } = "alice";
        public string Email { get; set; } = "alice@example.com";
        public bool EmailVerified { get; set; } = true;
        public string DisplayName { get; set; } = "Alice";

        public string ExtractSubject(IEnumerable<Claim> claims) => Subject;
        public string ExtractSubject(Amazon.Lambda.APIGatewayEvents.APIGatewayHttpApiV2ProxyRequest proxy) => Subject;
        public string ExtractEmail(IEnumerable<Claim> claims) => Email;
        public bool ExtractEmailVerified(IEnumerable<Claim> claims) => EmailVerified;
        public string ExtractDisplayName(IEnumerable<Claim> claims) => DisplayName;
    }

    public class ShareControllerTests : IAsyncLifetime
    {
        private WebApplication _app = null!;
        private HttpClient _client = null!;
        private StubClaimHandler _claims = null!;
        private InMemoryShareRepository _repo = null!;
        private Mock<ITripLookup> _tripLookup = null!;
        private Mock<IShareEmailer> _emailer = null!;
        private Mock<IStaticMapRenderer> _renderer = null!;
        private Mock<IThumbnailStorage> _thumbs = null!;

        private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
        {
            Converters = { new JsonStringEnumConverter() },
            PropertyNameCaseInsensitive = true
        };

        public async Task InitializeAsync()
        {
            _claims = new StubClaimHandler();
            _repo = new InMemoryShareRepository();
            _tripLookup = new Mock<ITripLookup>();
            _emailer = new Mock<IShareEmailer>();
            _renderer = new Mock<IStaticMapRenderer>();
            _thumbs = new Mock<IThumbnailStorage>();

            // Default outgoing-side stubs so NewShare's best-effort thumbnail/email steps don't blow up.
            _renderer.Setup(r => r.RenderAsync(It.IsAny<IReadOnlyList<(Location, FishSize, string)>>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(new byte[] { 1, 2, 3 });
            _thumbs.Setup(t => t.PutAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
                   .ReturnsAsync((string id, byte[] _, CancellationToken __) => $"shares/{id}.png");
            _thumbs.Setup(t => t.PublicUrl(It.IsAny<string>()))
                   .Returns<string>(k => $"https://thumbs.example.com/{k}");
            _emailer.Setup(e => e.SendAsync(It.IsAny<ShareEmailContext>(), It.IsAny<CancellationToken>()))
                    .Returns(Task.CompletedTask);

            var builder = WebApplication.CreateBuilder();
            builder.WebHost.UseTestServer();

            builder.Services.AddSingleton<IClaimHandler>(_claims);
            builder.Services.AddSingleton<IShareRepository>(_repo);
            builder.Services.AddSingleton<ILocationFuzzer, LocationFuzzer>();
            builder.Services.AddSingleton(_tripLookup.Object);
            builder.Services.AddSingleton(_emailer.Object);
            builder.Services.AddSingleton(_renderer.Object);
            builder.Services.AddSingleton(_thumbs.Object);
            // Stand-ins for trip/catch/profile/settings services because MapRoutes wires their
            // endpoints too — endpoints we don't exercise still need the dependency present for
            // the route-delegate factory.
            builder.Services.AddSingleton(Mock.Of<ICatchService>());
            builder.Services.AddSingleton(Mock.Of<ITripService>());
            builder.Services.AddSingleton(Mock.Of<ISettingsService>());
            builder.Services.AddSingleton(Mock.Of<IProfileService>());
            builder.Services.AddSingleton<IShareService>(sp => new ShareService(
                sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<ShareService>>(),
                sp.GetRequiredService<IShareRepository>(),
                sp.GetRequiredService<ILocationFuzzer>(),
                sp.GetRequiredService<IStaticMapRenderer>(),
                sp.GetRequiredService<IThumbnailStorage>(),
                sp.GetRequiredService<IShareEmailer>(),
                sp.GetRequiredService<ITripLookup>(),
                "https://example.com/shared"));
            builder.Services.ConfigureHttpJsonOptions(o =>
            {
                o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
                o.SerializerOptions.PropertyNameCaseInsensitive = true;
            });

            _app = builder.Build();

            // Inject a synthetic empty ClaimsPrincipal — the endpoints take ClaimsPrincipal as a
            // parameter, but the route handlers route through the StubClaimHandler for actual
            // claim values; the parameter binder still needs SOMETHING non-null.
            _app.Use(async (ctx, next) =>
            {
                ctx.User = new ClaimsPrincipal(new ClaimsIdentity());
                await next();
            });

            _app.MapRoutes();

            await _app.StartAsync();
            _client = _app.GetTestClient();
        }

        public async Task DisposeAsync()
        {
            _client?.Dispose();
            if (_app is not null)
            {
                await _app.StopAsync();
                await _app.DisposeAsync();
            }
        }

        private static List<OwnedTrip> OneOwnedTrip(string tripId = "t1") => new()
        {
            new OwnedTrip(
                tripId,
                DateTimeOffset.UtcNow.AddHours(-2),
                DateTimeOffset.UtcNow.AddHours(-1),
                "notes",
                TripRating.Good,
                new List<TripTags>(),
                new[] { "snapper" },
                "snapper",
                new List<OwnedCatch>
                {
                    new OwnedCatch("c1", "snapper",
                        new Location(174.7, -36.8),
                        DateTimeOffset.UtcNow.AddMinutes(-30),
                        FishSize.Medium, 32.5, null)
                })
        };

        [Fact]
        public async Task Post_CreatesShare_Returns200_WithShareId()
        {
            _claims.Subject = "alice";
            _claims.DisplayName = "Alice";
            _tripLookup.Setup(t => t.GetOwnedTrips("alice", It.Is<string[]>(ids => ids.SequenceEqual(new[] { "t1" }))))
                       .ReturnsAsync(OneOwnedTrip());

            var resp = await _client.PostAsJsonAsync("/api/share",
                new NewShare(new[] { "t1" }, "bob@example.com", true, 30, "Have a look"),
                Json);

            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<CreateShareResponse>(Json);
            Assert.NotNull(body);
            Assert.False(string.IsNullOrWhiteSpace(body!.ShareId));
        }

        [Fact]
        public async Task Get_OutboxList_ReturnsCreatedShare()
        {
            _claims.Subject = "alice";
            _claims.DisplayName = "Alice";
            _tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>())).ReturnsAsync(OneOwnedTrip());

            var createResp = await _client.PostAsJsonAsync("/api/share",
                new NewShare(new[] { "t1" }, "bob@example.com", false, null, null), Json);
            createResp.EnsureSuccessStatusCode();
            var created = (await createResp.Content.ReadFromJsonAsync<CreateShareResponse>(Json))!;

            var listResp = await _client.GetAsync("/api/share?direction=outbox");
            Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);

            var summaries = await listResp.Content.ReadFromJsonAsync<List<ShareSummary>>(Json);
            Assert.NotNull(summaries);
            Assert.Contains(summaries!, s => s.ShareId == created.ShareId);
        }

        [Fact]
        public async Task Get_ShareById_AsOwner_Returns200_WithoutTickingViewCount()
        {
            _claims.Subject = "alice";
            _claims.Email = "alice@example.com";
            _claims.DisplayName = "Alice";
            _tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>())).ReturnsAsync(OneOwnedTrip());

            var createResp = await _client.PostAsJsonAsync("/api/share",
                new NewShare(new[] { "t1" }, "bob@example.com", false, null, null), Json);
            var created = (await createResp.Content.ReadFromJsonAsync<CreateShareResponse>(Json))!;

            var detailResp = await _client.GetAsync($"/api/share/{created.ShareId}");
            Assert.Equal(HttpStatusCode.OK, detailResp.StatusCode);

            var details = await detailResp.Content.ReadFromJsonAsync<ShareDetails>(Json);
            Assert.NotNull(details);
            Assert.Equal(created.ShareId, details!.ShareId);

            // Owner preview MUST NOT increment ViewCount on the persisted row.
            var stored = (await _repo.GetByShareId(created.ShareId))!;
            Assert.Equal(0, stored.ViewCount);
        }

        [Fact]
        public async Task Delete_AsOwner_MarksRevoked_SubsequentGet_Returns410()
        {
            _claims.Subject = "alice";
            _claims.DisplayName = "Alice";
            _tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>())).ReturnsAsync(OneOwnedTrip());

            var createResp = await _client.PostAsJsonAsync("/api/share",
                new NewShare(new[] { "t1" }, "bob@example.com", false, null, null), Json);
            var created = (await createResp.Content.ReadFromJsonAsync<CreateShareResponse>(Json))!;

            var deleteResp = await _client.DeleteAsync($"/api/share/{created.ShareId}");
            Assert.Equal(HttpStatusCode.OK, deleteResp.StatusCode);

            var afterResp = await _client.GetAsync($"/api/share/{created.ShareId}");
            Assert.Equal(HttpStatusCode.Gone, afterResp.StatusCode);
        }

        [Fact]
        public async Task Post_WithNonOwnedTripIds_Returns403()
        {
            _claims.Subject = "alice";
            _claims.DisplayName = "Alice";
            // GetOwnedTrips returns an empty list — caller doesn't own any of the requested trips.
            _tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>()))
                       .ReturnsAsync(new List<OwnedTrip>());

            var resp = await _client.PostAsJsonAsync("/api/share",
                new NewShare(new[] { "t-not-mine" }, "bob@example.com", false, null, null), Json);

            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }
    }
}
