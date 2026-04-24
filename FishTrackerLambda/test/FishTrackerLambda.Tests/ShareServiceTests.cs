using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace FishTrackerLambda.Tests
{
    public class ShareServiceTests_NewShare
    {
        private static ShareService MakeSut(
            out Mock<IAmazonDynamoDB> ddb,
            out Mock<ILocationFuzzer> fuzzer,
            out Mock<IStaticMapRenderer> renderer,
            out Mock<IThumbnailStorage> thumbs,
            out Mock<IShareEmailer> emailer,
            out Mock<ITripLookup> tripLookup)
        {
            ddb = new Mock<IAmazonDynamoDB>();
            fuzzer = new Mock<ILocationFuzzer>();
            renderer = new Mock<IStaticMapRenderer>();
            thumbs = new Mock<IThumbnailStorage>();
            emailer = new Mock<IShareEmailer>();
            tripLookup = new Mock<ITripLookup>();
            return new ShareService(
                NullLogger<ShareService>.Instance,
                ddb.Object,
                fuzzer.Object,
                renderer.Object,
                thumbs.Object,
                emailer.Object,
                tripLookup.Object,
                viewUrlBase: "https://example.com/shared",
                sharesTableName: "FishTracker-Shares-Test");
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
    }
}
