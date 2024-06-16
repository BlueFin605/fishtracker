using Microsoft.AspNetCore.Mvc;
using GradientOfAgreementLambda.Models.Lambda;
using GradientOfAgreementLambda.Services;
using Newtonsoft.Json.Linq;
using GradientOfAgreementLambda.AWSProxy;
using Amazon.SecurityToken.Model;

namespace GradientOfAgreementLambda.Controllers;

[Route("api/[controller]")]
public class AuthenticateController : ControllerBase
{
    private readonly ILogger<QuestionManagerController> m_logger;
    private readonly IAmazonSecurityTokenServiceClientProxy m_stsProxy;

    public AuthenticateController(ILogger<QuestionManagerController> logger, IAmazonSecurityTokenServiceClientProxy stsProxy)
    {
        m_logger = logger;
        m_stsProxy = stsProxy;
    }

    [HttpGet("question")]
    public async Task<AuthenticationResult> AuthenticateQuestion(string qtoken)
    {
        var tags = new List<Tag>();
        var token = TokenGenerator.SplitToken(qtoken);
        tags.Add(new Tag() { Key = "id", Value = token.Id.ToString() });
        var session = await m_stsProxy.AssumeRoleAsync(tags);
        m_logger.LogInformation("Got session:[{0}]", session.Credentials.SessionToken);
        return new AuthenticationResult(session.Credentials.Expiration, session.Credentials.SessionToken, session.Credentials.AccessKeyId, session.Credentials.SecretAccessKey, "eu-central-1");
    }
}