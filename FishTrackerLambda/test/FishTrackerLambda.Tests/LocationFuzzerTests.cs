using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Services;
using Xunit;

namespace FishTrackerLambda.Tests
{
    public class LocationFuzzerTests
    {
        private static double HaversineMetres(Location a, Location b)
        {
            const double R = 6_371_000.0;
            var dLat = (b.Latitude - a.Latitude) * Math.PI / 180;
            var dLng = (b.Longitude - a.Longitude) * Math.PI / 180;
            var s = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(a.Latitude * Math.PI / 180) *
                    Math.Cos(b.Latitude * Math.PI / 180) *
                    Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(s), Math.Sqrt(1 - s));
            return R * c;
        }

        [Fact]
        public void Fuzz_OffsetWithin200m()
        {
            var fuzzer = new LocationFuzzer();
            var origin = new Location(-37.8136, 144.9631);   // Melbourne
            for (var i = 0; i < 200; i++)
            {
                var fuzzed = fuzzer.Fuzz(origin, "share-a", $"catch-{i}");
                Assert.InRange(HaversineMetres(origin, fuzzed), 0.0, 205.0);
            }
        }

        [Fact]
        public void Fuzz_IsDeterministic()
        {
            var fuzzer = new LocationFuzzer();
            var origin = new Location(-37.8136, 144.9631);
            var a = fuzzer.Fuzz(origin, "share-1", "catch-1");
            var b = fuzzer.Fuzz(origin, "share-1", "catch-1");
            Assert.Equal(a.Latitude, b.Latitude);
            Assert.Equal(a.Longitude, b.Longitude);
        }

        [Fact]
        public void Fuzz_DifferentInputsProduceDifferentOutputs()
        {
            var fuzzer = new LocationFuzzer();
            var origin = new Location(-37.8136, 144.9631);
            var a = fuzzer.Fuzz(origin, "share-1", "catch-1");
            var b = fuzzer.Fuzz(origin, "share-1", "catch-2");
            Assert.NotEqual(a.Latitude, b.Latitude);
        }

        [Fact]
        public void Fuzz_NearPoles_DoesNotExplode()
        {
            var fuzzer = new LocationFuzzer();
            var origin = new Location(85.0, 0.0);
            var fuzzed = fuzzer.Fuzz(origin, "share-x", "catch-x");
            Assert.False(double.IsNaN(fuzzed.Latitude));
            Assert.False(double.IsNaN(fuzzed.Longitude));
            Assert.InRange(HaversineMetres(origin, fuzzed), 0.0, 205.0);
        }
    }
}
