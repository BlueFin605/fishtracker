using System;
using System.Xml.Linq;
using Amazon.DynamoDBv2;
using FishTracker.Models.Lambda;

namespace FishTracker.Services
{

    public class QuestionService : IQuestionService
    {
        private readonly ILogger<QuestionService> m_logger;

        private readonly IAmazonDynamoDB m_client;

        public QuestionService(ILogger<QuestionService> logger, IAmazonDynamoDB client)
        {
            m_logger = logger;
            m_client = client;
        }

        public async Task AddVote(Guid id, string sessionId, VoteType vote, string name)
        {
            m_logger.LogInformation($"QuestionService::AddVote id[{id}] sessionId[{sessionId}] vote[{vote}] name[{name}]");
            await QuestionHelper.GetQuestion(id, m_client, m_logger).AddVote(sessionId, vote, name, m_logger).SaveQuestion(m_client, m_logger);
        }

        public Task<QuestionResults> GetQuestionResults(Guid id, QuestionTokenDetails question)
        {
            return QuestionHelper.GetQuestion(id, m_client, m_logger).BuildQuestionResults(question);
        }

        public Task<VoteDetails?> GetQuestionVote(Guid id, string sessionId)
        {
            return QuestionHelper.GetQuestion(id, m_client, m_logger).FindScoreForSession(sessionId);
        }
    }
}

