using System.Text.Json;
using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft;
using FishTracker.Models.Lambda;

namespace FishTracker.Tests;

public class AuthenticateControllerTests
{
    [Fact]
    public async Task TestAuthenticateQuestion()
    {
        var filename = "./SampleRequests/AuthenticateController-Question.json";
        APIGatewayProxyResponse response = await LambdaTestHelper.SendRequest(filename);

        Assert.Equal(200, response.StatusCode);
        var responseObj = Newtonsoft.Json.JsonConvert.DeserializeObject<AuthenticationResult>(response.Body);
        Assert.NotNull(responseObj);
        Assert.NotEmpty(responseObj.Token);
        Assert.Equal("session token", responseObj.Token);
        Assert.True(response.MultiValueHeaders.ContainsKey("Content-Type"));
        Assert.Equal("application/json; charset=utf-8", response.MultiValueHeaders["Content-Type"][0]);
    }
}