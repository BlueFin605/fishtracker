using System;
using System.Xml.Linq;
using Amazon.DynamoDBv2;
using FishTrackerLambda.Functional;
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

        public Task<HttpWrapper<CatchDetails>> GetCatch(string tripId, Guid catchId)
        {
            return CatchDbTable.GetRecord(tripId, catchId, m_client, m_logger).ToCatchDetails();
        }

        public async Task<IEnumerable<CatchDetails>> GetTripCatch(string tripId)
        {
            var records = await CatchDbTable.GetAllRecords(tripId, m_client, m_logger);
            return records.Select(c => c.ToCatchDetails());
        }


        public Task<CatchDetails> NewCatch(string tripId, NewCatch newCatch)
        {
            return newCatch.CreateDyanmoRecord(tripId).CreateRecord(m_client, m_logger).ToCatchDetailsOld();
        }

        public Task<CatchDetails> PatchCatch(string tripId, Guid catchId, UpdateCatchDetails updateCatch)
        {
            return CatchDbTable.GetRecordOld(tripId, catchId, m_client, m_logger).PatchCatch(updateCatch).UpdateRecord(m_client, m_logger).ToCatchDetailsOld();
        }

        public Task<CatchDetails> UpdateCatch(CatchDetails upddateCatch)
        {
            return CatchDbTable.GetRecordOld(upddateCatch.tripId, upddateCatch.catchId, m_client, m_logger).UpdateCatch(upddateCatch).UpdateRecord(m_client, m_logger).ToCatchDetailsOld();
        }
    }
}

