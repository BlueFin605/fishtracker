using Microsoft.AspNetCore.Mvc;
using GradientOfAgreementLambda.Models.Lambda;
using GradientOfAgreementLambda.Services;

namespace GradientOfAgreementLambda.Controllers;

[Route("api/[controller]")]
public class QuestionController : ControllerBase
{
    private readonly IQuestionService m_questionService;
    private readonly ILogger<QuestionController> m_logger;

    public QuestionController(IQuestionService questionService, ILogger<QuestionController> logger)
    {
        m_questionService = questionService;
        m_logger = logger;
    }

    // POST api/question?vote=Fully&qtoken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJRdWVzdGlvbiI6IlRoaXMgaXMgYSB0ZXN0IHF1ZXN0aW9uIiwiTm90ZXMiOiJUaGlzIGlzIHNvbWUgbnRlcyBvbiB0aGUgcXVlc3Rpb24iLCJQYXJ0aWNpcGFudHMiOltdLCJuYmYiOjE2OTEwOTk5ODksImV4cCI6MTY5MTEwMzU4OSwiaWF0IjoxNjkxMDk5OTg5fQ.BaNJjiKJkH_Yn1gjMAfoJAwDsLGzKOUBvyc1-5ZC-f4
    [HttpPost]
    public async Task<VoteResponse> Vote([FromQuery]string qtoken, [FromQuery] string sessionid, [FromQuery] string name, [FromQuery]VoteType vote)
    {
        try
        {
            var question = TokenGenerator.SplitToken(qtoken);
            sessionid = TokenGenerator.GenerateSessionId(sessionid);
            await m_questionService.AddVote(question.Id, sessionid, vote, name);
            return new VoteResponse(sessionid);
        }
        catch (Exception ex)
        {
            m_logger.LogError(ex, $"Exception in QuestionController.Vote[{ex.Message}]");
            throw;
        }
    }

    // GET api/question?vote=Fully&qtoken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJRdWVzdGlvbiI6IlRoaXMgaXMgYSB0ZXN0IHF1ZXN0aW9uIiwiTm90ZXMiOiJUaGlzIGlzIHNvbWUgbnRlcyBvbiB0aGUgcXVlc3Rpb24iLCJQYXJ0aWNpcGFudHMiOltdLCJuYmYiOjE2OTEwOTk5ODksImV4cCI6MTY5MTEwMzU4OSwiaWF0IjoxNjkxMDk5OTg5fQ.BaNJjiKJkH_Yn1gjMAfoJAwDsLGzKOUBvyc1-5ZC-f4
    [HttpGet]
    public Task<QuestionResults> GetAnswers([FromQuery] string qtoken)
    {
        var question = TokenGenerator.SplitToken(qtoken);
        return m_questionService.GetQuestionResults(question.Id, question);
    }
}