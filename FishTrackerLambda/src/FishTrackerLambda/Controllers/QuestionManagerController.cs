using Microsoft.AspNetCore.Mvc;
using GradientOfAgreementLambda.Models.Lambda;
using GradientOfAgreementLambda.Services;

namespace GradientOfAgreementLambda.Controllers;

[Route("api/[controller]")]
public class QuestionManagerController : ControllerBase
{
    private readonly IQuestionService m_questionService;

    private readonly ILogger<QuestionManagerController> m_logger;

    public QuestionManagerController(IQuestionService questionService, ILogger<QuestionManagerController> logger)
    {
        m_questionService = questionService;
        m_logger = logger;
    }

    // GET api/questionmanager/question?qtoken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJRdWVzdGlvbiI6IlRoaXMgaXMgYSB0ZXN0IHF1ZXN0aW9uIiwiTm90ZXMiOiJUaGlzIGlzIHNvbWUgbnRlcyBvbiB0aGUgcXVlc3Rpb24iLCJQYXJ0aWNpcGFudHMiOltdLCJuYmYiOjE2OTEwOTk5ODksImV4cCI6MTY5MTEwMzU4OSwiaWF0IjoxNjkxMDk5OTg5fQ.BaNJjiKJkH_Yn1gjMAfoJAwDsLGzKOUBvyc1-5ZC-f4
    [HttpGet]
    public async Task<QuestionDetails> GetDetailsOfQuestion([FromQuery] string qtoken, [FromQuery] string sessionId)
    {
        var question = TokenGenerator.SplitToken(qtoken);
        var sessionvote = await m_questionService.GetQuestionVote(question.Id, sessionId);
        return question.AddVote(sessionvote);
    }

    // POST api/questionmanager
    [HttpPost]
    public NewQuestionResponse CreateNewQuestion([FromBody] NewQuestionRequest request)
    {
        var sessionId = TokenGenerator.GenerateSessionId(request.sessionId);
        var question = new QuestionTokenDetails(Guid.NewGuid(), request.Question, request.Notes, request.Participants, sessionId);
        return new NewQuestionResponse(TokenGenerator.GenerateToken(question), sessionId);
    }
}