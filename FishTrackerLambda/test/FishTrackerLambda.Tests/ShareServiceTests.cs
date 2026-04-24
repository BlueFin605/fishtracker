using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using FishTrackerLambda.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace FishTrackerLambda.Tests
{
    internal static class ShareTestFactory
    {
        public static DynamoDbShare MakeShare(
            string id,
            string owner,
            string recipient,
            string? recipientSubject = null,
            string? revokedAt = null,
            string? expiresAt = null,
            string? thumbnailKey = null,
            string? claimedAt = null,
            int viewCount = 0)
        {
            return new DynamoDbShare
            {
                ShareId = id,
                OwnerSubject = owner,
                OwnerDisplayName = owner,
                RecipientEmail = recipient,
                RecipientSubject = recipientSubject,
                CreatedAt = DateTimeOffset.UtcNow.ToString("o"),
                ExpiresAt = expiresAt,
                RevokedAt = revokedAt,
                ThumbnailS3Key = thumbnailKey,
                ClaimedAt = claimedAt,
                ViewCount = viewCount,
                Trips = new List<FrozenTrip>()
            };
        }
    }

    public class ShareServiceTests_NewShare
    {
        private static ShareService MakeSut(
            out Mock<IShareRepository> shares,
            out Mock<ILocationFuzzer> fuzzer,
            out Mock<IStaticMapRenderer> renderer,
            out Mock<IThumbnailStorage> thumbs,
            out Mock<IShareEmailer> emailer,
            out Mock<ITripLookup> tripLookup)
        {
            shares = new Mock<IShareRepository>();
            fuzzer = new Mock<ILocationFuzzer>();
            renderer = new Mock<IStaticMapRenderer>();
            thumbs = new Mock<IThumbnailStorage>();
            emailer = new Mock<IShareEmailer>();
            tripLookup = new Mock<ITripLookup>();

            // sensible defaults so non-blocking calls succeed
            shares.Setup(r => r.ListByOwner(It.IsAny<string>())).ReturnsAsync(new List<DynamoDbShare>());
            shares.Setup(r => r.Save(It.IsAny<DynamoDbShare>()))
                  .ReturnsAsync((DynamoDbShare s) => s);
            shares.Setup(r => r.Update(It.IsAny<DynamoDbShare>()))
                  .ReturnsAsync((DynamoDbShare s) => s);

            return new ShareService(
                NullLogger<ShareService>.Instance,
                shares.Object,
                fuzzer.Object,
                renderer.Object,
                thumbs.Object,
                emailer.Object,
                tripLookup.Object,
                viewUrlBase: "https://example.com/shared");
        }

        [Fact]
        public async Task Rejects_TripIds_NotOwnedByCaller()
        {
            var sut = MakeSut(out _, out _, out _, out _, out _, out var tripLookup);
            tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>()))
                      .ReturnsAsync(new List<OwnedTrip>());   // returns empty - none owned

            var result = await sut.NewShare("alice", "Alice",
                new NewShare(new[] { "t1" }, "bob@x.com", true, 30, null));

            Assert.Equal(403, result.Result.StatusCode);
        }

        [Fact]
        public async Task Rejects_EmptyTripIds()
        {
            var sut = MakeSut(out _, out _, out _, out _, out _, out _);
            var result = await sut.NewShare("alice", "Alice",
                new NewShare(Array.Empty<string>(), "bob@x.com", false, null, null));
            Assert.Equal(400, result.Result.StatusCode);
        }

        [Fact]
        public async Task Rejects_InvalidEmailFormat()
        {
            var sut = MakeSut(out _, out _, out _, out _, out _, out var tripLookup);
            tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>()))
                      .ReturnsAsync(new List<OwnedTrip>
                      {
                          new OwnedTrip("t1", DateTimeOffset.UtcNow, null, "n",
                              TripRating.Good, new(), Array.Empty<string>(), "sp",
                              new List<OwnedCatch>())
                      });
            var result = await sut.NewShare("alice", "Alice",
                new NewShare(new[] { "t1" }, "not-an-email", false, null, null));
            Assert.Equal(400, result.Result.StatusCode);
        }

        [Fact]
        public async Task LowerCasesAndTrimsEmail()
        {
            var sut = MakeSut(out _, out _, out var renderer, out var thumbs, out var emailer, out var tripLookup);
            tripLookup.Setup(t => t.GetOwnedTrips("alice", It.IsAny<string[]>())).ReturnsAsync(SetupOwnedTrip());
            renderer.Setup(r => r.RenderAsync(It.IsAny<IReadOnlyList<(Location, FishSize, string)>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new byte[] { 1 });
            thumbs.Setup(t => t.PutAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
                  .ReturnsAsync("key.png");
            thumbs.Setup(t => t.PublicUrl("key.png")).Returns("https://x/key.png");

            ShareEmailContext? emailed = null;
            emailer.Setup(e => e.SendAsync(It.IsAny<ShareEmailContext>(), It.IsAny<CancellationToken>()))
                   .Callback<ShareEmailContext, CancellationToken>((c, _) => emailed = c)
                   .Returns(Task.CompletedTask);

            await sut.NewShare("alice", "Alice",
                new NewShare(new[] { "t1" }, "  BOB@Example.COM ", true, 30, null));

            Assert.Equal("bob@example.com", emailed?.RecipientEmail);
        }

        private static List<OwnedTrip> SetupOwnedTrip()
        {
            return new List<OwnedTrip>
            {
                new OwnedTrip("t1", DateTimeOffset.UtcNow, null, "n", TripRating.Good,
                    new List<TripTags>(), new[] { "sp" }, "sp", new List<OwnedCatch>
                    {
                        new OwnedCatch("c1", "sp",
                            new Location(144, -37),
                            DateTimeOffset.UtcNow, FishSize.Medium, 10, null)
                    })
            };
        }
    }

    public class ShareServiceTests_GetShares
    {
        private static ShareService Make(out Mock<IShareRepository> repo)
        {
            repo = new Mock<IShareRepository>();
            return new ShareService(
                NullLogger<ShareService>.Instance,
                repo.Object,
                Mock.Of<ILocationFuzzer>(),
                Mock.Of<IStaticMapRenderer>(),
                Mock.Of<IThumbnailStorage>(),
                Mock.Of<IShareEmailer>(),
                Mock.Of<ITripLookup>(),
                viewUrlBase: "https://x/shared");
        }

        [Fact]
        public async Task Outbox_ReturnsOwnerRows()
        {
            var sut = Make(out var repo);
            repo.Setup(r => r.ListByOwner("alice")).ReturnsAsync(new List<DynamoDbShare>
            {
                ShareTestFactory.MakeShare("s1", owner: "alice", recipient: "bob@x.com"),
            });
            var result = await sut.GetShares("alice", "alice@x.com", "outbox");
            var list = result.Value!.ToList();
            Assert.Single(list);
            Assert.Equal("s1", list[0].ShareId);
        }

        [Fact]
        public async Task Inbox_ReturnsClaimedAndUnclaimedMatchingEmail()
        {
            var sut = Make(out var repo);
            repo.Setup(r => r.ListByRecipientEmail("bob@x.com"))
                .ReturnsAsync(new List<DynamoDbShare>
                {
                    ShareTestFactory.MakeShare("s1", owner: "alice", recipient: "bob@x.com", recipientSubject: "bob"),
                    ShareTestFactory.MakeShare("s2", owner: "alice", recipient: "bob@x.com", recipientSubject: null),
                    ShareTestFactory.MakeShare("s3", owner: "alice", recipient: "bob@x.com", recipientSubject: "carol"),
                });
            var result = await sut.GetShares("bob", "bob@x.com", "inbox");
            var ids = result.Value!.Select(r => r.ShareId).ToList();
            Assert.Contains("s1", ids);
            Assert.Contains("s2", ids);
            Assert.DoesNotContain("s3", ids);
        }

        [Fact]
        public async Task InvalidDirection_Returns400()
        {
            var sut = Make(out _);
            var result = await sut.GetShares("alice", "alice@x.com", "junk");
            Assert.Equal(400, result.Result.StatusCode);
        }
    }

    public class ShareServiceTests_GetShare
    {
        private static ShareService Make(out Mock<IShareRepository> repo)
        {
            repo = new Mock<IShareRepository>();
            return new ShareService(
                NullLogger<ShareService>.Instance,
                repo.Object,
                Mock.Of<ILocationFuzzer>(),
                Mock.Of<IStaticMapRenderer>(),
                Mock.Of<IThumbnailStorage>(),
                Mock.Of<IShareEmailer>(),
                Mock.Of<ITripLookup>(),
                viewUrlBase: "x");
        }

        [Fact]
        public async Task OwnerPreview_ReturnsWithoutTickingViewCount()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com");
            var res = await sut.GetShare("alice", "alice@x.com", true, s.ShareId);
            Assert.Equal(200, res.Result.StatusCode);
            repo.Verify(r => r.Update(It.Is<DynamoDbShare>(x => x.ViewCount == 1)), Times.Never());
        }

        [Fact]
        public async Task ClaimedRecipient_TicksViewCount()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com", recipientSubject: "bob");
            var res = await sut.GetShare("bob", "bob@x.com", true, s.ShareId);
            Assert.Equal(200, res.Result.StatusCode);
            repo.Verify(r => r.Update(It.Is<DynamoDbShare>(x => x.ViewCount == 1)), Times.Once());
        }

        [Fact]
        public async Task PendingMatchingVerifiedEmail_AutoClaims()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com", recipientSubject: null);
            var res = await sut.GetShare("bob", "BOB@x.com", true, s.ShareId);
            Assert.Equal(200, res.Result.StatusCode);
            repo.Verify(r => r.Update(It.Is<DynamoDbShare>(x =>
                x.RecipientSubject == "bob" && x.ClaimedAt != null && x.ViewCount == 1)), Times.Once());
        }

        [Fact]
        public async Task UnverifiedEmail_DoesNotClaim()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com", recipientSubject: null);
            var res = await sut.GetShare("bob", "bob@x.com", emailVerified: false, s.ShareId);
            Assert.Equal(404, res.Result.StatusCode);
            repo.Verify(r => r.Update(It.IsAny<DynamoDbShare>()), Times.Never());
        }

        [Fact]
        public async Task NonRecipient_Returns404()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com");
            var res = await sut.GetShare("carol", "carol@x.com", true, s.ShareId);
            Assert.Equal(404, res.Result.StatusCode);
        }

        [Fact]
        public async Task Revoked_Returns410()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com", recipientSubject: "bob",
                         revokedAt: DateTimeOffset.UtcNow.ToString("o"));
            var res = await sut.GetShare("bob", "bob@x.com", true, s.ShareId);
            Assert.Equal(410, res.Result.StatusCode);
        }

        [Fact]
        public async Task Expired_Returns410()
        {
            var sut = Make(out var repo);
            var s = Seed(repo, owner: "alice", recipient: "bob@x.com", recipientSubject: "bob",
                         expiresAt: DateTimeOffset.UtcNow.AddDays(-1).ToString("o"));
            var res = await sut.GetShare("bob", "bob@x.com", true, s.ShareId);
            Assert.Equal(410, res.Result.StatusCode);
        }

        private static DynamoDbShare Seed(Mock<IShareRepository> repo, string owner, string recipient,
            string? recipientSubject = null, string? revokedAt = null, string? expiresAt = null)
        {
            var s = new DynamoDbShare
            {
                ShareId = "s-" + Guid.NewGuid().ToString("N").Substring(0, 6),
                OwnerSubject = owner,
                OwnerDisplayName = owner,
                RecipientEmail = recipient.ToLowerInvariant(),
                RecipientSubject = recipientSubject,
                CreatedAt = DateTimeOffset.UtcNow.ToString("o"),
                RevokedAt = revokedAt,
                ExpiresAt = expiresAt,
                Trips = new List<FrozenTrip>()
            };
            repo.Setup(r => r.GetByShareId(s.ShareId)).ReturnsAsync(s);
            repo.Setup(r => r.Update(It.IsAny<DynamoDbShare>())).ReturnsAsync((DynamoDbShare x) => x);
            return s;
        }
    }
}
