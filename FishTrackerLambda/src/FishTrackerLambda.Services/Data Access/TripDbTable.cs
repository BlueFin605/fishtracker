﻿using Amazon.DynamoDBv2;
using FishTrackerLambda.ClaimHandler;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.DataAccess
{
    public static class TripDbTable
    {
        public static Task<HttpWrapper<DynamoDbTrip>> WriteTripToDynamoDb(this DynamoDbTrip record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.SaveDynamoDbRecord(client, logger);
        }

        public static Task<HttpWrapper<DynamoDbTrip>> UpdateTripInDynamodb(this DynamoDbTrip record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.UpdateDynamoDbRecord(client, logger);
        }

        public static Task<HttpWrapper<DynamoDbTrip>> DeleteTripInDynamodb(this DynamoDbTrip record, IAmazonDynamoDB client, ILogger logger)
        {
            return record.DeleteDynamoDbRecord(client, logger);
        }

        public static Task<HttpWrapper<DynamoDbTrip>> ReadTripFromDynamodb(String subject, string TripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord<DynamoDbTrip,string,string>(subject, TripId, client, logger);
        }

        internal static Task<HttpWrapper<IEnumerable<DynamoDbTrip>>> ReadAllTripsFromDynamoDb(String subject, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecords<DynamoDbTrip, String>(subject, client, logger);
        }

        internal static Task<HttpWrapper<IEnumerable<DynamoDbTrip>>> ReadRelevantTripsFromDynamoDb(String subject, IAmazonDynamoDB client, ILogger logger)
        {
            var month = DateTime.Now.Month;
            return DynamoDbHelper.GetDynamoDbRecordsBySortKeyRange<DynamoDbTrip, String>(subject, "Subject", "TripId", IdGenerator.GenerateTripKey(subject, (month - 1).ToString("D2")), IdGenerator.GenerateTripKey(subject, (month + 2).ToString("D2")), client, logger);
        }

        internal static DynamoDbTrip PatchTrip(this DynamoDbTrip record, UpdateTripDetails trip)
        {
            var c = record;

            return new DynamoDbTrip(c.Subject,
                                    c.TripId,
                                    trip.startTime ?? DateConverter.IsoFromString(c.StartTime),
                                    trip.endTime ?? (c.EndTime != null ? DateConverter.IsoFromString(c.EndTime) : null),
                                    AppendNotes(c.Notes,trip.notes),
                                    trip.catchSize ?? c.CatchSize,
                                    trip.rating ?? c.Rating,
                                    trip.tags?.ToList() ?? c.Tags,
                                    trip.species ?? c.Species,
                                    trip.defaultSpecies ?? c.DefaultSpecies,
                                    c.DynamoDbVersion); ;
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
                                    trip.species,
                                    trip.defaultSpecies,
                                    c.DynamoDbVersion);
        }

        internal static DynamoDbTrip EndTrip(this DynamoDbTrip record, EndTripDetails trip, int size)
        {
            var c = record;

            DateTimeOffset endTime = trip.endTime ?? DateConverter.GetLocalNow(trip.timeZone);

            return new DynamoDbTrip(c.Subject,
                                    c.TripId,
                                    DateConverter.IsoFromString(c.StartTime),
                                    endTime,
                                    AppendNotes(c.Notes, trip.notes),
                                    (uint)size,
                                    trip.rating ?? c.Rating,
                                    trip.tags?.ToList() ?? c.Tags,
                                    c.Species,
                                    c.DefaultSpecies,
                                    c.DynamoDbVersion);
        }

        public static NewTrip FillInMissingData(this NewTrip newTrip)
        {
            DateTimeOffset startTime = newTrip.startTime ?? DateConverter.GetLocalNow(newTrip.timeZone);
            return new NewTrip(startTime, newTrip.timeZone, newTrip.notes, newTrip.tags, newTrip.species, newTrip.defaultSpecies);
        }

        public static DynamoDbTrip CreateNewDyanmoRecord(this NewTrip newTrip, string subject)
        {
            var start = newTrip?.startTime ?? throw new Exception("Start time should not be null");
            return new DynamoDbTrip(subject,
                                    IdGenerator.GenerateTripId(start),
                                    start,
                                    null,
                                    newTrip.notes,
                                    0,
                                    TripRating.NonRated,
                                    newTrip?.tags?.ToList() ?? new List<TripTags>(),
                                    newTrip?.species ?? new string[0],
                                    newTrip?.defaultSpecies ?? string.Empty,
                                    null);
        }

        public static TripDetails ToTripDetails(this DynamoDbTrip t)
        {
            return new TripDetails(t.Subject,
                                   t.TripId,
                                   DateConverter.IsoFromString(t.StartTime),
                                   string.IsNullOrEmpty(t.EndTime) ? null : DateConverter.IsoFromString(t.EndTime),
                                   t.Notes,
                                   t.CatchSize,
                                   t.Rating,
                                   t.Tags.ToHashSet(),
                                   t.Species,
                                   t.DefaultSpecies);
        }

        private static string AppendNotes(string? notes, string? append)
        {
            if (string.IsNullOrWhiteSpace(append))
                return notes ?? string.Empty;

            if (notes == null)
                return append ?? string.Empty;

            return notes + "\r\n" + append;
        }
    }

}

