using System;
using System.Xml.Linq;
using Amazon.DynamoDBv2;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Helpers;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using FishTrackerLambda.Services.Http;
using Microsoft.Extensions.Logging;
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

        public Task<HttpWrapper<CatchDetails>> GetCatch(string subject, string tripId, Guid catchId)
        {
            return CatchDbTable.ReadCatchFromDynamodb(IdGenerator.GenerateTripKey(subject, tripId), catchId, m_client, m_logger)
                .Map(c => c.ToCatchDetails());
        }

        public Task<HttpWrapper<IEnumerable<CatchDetails>>> GetTripCatch(string subject, string tripId)
        {
            return CatchDbTable.ReadAllCatchFromDynamoDb(IdGenerator.GenerateTripKey(subject,tripId), m_client, m_logger)
                .Map( c => c.Select(r => r.ToCatchDetails()));
        }

        public Task<HttpWrapper<CatchDetails>> NewCatch(string subject, string tripId, NewCatch newCatch)
        {
            return Function
                .ValidateInput(() => {
                    return newCatch.caughtWhen != null || newCatch.timeZone != null ? null : Results.BadRequest("Must supply either a datetime or timezone");
                 })
                .Init(newCatch.FillInMissingData())
                .Map( c => c.CreateNewDyanmoRecord(subject, tripId))
                .MapAsync(c => c.WriteCatchToDynamoDb(m_client, m_logger))
                .Map(d => d.ToCatchDetails());
        }

        public Task<HttpWrapper<CatchDetails>> PatchCatch(string subject, string tripId, Guid catchId, UpdateCatchDetails updateCatch)
        {
            return CatchDbTable.ReadCatchFromDynamodb(IdGenerator.GenerateTripKey(subject, tripId), catchId, m_client, m_logger)
                .Map(c => c.PatchCatch(updateCatch))
                .MapAsync(c => c.UpdateCatchInDynamodb(m_client, m_logger))
                .Map(c => c.ToCatchDetails());
        }

        public Task<HttpWrapper<CatchDetails>> UpdateCatch(string subject, string tripId, Guid catchId, CatchDetails updateCatch)
        {
            return Function
                .ValidateInput(() => {
                    return tripId == updateCatch.tripId ? null : Results.BadRequest($"Cannot change tripId from[{tripId}] to[{updateCatch.tripId}]");
                 })
                .ValidateInput(() => {
                    return catchId == updateCatch.catchId ? null : Results.BadRequest($"Cannot change tripId from[{catchId}] to[{updateCatch.catchId}]");
                 })
                .MapAsync( c => CatchDbTable.ReadCatchFromDynamodb(IdGenerator.GenerateTripKey(subject, tripId), updateCatch.catchId, m_client, m_logger))
                .Map(c => c.UpdateCatch(updateCatch))
                .MapAsync(c => c.UpdateCatchInDynamodb(m_client, m_logger))
                .Map(c => c.ToCatchDetails());
        }
    }
}

