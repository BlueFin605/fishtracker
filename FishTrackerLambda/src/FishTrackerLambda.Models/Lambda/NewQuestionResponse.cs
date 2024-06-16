using System;
using Newtonsoft.Json.Linq;

namespace GradientOfAgreementLambda.Models.Lambda;

public record NewQuestionResponse(string QuestionToken, string sessionId);

