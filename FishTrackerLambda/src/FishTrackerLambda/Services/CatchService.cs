using System;
using System.Xml.Linq;
using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using Newtonsoft.Json.Linq;

namespace FishTrackerLambda.Services
{

    public class CatchService : ICatchService
    {
        private readonly ILogger<CatchService> m_logger;

        private readonly IAmazonDynamoDB m_client;

        public CatchService(ILogger<CatchService> logger, IAmazonDynamoDB client)
        {
            m_logger = logger;
            m_client = client;
        }

        public Task<CatchDetails> GetCatch(Guid tripId, Guid catchId)
        {
            return CatchDbTable.GetRecord(tripId, catchId, m_client, m_logger).ToCatchDetails();
        }

        public async Task<IEnumerable<CatchDetails>> GetTripCatch(Guid tripId)
        {
            var records = await CatchDbTable.GetAllRecords(tripId, m_client, m_logger);
            return records.Select(c => c.ToCatchDetails());
        }


        public Task<CatchDetails> NewCatch(Guid tripId, NewCatch newCatch)
        {
            return newCatch.CreateDyanmoRecord(tripId).CreateRecord(m_client, m_logger).ToCatchDetails();
        }

        public Task<CatchDetails> PatchCatch(Guid tripId, Guid catchId, UpdateCatchDetails updateCatch)
        {
            return CatchDbTable.GetRecord(tripId, catchId, m_client, m_logger).PatchCatch(updateCatch).UpdateRecord(m_client, m_logger).ToCatchDetails();
        }

        public Task<CatchDetails> UpdateCatch(CatchDetails upddateCatch)
        {
            return CatchDbTable.GetRecord(upddateCatch.tripId, upddateCatch.catchId, m_client, m_logger).UpdateCatch(upddateCatch).UpdateRecord(m_client, m_logger).ToCatchDetails();
        }
    }
}

