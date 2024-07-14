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
            return TripDbTable.GetRecord(subject, tripId, m_client, m_logger)
                .Map(c => c.ToTripDetailsWrapper());
        }

        public Task<HttpWrapper<IEnumerable<TripDetails>>> GetTrips(string subject)
        {
            return TripDbTable.GetAllRecords(subject, m_client, m_logger)
                .MapSuccess(c => c.Select(r => r.ToTripDetailsRaw()));
        }

        public Task<HttpWrapper<TripDetails>> NewTrip(string subject, NewTrip newTrip)
        {
            return newTrip.CreateNewDyanmoRecord(subject)
                .Map(t => t.CreateRecord(m_client, m_logger))
                .MapSuccess(t => t.ToTripDetailsRaw());
        }

        public Task<HttpWrapper<TripDetails>> UpdateTrip(string subject, TripDetails trip)
        {
            return TripDbTable.GetRecord(subject, trip.tripId, m_client, m_logger)
                .MapSuccess(t => t.UpdateTrip(trip))
                .Map(t => t.UpdateRecord(m_client, m_logger))
                .MapSuccess(t => t.ToTripDetailsRaw());

            //return TripDbTable.GetRecordOld(subject, trip.tripId, m_client, m_logger).UpdateTrip(trip).UpdateRecord(m_client, m_logger).ToTripDetailsOld();
        }

        public Task<HttpWrapper<TripDetails>> PatchTrip(string subject, string tripId, UpdateTripDetails trip)
        {
            return TripDbTable.GetRecord(subject, tripId, m_client, m_logger)
                .MapSuccess(c => c.PatchTrip(trip))
                .Map(c => c.UpdateRecord(m_client, m_logger))
                .MapSuccess(c => c.ToTripDetailsRaw());

            //return TripDbTable.GetRecordOld(subject, tripId, m_client, m_logger).PatchTrip(trip).UpdateRecord(m_client, m_logger).ToTripDetailsOld();
        }
    }
}

