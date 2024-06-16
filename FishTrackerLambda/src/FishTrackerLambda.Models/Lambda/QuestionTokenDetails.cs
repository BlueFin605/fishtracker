//using Newtonsoft.Json.Converters;

namespace FishTracker.Models.Lambda;

public record class QuestionTokenDetails(
    Guid Id,
    string Question,
    string Notes,
    List<PersonRequest> Participants,
    string? OwnerSessionId
    );
