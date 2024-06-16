using System;
namespace GradientOfAgreementLambda.Models.Lambda
{
    public record NewQuestionRequest(
        string Question,
        string Notes,
        List<PersonRequest> Participants,
        string sessionId);
}

