using Amazon.DynamoDBv2.DataModel;
using FishTrackerLambda.Models.Lambda;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    public class DynamoDbCatch
    {
        public Guid TripId { get; }
        public Guid CatchId { get; }
        public Guid SpeciesId { get; }
        public Location CaughtLocation { get; }
        public DateTime CaughtWhen { get; }
        public FishSize CaughtSize { get; }
        public double CaughtLength { get; }
        public WeatherAttributes? Weather { get; }

        [JsonConstructor]
        public DynamoDbCatch(Guid tripId, Guid catchId, Guid speciesId, Location caughtLocation, DateTime caughtWhen, FishSize caughtSize, double caughtLength, WeatherAttributes? weather)
        {
            TripId = tripId;
            CatchId = catchId;
            SpeciesId = speciesId;
            CaughtLocation = caughtLocation;
            CaughtWhen = caughtWhen;
            CaughtSize = caughtSize;
            CaughtLength = caughtLength;
            Weather = weather;
        }

        public DynamoDbCatch(Guid tripId, Guid catchId)
        {
            TripId = tripId;
            CatchId = catchId;
            CaughtLocation = new Location(0,0);
        }
    }

}

