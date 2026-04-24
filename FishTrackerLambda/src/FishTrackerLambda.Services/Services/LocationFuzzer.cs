using System.Security.Cryptography;
using System.Text;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public class LocationFuzzer : ILocationFuzzer
    {
        private const double MaxRadiusMetres = 200.0;
        private const double MetresPerLatDegree = 111_320.0;

        public Location Fuzz(Location original, string shareId, string catchId)
        {
            var seedBytes = HMACSHA256.HashData(
                key: Encoding.UTF8.GetBytes(shareId),
                source: Encoding.UTF8.GetBytes(catchId));
            var seed = BitConverter.ToInt32(seedBytes, 0);
            var rng = new Random(seed);

            var angle  = rng.NextDouble() * 2 * Math.PI;
            var radius = Math.Sqrt(rng.NextDouble()) * MaxRadiusMetres;

            var latRad = original.Latitude * Math.PI / 180;
            var cosLat = Math.Cos(latRad);
            // Guard against division-by-zero at the poles.
            var safeCosLat = Math.Max(Math.Abs(cosLat), 1e-6);

            var latOffset = radius * Math.Cos(angle) / MetresPerLatDegree;
            var lngOffset = radius * Math.Sin(angle) / (MetresPerLatDegree * safeCosLat);

            // Note: existing Location constructor is (longitude, latitude).
            return new Location(
                original.Longitude + lngOffset,
                original.Latitude + latOffset);
        }
    }
}
