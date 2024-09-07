using Amazon.DynamoDBv2;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using FishTrackerLambda.Services.Http;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public class TripService : ITripService
    {
        private readonly ILogger<TripService> m_logger;

        private readonly IAmazonDynamoDB m_client;

        public TripService(ILogger<TripService> logger, IAmazonDynamoDB client)
        {
            m_logger = logger;
            m_client = client;
        }

        public Task<HttpWrapper<TripDetails>> GetTrip(string subject, string tripId)
        {
            return TripDbTable
                .ReadTripFromDynamodb(subject, tripId, m_client, m_logger)
                .Map(c => c.ToTripDetails());
        }

        public Task<HttpWrapper<IEnumerable<TripDetails>>> GetTrips(string subject, string? view)
        {
            switch (view)
            {
            case null:
            case "all":
                return Function
                    .InitAsync(TripDbTable.ReadAllTripsFromDynamoDb(subject, m_client, m_logger))
                    .Map(c => c.Select(r => r.ToTripDetails()));
            case "relevant":
                return Function
                    .InitAsync(TripDbTable.ReadRelevantTripsFromDynamoDb(subject, m_client, m_logger))
                    .Map(c => c.Select(r => r.ToTripDetails()));
            default:
                throw new Exception($"invalid view[{view}]");
            }
        }


        public Task<HttpWrapper<TripDetails>> NewTrip(string subject, NewTrip newTrip)
        {
            return Function
                .ValidateInput(() => {
                    return newTrip.startTime != null || newTrip.timeZone != null ? null : Results.BadRequest("Must supply either a datetime or timezone");
                 }) 
                .Init(newTrip.FillInMissingData())
                .Map(t => t.CreateNewDyanmoRecord(subject))
                .MapAsync(t => t.WriteTripToDynamoDb(m_client, m_logger))
                .Map(t => t.ToTripDetails());
        }

        public Task<HttpWrapper<TripDetails>> UpdateTrip(string subject, string tripId, TripDetails trip)
        {
            return Function
                .ValidateInput(() => {
                    return tripId == trip.tripId ? null : Results.BadRequest($"Cannot change tripId from[{tripId}] to[{trip.tripId}]");
                 })
                .MapAsync(t => TripDbTable.ReadTripFromDynamodb(subject, trip.tripId, m_client, m_logger))
                .Map(t => t.UpdateTrip(trip))
                .MapAsync(t => t.UpdateTripInDynamodb(m_client, m_logger))
                .Map(t => t.ToTripDetails());
        }

        public Task<HttpWrapper<TripDetails>> PatchTrip(string subject, string tripId, UpdateTripDetails trip)
        {
            return TripDbTable
                .ReadTripFromDynamodb(subject, tripId, m_client, m_logger)
                .Map(c => c.PatchTrip(trip))
                .MapAsync(c => c.UpdateTripInDynamodb(m_client, m_logger))
                .Map(c => c.ToTripDetails());
        }

        public Task<HttpWrapper<IEnumerable<CatchDetails>>> DeleteTrip(string subject, string tripId)
        {
            return TripDbTable
                .ReadTripFromDynamodb(subject, tripId, m_client, m_logger)
                .MapAsync(c => c.DeleteTripInDynamodb(m_client, m_logger))
                .MapAsync(c => c.ReadAllCatchFromDynamoDb(m_client, m_logger))
                .MapEachAsync(c => c.DeleteCatchInDynamodb(m_client, m_logger))
                .Map(c => c.Select(r => r.ToCatchDetails()));
        }

        public Task<HttpWrapper<TripDetails>> EndTrip(string subject, string tripId, EndTripDetails trip)
        {
            return CatchDbTable.ReadAllCatchFromDynamoDb(IdGenerator.GenerateTripKey(subject, tripId), m_client, m_logger)
                .MapAsync(all =>
                {
                    return TripDbTable
                        .ReadTripFromDynamodb(subject, tripId, m_client, m_logger)
                        .Map(c => c.EndTrip(trip, all.Count()))
                        .MapAsync(c => c.UpdateTripInDynamodb(m_client, m_logger))
                        .Map(c => c.ToTripDetails());
                });

        }
    }
}

