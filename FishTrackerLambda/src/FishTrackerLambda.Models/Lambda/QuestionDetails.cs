using System;
using System.Text.Json.Serialization;
//using Newtonsoft.Json.Converters;

namespace GradientOfAgreementLambda.Models.Lambda;

public record class QuestionDetails (
    Guid Id,
    string Question,
    string Notes,
    List<PersonRequest> Participants,
    VoteDetails? vote
    );
