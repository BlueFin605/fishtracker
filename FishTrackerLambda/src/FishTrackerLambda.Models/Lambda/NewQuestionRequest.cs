using System;
namespace FishTracker.Models.Lambda
{
    public record NewQuestionRequest(
        string Question,
        string Notes,
        List<PersonRequest> Participants,
        string sessionId);
}

