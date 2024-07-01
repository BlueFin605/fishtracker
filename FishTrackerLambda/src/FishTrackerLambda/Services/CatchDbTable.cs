using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
{
    public static class CatchDbTable
    {
        private static string m_tableName = "FishTracker-CatchHistory-Prod";

        public static Task<DynamoDbCatch> SaveRecord(this Task<DynamoDbCatch> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, m_tableName, logger);
        }

        public static Task<DynamoDbCatch> GetRecord(Guid tripId, Guid catchId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord(tripId, catchId, client, m_tableName, logger, () => new DynamoDbCatch(tripId, catchId));
        }

        internal static Task<IEnumerable<DynamoDbCatch>> GetAllRecords(Guid tripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbCatch, Guid>(tripId, client, m_tableName, logger);
        }

        public static Task<DynamoDbCatch> CreateDyanmoRecord(this NewCatch newCatch, Guid tripId)
        {
            return Task.FromResult(new DynamoDbCatch(tripId, Guid.NewGuid(), newCatch.SpeciesId, newCatch.caughtLocation, newCatch.caughtWhen, newCatch.caughtSize, newCatch.caughtLength, null));
        }

        public static async Task<CatchDetails> ToCatchDetails(this Task<DynamoDbCatch> catchDets)
        {
            var c = await catchDets;

            return c.ToCatchDetails();
        }

        public static CatchDetails ToCatchDetails(this DynamoDbCatch c)
        {
            return new CatchDetails(c.TripId, c.CatchId, c.SpeciesId, c.CaughtLocation, c.CaughtWhen, c.CaughtSize, c.CaughtLength, c.Weather);
        }
    }

}

