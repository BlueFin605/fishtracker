using Amazon.DynamoDBv2.DataModel;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    [DynamoDBTable("FishTracker-Shares-Prod")]
    public class DynamoDbShare
    {
        [DynamoDBHashKey]
        public string OwnerSubject { get; set; } = string.Empty;

        [DynamoDBRangeKey]
        public string ShareId { get; set; } = string.Empty;

        public string OwnerDisplayName { get; set; } = string.Empty;
        public string RecipientEmail { get; set; } = string.Empty;   // lower-cased
        public string? RecipientSubject { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public string? ClaimedAt { get; set; }
        public string? RevokedAt { get; set; }
        public string? ExpiresAt { get; set; }
        public bool FuzzLocation { get; set; }
        public string? Message { get; set; }
        public string? ThumbnailS3Key { get; set; }
        public int ViewCount { get; set; }
        public string? LastViewedAt { get; set; }
        public string? LastViewedBySubject { get; set; }

        public List<FrozenTrip> Trips { get; set; } = new();

        [DynamoDBVersion]
        public int? DynamoDbVersion { get; set; }

        public DynamoDbShare() { }
    }
}
