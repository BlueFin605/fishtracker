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
            return CatchDbTable.GetRecord(tripId, catchId, m_client, m_logger)
                .Map(c => c.ToCatchDetailsWrapper());
            //Task<HttpWrapper<DynamoDbCatch>> x = CatchDbTable.GetRecord(tripId, catchId, m_client, m_logger);
            //Task<HttpWrapper<CatchDetails>> y = x.Map<DynamoDbCatch, CatchDetails>(c => c.ToCatchDetailsWrapper());
            //return y;
        }

        public Task<HttpWrapper<IEnumerable<CatchDetails>>> GetTripCatch(string tripId)
        {
            return CatchDbTable.GetAllRecords(tripId, m_client, m_logger)
                .MapSuccess( c => c.Select(r => r.ToCatchDetailsRaw()));
        }


        public Task<HttpWrapper<CatchDetails>> NewCatch(string tripId, NewCatch newCatch)
        {
            return newCatch.CreateDyanmoRecord(tripId)
                .Map(c => c.WriteDynamDbCatchRecord(m_client, m_logger))
                .MapSuccess(d => d.ToCatchDetailsRaw());
        }

        public Task<HttpWrapper<CatchDetails>> PatchCatch(string tripId, Guid catchId, UpdateCatchDetails updateCatch)
        {
            return CatchDbTable.GetRecord(tripId, catchId, m_client, m_logger)
                .MapSuccess(c => c.PatchCatch(updateCatch))
                .Map(c => c.UpdateRecord(m_client, m_logger))
                .MapSuccess(c => c.ToCatchDetailsRaw());
        }

        public Task<HttpWrapper<CatchDetails>> UpdateCatch(CatchDetails updateCatch)
        {
            return CatchDbTable.GetRecord(updateCatch.tripId, updateCatch.catchId, m_client, m_logger)
                .MapSuccess(c => c.UpdateCatch(updateCatch))
                .Map(c => c.UpdateRecord(m_client, m_logger))
                .MapSuccess(c => c.ToCatchDetailsRaw());
        }
    }
}

