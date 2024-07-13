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
            return TripDbTable.GetRecord(subject, tripId, m_client, m_logger).ToTripDetails();
        }

        public async Task<IEnumerable<TripDetails>> GetTrips(string subject)
        {
            var records = await TripDbTable.GetAllRecords(subject, m_client, m_logger);
            return records.Select(c => c.ToTripDetails());
        }

        public Task<TripDetails> NewTrip(string subject, NewTrip newTrip)
        {
            return newTrip.CreateNewDyanmoRecord(subject).CreateRecord(m_client, m_logger).ToTripDetailsOld();
        }

        public Task<TripDetails> UpdateTrip(string subject, TripDetails trip)
        {
            return TripDbTable.GetRecordOld(subject, trip.tripId, m_client, m_logger).UpdateTrip(trip).UpdateRecord(m_client, m_logger).ToTripDetailsOld();
        }

        public Task<TripDetails> PatchTrip(string subject, string tripId, UpdateTripDetails trip)
        {
            return TripDbTable.GetRecordOld(subject, tripId, m_client, m_logger).PatchTrip(trip).UpdateRecord(m_client, m_logger).ToTripDetailsOld();
        }
    }
}

