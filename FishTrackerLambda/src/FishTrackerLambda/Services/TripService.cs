using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Services
{
    public class TripService : ITripService
    {
        private readonly ILogger<CatchService> m_logger;

        private readonly IAmazonDynamoDB m_client;

        public TripService(ILogger<CatchService> logger, IAmazonDynamoDB client)
        {
            m_logger = logger;
            m_client = client;
        }

        public Task<HttpWrapper<TripDetails>> GetTrip(string subject, string tripId)
        {
            return TripDbTable.ReadTripFromDynamodb(subject, tripId, m_client, m_logger)
                .Map(c => c.ToTripDetails());
        }

        public Task<HttpWrapper<IEnumerable<TripDetails>>> GetTrips(string subject)
        {
            return TripDbTable.ReadAllTripsFromDynamoDb(subject, m_client, m_logger)
                .Map(c => c.Select(r => r.ToTripDetails()));
        }

        public Task<HttpWrapper<TripDetails>> NewTrip(string subject, NewTrip newTrip)
        {
            return Function.Init(newTrip.CreateNewDyanmoRecord(subject))
                .MapAsync(t => t.WriteTripToDynamoDb(m_client, m_logger))
                .Map(t => t.ToTripDetails());
        }

        public Task<HttpWrapper<TripDetails>> UpdateTrip(string subject, TripDetails trip)
        {
            return TripDbTable.ReadTripFromDynamodb(subject, trip.tripId, m_client, m_logger)
                .Map(t => t.UpdateTrip(trip))
                .MapAsync(t => t.UpdateTripInDynamodb(m_client, m_logger))
                .Map(t => t.ToTripDetails());
        }

        public Task<HttpWrapper<TripDetails>> PatchTrip(string subject, string tripId, UpdateTripDetails trip)
        {
            return TripDbTable.ReadTripFromDynamodb(subject, tripId, m_client, m_logger)
                .Map(c => c.PatchTrip(trip))
                .MapAsync(c => c.UpdateTripInDynamodb(m_client, m_logger))
                .Map(c => c.ToTripDetails());
        }
    }
}

