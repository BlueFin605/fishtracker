using Amazon.DynamoDBv2.DataModel;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Models.Persistance
{
    public class DynamoDbCatch
    {
        public Guid CatchId { get; }
        public Guid TripId { get; }
        public Guid SpeciesId { get; }
        public Location CaughtLocation { get; }
        public DateTime CaughtWhen { get; }
        public FishSize CaughtSize { get; }
        public double CaughtLength { get; }
        public WeatherAttributes? Weather { get; }

        public DynamoDbCatch(Guid catchId, Guid tripId, Guid speciesId, Location caughtLocation, DateTime caughtWhen, FishSize caughtSize, double caughtLength, WeatherAttributes? weather)
        {
            CatchId = catchId;
            TripId = tripId;
            SpeciesId = speciesId;
            CaughtLocation = caughtLocation;
            CaughtWhen = caughtWhen;
            CaughtSize = caughtSize;
            CaughtLength = caughtLength;
            Weather = weather;
        }

        public DynamoDbCatch(Guid catchId)
        {
            CatchId = catchId;
            CaughtLocation = new Location(0,0);
        }
    }
}

