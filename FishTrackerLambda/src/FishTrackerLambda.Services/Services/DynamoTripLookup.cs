using Amazon.DynamoDBv2;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public class DynamoTripLookup : ITripLookup
    {
        private readonly IAmazonDynamoDB _ddb;
        private readonly ILogger<DynamoTripLookup> _log;

        public DynamoTripLookup(IAmazonDynamoDB ddb, ILogger<DynamoTripLookup> log)
        {
            _ddb = ddb;
            _log = log;
        }

        public async Task<List<OwnedTrip>> GetOwnedTrips(string ownerSubject, string[] tripIds)
        {
            var trips = new List<OwnedTrip>();
            foreach (var tripId in tripIds.Distinct())
            {
                var tripWrap = await TripDbTable.ReadTripFromDynamodb(ownerSubject, tripId, _ddb, _log);
                if (tripWrap.Result.StatusCode != 200 || tripWrap.Value is null) continue;

                var tripKey = IdGenerator.GenerateTripKey(ownerSubject, tripId);
                var catchesWrap = await CatchDbTable.ReadAllCatchFromDynamoDb(tripKey, _ddb, _log);
                var catches = (catchesWrap.Value ?? Enumerable.Empty<DynamoDbCatch>())
                    .Select(c => new OwnedCatch(
                        c.CatchId,
                        c.SpeciesId,
                        c.CaughtLocation,
                        DateTimeOffset.Parse(c.CaughtWhen),
                        c.CaughtSize,
                        c.CaughtLength,
                        c.Weather))
                    .ToList();

                var t = tripWrap.Value;
                trips.Add(new OwnedTrip(
                    t.TripId,
                    DateTimeOffset.Parse(t.StartTime),
                    string.IsNullOrEmpty(t.EndTime) ? null : DateTimeOffset.Parse(t.EndTime),
                    t.Notes,
                    t.Rating,
                    t.Tags,
                    t.Species,
                    t.DefaultSpecies,
                    catches));
            }
            return trips;
        }
    }
}
