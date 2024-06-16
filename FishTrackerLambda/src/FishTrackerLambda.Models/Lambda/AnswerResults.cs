namespace GradientOfAgreementLambda.Models.Lambda
{
    public record AnswerResults
    (
        uint Fully,
        uint Endorsement,
        uint Agree,
        uint Abstain,
        uint StandAside,
        uint DisagreementButFollow,
        uint DisagreementLeaveMeOut,
        uint NoSupport
    );
}

