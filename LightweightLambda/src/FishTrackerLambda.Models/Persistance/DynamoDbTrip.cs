using Amazon.DynamoDBv2.DataModel;
using FishTrackerLambda.Models.Lambda;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    [DynamoDBTable("FishTracker-Trips-Prod")]
    public class DynamoDbTrip
    {
        [DynamoDBHashKey]   //Partition key
        public string Subject { get; set; }
        [DynamoDBRangeKey]
        public string TripId { get; set;  }
        //[DynamoDBProperty]
        public DateTime StartTime { get; set;  }
        //[DynamoDBProperty]
        public DateTime? EndTime { get; set;  }
        //[DynamoDBProperty]
        public string Notes { get; set;  }
        //[DynamoDBProperty]
        public uint CatchSize { get; set;  }
        //[DynamoDBProperty]
        public TripRating Rating { get; set;  }
        //[DynamoDBProperty]
        public List<TripTags> Tags { get; set;  }

        [DynamoDBVersion]
        public int? DynamoDbVersion { get; set; }

        [JsonConstructor]
        public DynamoDbTrip(string subject, string tripId, DateTime startTime, DateTime? endTime, string notes, uint catchSize, TripRating rating, List<TripTags> tags, int? dynamoDbVersion)
        {
            Subject = subject;
            TripId = tripId;
            StartTime = startTime;
            EndTime = endTime;
            Notes = notes;
            CatchSize = catchSize;
            Rating = rating;
            Tags = tags;
            DynamoDbVersion = dynamoDbVersion;
        }

        public DynamoDbTrip(string subject, string tripId)
        {
            Subject = subject;
            TripId = tripId;
            Notes = String.Empty;
            Tags = new List<TripTags>();
        }

        public DynamoDbTrip()
        {
            Subject = string.Empty;
            TripId = string.Empty;
            Notes = string.Empty;
            Tags = new List<TripTags>();
            Notes = string.Empty;
        }

    }
}
