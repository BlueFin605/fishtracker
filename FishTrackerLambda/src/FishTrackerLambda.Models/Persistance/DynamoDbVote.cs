using Amazon.DynamoDBv2.DataModel;
using FishTracker.Models.Lambda;

namespace FishTracker.Models.Persistance
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

