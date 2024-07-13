using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
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
            return record.UpdateDynamoDbRecord(client, logger);
        }

        public static Task<HttpWrapper<DynamoDbTrip>> GetRecord(String subject, string TripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord<DynamoDbTrip,string,string>(subject, TripId, client, logger);
        }

        public static async Task<DynamoDbTrip> GetRecordOld(String subject, string TripId, IAmazonDynamoDB client, ILogger logger)
        {
            var x = await  DynamoDbHelper.GetDynamoDbRecord<DynamoDbTrip, string, string>(subject, TripId, client, logger);
            return x?.Value ?? new DynamoDbTrip();
        }

        internal static Task<IEnumerable<DynamoDbTrip>> GetAllRecords(String subject, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbTrip, String>(subject, "Subject", client, logger);
        }

        internal static async Task<DynamoDbTrip> PatchTrip(this Task<DynamoDbTrip> record, UpdateTripDetails trip)
        {
            var c = await record;

            return new DynamoDbTrip(c.Subject,
                                    c.TripId,
                                    trip.startTime ?? c.StartTime,
                                    trip.endTime ??  c.EndTime,
                                    trip.notes ?? c.Notes,
                                    trip.catchSize ?? c.CatchSize,
                                    trip.rating ?? c.Rating,
                                    trip.tags?.ToList() ?? c.Tags,
                                    c.DynamoDbVersion);
        }

        internal static async Task<DynamoDbTrip> UpdateTrip(this Task<DynamoDbTrip> record, TripDetails trip)
        {
            var c = await record;

            return new DynamoDbTrip(c.Subject,
                                    c.TripId,
                                    trip.startTime,
                                    trip.endTime,
                                    trip.notes,
                                    trip.catchSize,
                                    trip.rating,
                                    trip.tags.ToList(),
                                    c.DynamoDbVersion);
        }

        public static Task<DynamoDbTrip> CreateNewDyanmoRecord(this NewTrip newTrip, string subject)
        {
            string currentDateTime = DateTime.Now.ToString("MMdd:HHmmss-yy");
            return Task.FromResult(new DynamoDbTrip(subject, currentDateTime, newTrip.startTime, null, newTrip.notes, 0, TripRating.NonRated, newTrip?.tags?.ToList() ?? new List<TripTags>(), null));
        }

        public static Task<DynamoDbTrip> CreateDyanmoRecord(this TripDetails trip, string subject)
        {
            return Task.FromResult(new DynamoDbTrip(subject, trip.tripId, trip.startTime, trip.endTime, trip.notes, trip.catchSize, trip.rating, trip.tags.ToList(), null));
        }

        public static async Task<HttpWrapper<TripDetails>> ToTripDetails(this Task<HttpWrapper<DynamoDbTrip>> TripDets)
        {
            var c = await TripDets;

            var value = c?.Value ?? new DynamoDbTrip();

            return new HttpWrapper<TripDetails>(value.ToTripDetails());
        }

        public static async Task<TripDetails> ToTripDetailsOld(this Task<DynamoDbTrip> TripDets)
        {
            var c = await TripDets;

            return c.ToTripDetails();
        }

        public static TripDetails ToTripDetails(this DynamoDbTrip t)
        {
            return new TripDetails(t.Subject, t.TripId, t.StartTime, t.EndTime, t.Notes, t.CatchSize, t.Rating, t.Tags.ToHashSet());
        }
    }

}

