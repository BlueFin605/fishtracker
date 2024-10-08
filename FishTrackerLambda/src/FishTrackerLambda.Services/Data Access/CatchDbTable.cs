﻿using System;
using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.DataAccess;

public static class CatchDbTable
{
    public static Task<HttpWrapper<DynamoDbCatch>> WriteCatchToDynamoDb(this DynamoDbCatch record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.SaveDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbCatch>> UpdateCatchInDynamodb(this DynamoDbCatch record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.UpdateDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbCatch>> ReadCatchFromDynamodb(string tripId, Guid catchId, IAmazonDynamoDB client, ILogger logger)
    {
        return DynamoDbHelper.GetDynamoDbRecord<DynamoDbCatch, string, string>(tripId, catchId.ToString(), client, logger);
    }

    internal static Task<HttpWrapper<IEnumerable<DynamoDbCatch>>> ReadAllCatchFromDynamoDb(string tripKey, IAmazonDynamoDB client, ILogger logger)
    {
        return DynamoDbHelper.GetDynamoDbRecords<DynamoDbCatch, string>(tripKey, client, logger);
    }

    internal static Task<HttpWrapper<IEnumerable<DynamoDbCatch>>> ReadAllCatchFromDynamoDb(this DynamoDbTrip record, IAmazonDynamoDB client, ILogger logger)
    {
        return DynamoDbHelper.GetDynamoDbRecords<DynamoDbCatch, string>(record.TripId, client, logger);
    }

    internal static Task<HttpWrapper<IEnumerable<DynamoDbCatchOld>>> ReadEntireCatchFromOldDynamoDb(IAmazonDynamoDB client, ILogger logger)
    {
        return DynamoDbHelper.GetDynamoDbRecords<DynamoDbCatchOld>(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbCatch>> DeleteCatchInDynamodb(this DynamoDbCatch record, IAmazonDynamoDB client, ILogger logger)
    {
        return record.DeleteDynamoDbRecord(client, logger);
    }

    public static Task<HttpWrapper<DynamoDbCatch>> MigrateInDynamodb(this DynamoDbCatchOld record, IAmazonDynamoDB client, ILogger logger)
    {
        var newCatch = new DynamoDbCatch(IdGenerator.GenerateTripKey("google-oauth2|108727661728816284796", record.TripId),
                                         Guid.Parse(record.CatchId),
                                         record.TripId,
                                         "google-oauth2|108727661728816284796",
                                         record.SpeciesId,
                                         record.CaughtLocation,
                                         DateTimeOffset.Parse(record.CaughtWhen),
                                         record.CaughtSize,
                                         record.CaughtLength,
                                         record.Weather,
                                         null);

        return DynamoDbHelper.SaveDynamoDbRecord(newCatch, client, logger);
    }

    internal static DynamoDbCatch PatchCatch(this DynamoDbCatch record, UpdateCatchDetails updateCatch)
    {
        var dbCatch = record;

        var c = dbCatch; //.Value;

        return new DynamoDbCatch(c.TripKey,
                    Guid.Parse(c.CatchId),
                    c.TripId,
                    c.Subject,
                    updateCatch.SpeciesId ?? c.SpeciesId,
                    updateCatch.caughtLocation ?? c.CaughtLocation,
                    updateCatch.caughtWhen ?? DateTimeOffset.Parse(c.CaughtWhen),
                    updateCatch.caughtSize ?? c.CaughtSize,
                    updateCatch.caughtLength ?? c.CaughtLength,
                    updateCatch.weather ?? c.Weather,
                    c.DynamoDbVersion);
    }

    internal static DynamoDbCatch UpdateCatch(this DynamoDbCatch record, CatchDetails updateCatch)
    {
        var dbCatch = record;

        var c = dbCatch; //.Value;

        return new DynamoDbCatch(c.TripKey,
                                Guid.Parse(c.CatchId),
                                c.TripId,
                                c.Subject,
                                updateCatch.SpeciesId,
                                updateCatch.caughtLocation,
                                updateCatch.caughtWhen,
                                updateCatch.caughtSize,
                                updateCatch.caughtLength,
                                updateCatch.weather,
                                c.DynamoDbVersion);
    }

    public static NewCatch FillInMissingData(this NewCatch newCatch)
    {
        DateTimeOffset startTime = newCatch.caughtWhen ?? DateConverter.GetLocalNow(newCatch.timeZone);
        var x = new NewCatch(newCatch.SpeciesId, newCatch.caughtLocation, startTime, newCatch.timeZone, newCatch.caughtSize, newCatch.caughtLength);
        return x;
    }

    public static DynamoDbCatch CreateNewDyanmoRecord(this NewCatch newCatch, String subject, string tripId)
    {
        return new DynamoDbCatch(IdGenerator.GenerateTripKey(subject, tripId),
                                 Guid.NewGuid(),
                                 tripId,
                                 subject,
                                 newCatch.SpeciesId,
                                 newCatch.caughtLocation,
                                 newCatch.caughtWhen ?? throw new Exception("Date should not be null"),
                                 newCatch.caughtSize,
                                 newCatch.caughtLength,
                                 null,
                                 null);
    }

    public static CatchDetails ToCatchDetails(this DynamoDbCatch c)
    {
        return new CatchDetails(c.TripId,
                                Guid.Parse(c.CatchId),
                                c.SpeciesId,
                                c.CaughtLocation,
                                DateTimeOffset.Parse(c.CaughtWhen),
                                c.CaughtSize,
                                c.CaughtLength,
                                c.Weather);
    }
}

