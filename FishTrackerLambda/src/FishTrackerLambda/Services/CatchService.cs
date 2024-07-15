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
            return CatchDbTable.ReadCatchFromDynamodb(tripId, catchId, m_client, m_logger)
                .Map(c => c.ToCatchDetails());
        }

        public Task<HttpWrapper<IEnumerable<CatchDetails>>> GetTripCatch(string tripId)
        {
            return CatchDbTable.ReadAllCatchFromDynamoDb(tripId, m_client, m_logger)
                .Map( c => c.Select(r => r.ToCatchDetails()));
        }


        public Task<HttpWrapper<CatchDetails>> NewCatch(string tripId, NewCatch newCatch)
        {
            return Function.Init(newCatch.CreateNewDyanmoRecord(tripId))
                .MapAsync(c => c.WriteCatchToDynamoDb(m_client, m_logger))
                .Map(d => d.ToCatchDetails());
        }

        public Task<HttpWrapper<CatchDetails>> PatchCatch(string tripId, Guid catchId, UpdateCatchDetails updateCatch)
        {
            return CatchDbTable.ReadCatchFromDynamodb(tripId, catchId, m_client, m_logger)
                .Map(c => c.PatchCatch(updateCatch))
                .MapAsync(c => c.UpdateCatchInDynamodb(m_client, m_logger))
                .Map(c => c.ToCatchDetails());
        }

        public Task<HttpWrapper<CatchDetails>> UpdateCatch(string tripId, Guid catchId, CatchDetails updateCatch)
        {
            return Function
                .ValidateInput(() => {
                    return tripId == updateCatch.tripId ? null : Results.BadRequest($"Cannot change tripId from[{tripId}] to[{updateCatch.tripId}]");
                 })
                .ValidateInput(() => {
                    return catchId == updateCatch.catchId ? null : Results.BadRequest($"Cannot change tripId from[{catchId}] to[{updateCatch.catchId}]");
                 })
                .MapAsync( c => CatchDbTable.ReadCatchFromDynamodb(updateCatch.tripId, updateCatch.catchId, m_client, m_logger))
                .Map(c => c.UpdateCatch(updateCatch))
                .MapAsync(c => c.UpdateCatchInDynamodb(m_client, m_logger))
                .Map(c => c.ToCatchDetails());
        }
    }
}

