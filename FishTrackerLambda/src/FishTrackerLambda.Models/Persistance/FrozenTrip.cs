using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Models.Persistance
{
    public class FrozenTrip
    {
        public string TripId { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string? EndTime { get; set; }
        public string Notes { get; set; } = string.Empty;
        public TripRating Rating { get; set; }
        public List<TripTags> Tags { get; set; } = new();
        public string[] Species { get; set; } = Array.Empty<string>();
        public string DefaultSpecies { get; set; } = string.Empty;
        public List<FrozenCatch> Catches { get; set; } = new();

        public FrozenTripDto ToDto() => new FrozenTripDto(
            TripId,
            DateTimeOffset.Parse(StartTime),
            string.IsNullOrEmpty(EndTime) ? null : DateTimeOffset.Parse(EndTime),
            Notes,
            Rating,
            Tags,
            Species,
            DefaultSpecies,
            Catches.Select(c => c.ToDto()).ToList());
    }
}
