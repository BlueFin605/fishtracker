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

        public Guid SpeciesId { get; set; }
        public Location CaughtLocation { get; set; }
        public DateTime CaughtWhen { get; set; }
        public FishSize CaughtSize { get; set; }
        public double CaughtLength { get; set; }
        public WeatherAttributes? Weather { get; set; }

        [JsonConstructor]
        public DynamoDbCatch(Guid tripId, Guid catchId, Guid speciesId, Location caughtLocation, DateTime caughtWhen, FishSize caughtSize, double caughtLength, WeatherAttributes? weather)
        {
            TripId = tripId.ToString();
            CatchId = catchId.ToString();
            SpeciesId = speciesId;
            CaughtLocation = caughtLocation;
            CaughtWhen = caughtWhen;
            CaughtSize = caughtSize;
            CaughtLength = caughtLength;
            Weather = weather;
        }

        public DynamoDbCatch()
        {
            TripId = string.Empty;
            CatchId = string.Empty;
            CaughtLocation = new Location();
        }

        public DynamoDbCatch(Guid tripId, Guid catchId)
        {
            TripId = tripId.ToString();
            CatchId = catchId.ToString();
            CaughtLocation = new Location(0,0);
        }
    }

}

