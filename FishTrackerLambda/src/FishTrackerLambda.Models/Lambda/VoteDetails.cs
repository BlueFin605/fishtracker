//using Newtonsoft.Json.Converters;

namespace GradientOfAgreementLambda.Models.Lambda;

public record class VoteDetails (
    VoteType? vote,
    string name,
    string sessionId);
