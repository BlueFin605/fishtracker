//using Newtonsoft.Json.Converters;

namespace FishTracker.Models.Lambda;

public record class VoteDetails (
    VoteType? vote,
    string name,
    string sessionId);
