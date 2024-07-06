using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
{
    public static class TripDbTable
    {
        public static Task<DynamoDbTrip> CreateRecord(this Task<DynamoDbTrip> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, logger);
        }

        public static Task<DynamoDbTrip> UpdateRecord(this Task<DynamoDbTrip> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.UpdateDynamoDbRecord(client, logger, null);
        }

        public static Task<DynamoDbTrip> GetRecord(String subject, Guid TripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord(subject, TripId.ToString(), client, logger, () => new DynamoDbTrip(subject, TripId));
        }

        internal static Task<IEnumerable<DynamoDbTrip>> GetAllRecords(String subject, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbTrip, String>(subject, "Subject", client, logger);
        }

        internal static async Task<DynamoDbTrip> UpdateTrip(this Task<DynamoDbTrip> record, UpdateTripDetails trip)
        {
            var c = await record;

            return new DynamoDbTrip(c.Subject,
                                    trip.tripId,
                                    trip.startTime ?? c.StartTime,
                                    trip.endTime ??  c.EndTime,
                                    trip.notes ?? c.Notes,
                                    trip.catchSize ?? c.CatchSize,
                                    trip.rating ?? c.Rating,
                                    trip.tags?.ToList() ?? c.Tags,
                                    null /*c.DynamoDbVersion*/);
        }

        public static Task<DynamoDbTrip> CreateNewDyanmoRecord(this NewTrip newTrip, string subject)
        {
            return Task.FromResult(new DynamoDbTrip(subject, Guid.NewGuid(), newTrip.startTime, null, newTrip.notes, 0, TripRating.NonRated, newTrip?.tags?.ToList() ?? new List<TripTags>(), null));
        }

        public static Task<DynamoDbTrip> CreateDyanmoRecord(this TripDetails trip, string subject)
        {
            return Task.FromResult(new DynamoDbTrip(subject, trip.tripId, trip.startTime, trip.endTime, trip.notes, trip.catchSize, trip.rating, trip.tags.ToList(), null));
        }

        public static async Task<TripDetails> ToTripDetails(this Task<DynamoDbTrip> TripDets)
        {
            var c = await TripDets;

            return c.ToTripDetails();
        }

        public static TripDetails ToTripDetails(this DynamoDbTrip t)
        {
            return new TripDetails(t.Subject, Guid.Parse(t.TripId), t.StartTime, t.EndTime, t.Notes, t.CatchSize, t.Rating, t.Tags.ToHashSet());
        }
    }

}

