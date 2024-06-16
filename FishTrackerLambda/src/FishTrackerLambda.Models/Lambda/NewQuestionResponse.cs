using System;
using Newtonsoft.Json.Linq;

namespace FishTracker.Models.Lambda;

public record NewQuestionResponse(string QuestionToken, string sessionId);

