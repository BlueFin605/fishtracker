using System;
using System.Xml.Linq;
using Amazon.DynamoDBv2;
using FishTrackerLambda.Models.Lambda;

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

        public Task<CatchDetails> GetCatch(Guid catchId)
        {
            return CatchDbTable.GetRecord(catchId, m_client, m_logger).ToCatchDetails();
        }

        public Task<CatchDetails> NewCatch(NewCatch newCatch)
        {
            return newCatch.CreateDyanmoRecord().SaveRecord(m_client, m_logger).ToCatchDetails();
        }
    }
}

