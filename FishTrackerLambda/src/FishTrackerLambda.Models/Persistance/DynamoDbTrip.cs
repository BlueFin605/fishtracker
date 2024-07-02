using FishTrackerLambda.Models.Lambda;
using Newtonsoft.Json;

namespace FishTrackerLambda.Models.Persistance
{
    public class DynamoDbTrip
    {
        public string Subject { get; }
        public Guid TripId { get; }
        public DateTime StartTime { get; }
        public DateTime? EndTime { get; }
        public string Notes { get; }
        public uint CatchSize { get; }
        public TripRating Rating { get; }
        public List<TripTags> Tags { get; }

        [JsonConstructor]
        public DynamoDbTrip(string subject, Guid tripId, DateTime startTime, DateTime? endTime, string notes, uint catchSize, TripRating rating, List<TripTags> tags)
        {
            Subject = subject;
            TripId = tripId;
            StartTime = startTime;
            EndTime = endTime;
            Notes = notes;
            CatchSize = catchSize;
            Rating = rating;
            Tags = tags;
        }

        public DynamoDbTrip(string subject, Guid tripId)
        {
            Subject = subject;
            TripId = tripId;
            Notes = String.Empty;
            Tags = new List<TripTags>();
        }
    }
}
