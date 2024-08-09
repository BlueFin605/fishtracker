using System.ComponentModel;
using System.Runtime.InteropServices;
using Amazon.DynamoDBv2.DataModel;
using FishTrackerLambda.Models.Lambda;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    [DynamoDBTable("FishTracker-CatchHistory-Prod")]
    public class DynamoDbCatchOld
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
        public DynamoDbCatchOld(string tripId, Guid catchId, string speciesId, Location caughtLocation, DateTimeOffset caughtWhen, FishSize caughtSize, double caughtLength, WeatherAttributes? weather, int? dynamoDbVersion)
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

        public DynamoDbCatchOld()
        {
            TripId = string.Empty;
            CatchId = string.Empty;
            SpeciesId = string.Empty;
            CaughtWhen = string.Empty;
            CaughtLocation = new Location();
        }
    }

    [DynamoDBTable("FishTracker-Catch-Prod")]
    public class DynamoDbCatch
    {
        [DynamoDBHashKey]
        public string TripKey { get; set; }

        [DynamoDBRangeKey]
        public string CatchId { get; set; }

        public string TripId { get; set; }
        public string Subject { get; set; }
        public string SpeciesId { get; set; }
        public Location CaughtLocation { get; set; }
        public string CaughtWhen { get; set; }
        public FishSize CaughtSize { get; set; }
        public double CaughtLength { get; set; }
        public WeatherAttributes? Weather { get; set; }

        [DynamoDBVersion]
        public int? DynamoDbVersion { get; set; }

        [JsonConstructor]
        public DynamoDbCatch(string tripKey, Guid catchId, string tripId, string subject, string speciesId, Location caughtLocation, DateTimeOffset caughtWhen, FishSize caughtSize, double caughtLength, WeatherAttributes? weather, int? dynamoDbVersion)
        {
            TripKey = tripKey;
            TripId = tripId;
            Subject = subject;
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
            TripKey = string.Empty;
            TripId = string.Empty;
            Subject = string.Empty;
            CatchId = string.Empty;
            SpeciesId = string.Empty;
            CaughtWhen = string.Empty;
            CaughtLocation = new Location();
        }
    }

}

