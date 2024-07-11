namespace FishTrackerLambda.Models.Lambda;

public record class WeatherAttributes (
    TimeSpan fromMajorBiteTime,
    TimeSpan fromMinorBiteTime,
    DateTime majorBiteTime,
    DateTime minorBiteTime,
    DateTime sunSet,
    DateTime sunRise,
    DateTime moonSet,
    DateTime moonRise,
    DateTime lowTide,
    DateTime highTide,
    double tideHeight,
    Wind Wind
);
