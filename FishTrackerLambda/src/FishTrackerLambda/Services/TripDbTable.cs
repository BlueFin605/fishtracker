﻿using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;

namespace FishTrackerLambda.Services
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

        public static Task<HttpWrapper<DynamoDbTrip>> ReadTripFromDynamodb(String subject, string TripId, IAmazonDynamoDB client, ILogger logger)
        {
            return DynamoDbHelper.GetDynamoDbRecord<DynamoDbTrip,string,string>(subject, TripId, client, logger);
        }

        internal static Task<HttpWrapper<IEnumerable<DynamoDbTrip>>> ReadAllTripsFromDynamoDb(String subject, IAmazonDynamoDB client, ILogger logger)
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

        public static DynamoDbTrip CreateNewDyanmoRecord(this NewTrip newTrip, string subject)
        {
            string currentDateTime = DateTime.Now.ToString("MMdd:HHmmss-yy");
            return new DynamoDbTrip(subject, currentDateTime, newTrip.startTime, null, newTrip.notes, 0, TripRating.NonRated, newTrip?.tags?.ToList() ?? new List<TripTags>(), null);
        }

        public static TripDetails ToTripDetails(this DynamoDbTrip t)
        {
            return new TripDetails(t.Subject, t.TripId, t.StartTime, t.EndTime, t.Notes, t.CatchSize, t.Rating, t.Tags.ToHashSet());
        }
    }

}

