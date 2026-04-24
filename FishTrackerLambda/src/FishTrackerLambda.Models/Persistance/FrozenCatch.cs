using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Models.Persistance
{
    public class FrozenCatch
    {
        public string CatchId { get; set; } = string.Empty;
        public string SpeciesId { get; set; } = string.Empty;
        public Location DisplayLocation { get; set; } = new Location();
        public string CaughtWhen { get; set; } = string.Empty;   // ISO-8601
        public FishSize CaughtSize { get; set; }
        public double CaughtLength { get; set; }
        public WeatherAttributes? Weather { get; set; }

        public FrozenCatchDto ToDto() => new FrozenCatchDto(
            CatchId,
            SpeciesId,
            DisplayLocation,
            DateTimeOffset.Parse(CaughtWhen),
            CaughtSize,
            CaughtLength,
            Weather);
    }
}
