using GradientOfAgreementLambda.Models.Lambda;

namespace GradientOfAgreementLambda.Services
{
    public interface IQuestionService
    {
        Task AddVote(Guid id, string sessionId, VoteType vote, string name);
        Task<QuestionResults> GetQuestionResults(Guid id, QuestionTokenDetails question);
        Task<VoteDetails?> GetQuestionVote(Guid id, string sessionId);
    }
}

