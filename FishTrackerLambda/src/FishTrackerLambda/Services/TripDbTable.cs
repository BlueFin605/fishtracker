using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
{
    public static class TripDbTable
    {
        public static Task<HttpWrapper<DynamoDbTrip>> CreateRecord(this DynamoDbTrip record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, logger);
        }

        public static Task<HttpWrapper<DynamoDbTrip>> UpdateRecord(this DynamoDbTrip record, IAmazonDynamoDB client, ILogger logger)
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

        internal static Task<HttpWrapper<IEnumerable<DynamoDbTrip>>> GetAllRecords(String subject, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbTrip, String>(subject, "Subject", client, logger);
        }

        internal static DynamoDbTrip PatchTrip(this DynamoDbTrip record, UpdateTripDetails trip)
        {
            var c = record;

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

        internal static DynamoDbTrip UpdateTrip(this DynamoDbTrip record, TripDetails trip)
        {
            var c = record;

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

        public static Task<HttpWrapper<DynamoDbTrip>> CreateNewDyanmoRecord(this NewTrip newTrip, string subject)
        {
            string currentDateTime = DateTime.Now.ToString("MMdd:HHmmss-yy");
            return Task.FromResult(new HttpWrapper<DynamoDbTrip>(new DynamoDbTrip(subject, currentDateTime, newTrip.startTime, null, newTrip.notes, 0, TripRating.NonRated, newTrip?.tags?.ToList() ?? new List<TripTags>(), null)));
        }

        public static Task<DynamoDbTrip> CreateDyanmoRecord(this TripDetails trip, string subject)
        {
            return Task.FromResult(new DynamoDbTrip(subject, trip.tripId, trip.startTime, trip.endTime, trip.notes, trip.catchSize, trip.rating, trip.tags.ToList(), null));
        }

        public static async Task<HttpWrapper<TripDetails>> ToTripDetails(this Task<HttpWrapper<DynamoDbTrip>> TripDets)
        {
            var c = await TripDets;

            var value = c?.Value ?? new DynamoDbTrip();

            return new HttpWrapper<TripDetails>(value.ToTripDetailsRaw());
        }

        public static async Task<TripDetails> ToTripDetailsOld(this Task<DynamoDbTrip> TripDets)
        {
            var c = await TripDets;

            return c.ToTripDetailsRaw();
        }

        public static TripDetails ToTripDetailsRaw(this DynamoDbTrip t)
        {
            return new TripDetails(t.Subject, t.TripId, t.StartTime, t.EndTime, t.Notes, t.CatchSize, t.Rating, t.Tags.ToHashSet());
        }

        public static Task<HttpWrapper<TripDetails>> ToTripDetailsWrapper(this DynamoDbTrip t)
        {
            return Task.FromResult(new HttpWrapper<TripDetails>(new TripDetails(t.Subject, t.TripId, t.StartTime, t.EndTime, t.Notes, t.CatchSize, t.Rating, t.Tags.ToHashSet())));
        }

    }

}

