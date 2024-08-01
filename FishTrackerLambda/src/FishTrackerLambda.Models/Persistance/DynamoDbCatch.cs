using System.ComponentModel;
using System.Runtime.InteropServices;
using Amazon.DynamoDBv2.DataModel;
using FishTrackerLambda.Models.Lambda;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    [DynamoDBTable("FishTracker-CatchHistory-Prod")]
    public class DynamoDbCatch
    {
        [DynamoDBHashKey]
        public string TripId { get; set; }

        [DynamoDBRangeKey]
        public string CatchId { get; set; }

        public string SpeciesId { get; set; }
        public Location CaughtLocation { get; set; }
        public string CaughtWhen { get; set; }
        public FishSize CaughtSize { get; set; }
        public double CaughtLength { get; set; }
        public WeatherAttributes? Weather { get; set; }

        [DynamoDBVersion]
        public int? DynamoDbVersion { get; set; }

        [JsonConstructor]
        public DynamoDbCatch(string tripId, Guid catchId, string speciesId, Location caughtLocation, DateTimeOffset caughtWhen, FishSize caughtSize, double caughtLength, WeatherAttributes? weather, int? dynamoDbVersion)
        {
            TripId = tripId;
            CatchId = catchId.ToString();
            SpeciesId = speciesId;
            CaughtLocation = caughtLocation;
            CaughtWhen = caughtWhen.ToString("o");
            CaughtSize = caughtSize;
            CaughtLength = caughtLength;
            Weather = weather;
            DynamoDbVersion = dynamoDbVersion;
        }

        public DynamoDbCatch()
        {
            TripId = string.Empty;
            CatchId = string.Empty;
            SpeciesId = string.Empty;
            CaughtWhen = string.Empty;
            CaughtLocation = new Location();
        }
    }
}

