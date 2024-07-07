using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
{
    public static class CatchDbTable
    {
        public static Task<DynamoDbCatch> SaveRecord(this Task<DynamoDbCatch> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, logger);
        }

        public static Task<DynamoDbCatch> GetRecord(Guid tripId, Guid catchId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord(tripId.ToString(), catchId.ToString(), client, logger, () => new DynamoDbCatch(tripId, catchId));
        }

        internal static Task<IEnumerable<DynamoDbCatch>> GetAllRecords(Guid tripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbCatch, string>(tripId.ToString(), "TripId", client, logger);
        }

        public static Task<DynamoDbCatch> CreateDyanmoRecord(this NewCatch newCatch, Guid tripId)
        {
            return Task.FromResult(new DynamoDbCatch(tripId, Guid.NewGuid(), newCatch.SpeciesId, newCatch.caughtLocation, newCatch.caughtWhen, newCatch.caughtSize, newCatch.caughtLength, null, null));
        }

        public static async Task<CatchDetails> ToCatchDetails(this Task<DynamoDbCatch> catchDets)
        {
            var c = await catchDets;

            return c.ToCatchDetails();
        }

        public static CatchDetails ToCatchDetails(this DynamoDbCatch c)
        {
            return new CatchDetails(Guid.Parse(c.TripId), Guid.Parse(c.CatchId), c.SpeciesId, c.CaughtLocation, c.CaughtWhen, c.CaughtSize, c.CaughtLength, c.Weather);
        }
    }

}

