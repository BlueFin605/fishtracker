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

        public static Task<DynamoDbCatch> CreateDyanmoRecord(this NewCatch newCatch, Guid tripId)
        {
            return Task.FromResult(new DynamoDbCatch(Guid.NewGuid(), tripId, newCatch.SpeciesId, newCatch.caughtLocation, newCatch.caughtWhen, newCatch.caughtSize, newCatch.caughtLength, null));
        }

        public static async Task<CatchDetails> ToCatchDetails(this Task<DynamoDbCatch> catchDets)
        {
            var c = await catchDets;

            return new CatchDetails(c.CatchId, c.TripId, c.SpeciesId, c.CaughtLocation, c.CaughtWhen, c.CaughtSize, c.CaughtLength, c.Weather);
        }
    }
}

