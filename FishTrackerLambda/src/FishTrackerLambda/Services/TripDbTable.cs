using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
{
    public static class TripDbTable
    {
        private static string m_tableName = "FishTracker-Trips-Prod";

        public static Task<DynamoDbTrip> SaveRecord(this Task<DynamoDbTrip> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, m_tableName, logger);
        }

        public static Task<DynamoDbTrip> GetRecord(String subject, Guid TripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord(subject, TripId, client, m_tableName, logger, () => new DynamoDbTrip(subject, TripId));
        }

        internal static Task<IEnumerable<DynamoDbTrip>> GetAllRecords(String subject, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbTrip, String>(subject, "Subject", client, m_tableName, logger);
        }

        public static Task<DynamoDbTrip> CreateDyanmoRecord(this NewTrip newTrip, string subject)
        {
            return Task.FromResult(new DynamoDbTrip(subject, Guid.NewGuid(), newTrip.startTime, null, newTrip.notes, 0, TripRating.NonRated, new List<TripTags>()));
        }

        public static async Task<TripDetails> ToTripDetails(this Task<DynamoDbTrip> TripDets)
        {
            var c = await TripDets;

            return c.ToTripDetails();
        }

        public static TripDetails ToTripDetails(this DynamoDbTrip t)
        {
            return new TripDetails(t.Subject, t.TripId, t.StartTime, t.EndTime, t.Notes, t.CatchSize, t.Rating, t.Tags);
        }
    }

}

