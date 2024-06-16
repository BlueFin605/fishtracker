namespace FishTracker.Models.Lambda
{
    public record QuestionResults(
        QuestionDetails details,
        AnswerResults answers,
        GradientResults gradiant);
}

