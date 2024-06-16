using Amazon.DynamoDBv2.DataModel;
using GradientOfAgreementLambda.Models.Lambda;

namespace GradientOfAgreementLambda.Models.Persistance
{
    public class DynamoDbVote
    {
        public VoteType Vote { get; set; }

        public string Name { get; set; }

        public string SessionId { get; }

        public DynamoDbVote(VoteType vote, string name, string sessionId)
        {
            Vote = vote;

            Name = name;

            SessionId = sessionId;
        }
    }
}

