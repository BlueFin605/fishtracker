using System;
using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
{
    public static class CatchDbTable
    {
        public static Task<DynamoDbCatch> CreateRecord(this Task<DynamoDbCatch> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, logger);
        }

        public static Task<DynamoDbCatch> UpdateRecord(this Task<DynamoDbCatch> record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.UpdateDynamoDbRecord(client, logger);
        }

        public static Task<HttpWrapper<DynamoDbCatch>> GetRecord(string tripId, Guid catchId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord<DynamoDbCatch, string, string>(tripId, catchId.ToString(), client, logger);
        }

        public static async Task<DynamoDbCatch> GetRecordOld(string tripId, Guid catchId, IAmazonDynamoDB client, ILogger logger)
        {
            var x = await DynamoDbHelper.GetDynamoDbRecord<DynamoDbCatch, string, string>(tripId, catchId.ToString(), client, logger);
            return x?.Value ?? new DynamoDbCatch();
        }

        internal static Task<IEnumerable<DynamoDbCatch>> GetAllRecords(string tripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbCatch, string>(tripId.ToString(), "TripId", client, logger);
        }

        internal static async Task<DynamoDbCatch> PatchCatch(this Task<DynamoDbCatch> record, UpdateCatchDetails updateCatch)
        {
            var dbCatch = await record;

            var c = dbCatch; //.Value;

            return new DynamoDbCatch(c.TripId,
                        Guid.Parse(c.CatchId),
                        updateCatch.SpeciesId ?? c.SpeciesId,
                        updateCatch.caughtLocation ?? c.CaughtLocation,
                        updateCatch.caughtWhen ?? c.CaughtWhen,
                        updateCatch.caughtSize ?? c.CaughtSize,
                        updateCatch.caughtLength ?? c.CaughtLength,
                        updateCatch.weather ?? c.Weather,
                        c.DynamoDbVersion);
        }

        internal static async Task<DynamoDbCatch> UpdateCatch(this Task<DynamoDbCatch> record, CatchDetails updateCatch)
        {
            var dbCatch = await record;

            var c = dbCatch; //.Value;

            return new DynamoDbCatch(c.TripId,
                                    Guid.Parse(c.CatchId),
                                    updateCatch.SpeciesId,
                                    updateCatch.caughtLocation,
                                    updateCatch.caughtWhen,
                                    updateCatch.caughtSize,
                                    updateCatch.caughtLength,
                                    updateCatch.weather,
                                    c.DynamoDbVersion);
        }

        public static Task<DynamoDbCatch> CreateDyanmoRecord(this NewCatch newCatch, string tripId)
        {
            return Task.FromResult(new DynamoDbCatch(tripId, Guid.NewGuid(), newCatch.SpeciesId, newCatch.caughtLocation, newCatch.caughtWhen, newCatch.caughtSize, newCatch.caughtLength, null, null));
        }

        public static async Task<HttpWrapper<CatchDetails>> ToCatchDetails(this Task<HttpWrapper<DynamoDbCatch>> catchDets)
        {
            var c = await catchDets;

            var value = c?.Value ?? new DynamoDbCatch();

            return new HttpWrapper<CatchDetails>(value.ToCatchDetailsRaw());
        }

        public static async Task<CatchDetails> ToCatchDetailsOld(this Task<DynamoDbCatch> catchDets)
        {
            var c = await catchDets;

            return c.ToCatchDetailsRaw();
        }

        public static CatchDetails ToCatchDetailsRaw(this DynamoDbCatch c)
        {
            return new CatchDetails(c.TripId, Guid.Parse(c.CatchId), c.SpeciesId, c.CaughtLocation, c.CaughtWhen, c.CaughtSize, c.CaughtLength, c.Weather);
        }

        public static HttpWrapper<CatchDetails> ToCatchDetailsWrapper(this DynamoDbCatch c)
        {
            return new HttpWrapper<CatchDetails>(new CatchDetails(c.TripId, Guid.Parse(c.CatchId), c.SpeciesId, c.CaughtLocation, c.CaughtWhen, c.CaughtSize, c.CaughtLength, c.Weather));
        }
    }

}

