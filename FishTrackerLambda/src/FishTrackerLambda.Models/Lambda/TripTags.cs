using System.Collections;
using System.Text.Json.Serialization;

namespace FishTrackerLambda.Models.Lambda;

public class TripTags : IEqualityComparer
{
    public String Tag { get; }

    public TagType Type { get; }

    public enum TagType
    {
        Standard,
        Custom
    };

    public TripTags(StdTripTags tag)
    {
        Tag = $"{tag}";
        Type = TagType.Standard;
    }

    public TripTags(String tag)
    {
        Tag = tag;
        Type = TagType.Custom;
    }

    [JsonConstructorAttribute]
    public TripTags(String tag, TagType type)
    {
        Tag = tag;
        Type = type;
    }

    public new bool Equals(object? x, object? y)
    {
        if (ReferenceEquals(x, y))
            return true;
    
        if (x is null || y is null)
            return false;
    
        if (x.GetType() != typeof(TripTags) || x.GetType() != y.GetType())
            return false;
    
        var tripTagsX = (TripTags)x;
        var tripTagsY = (TripTags)y;
    
        return tripTagsX.Tag == tripTagsY.Tag;
    }

    public int GetHashCode(object obj)
    {
        return Tag.GetHashCode();
    }
}