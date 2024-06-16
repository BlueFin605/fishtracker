using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft;
using GradientOfAgreementLambda.Models.Lambda;

namespace GradientOfAgreementLambda.Tests;

public class QuestionManagerControllerTests
{
    [Fact]
    public async Task TestGet()
    {
        var filename = "./SampleRequests/QuestionManagerController-Get.json";
        APIGatewayProxyResponse response = await LambdaTestHelper.SendRequest(filename);

        Assert.Equal(200, response.StatusCode);
        var mystr = "{\"id\":\"71afaf34-e576-4234-b874-3aa7ca010a5f\",\"question\":\"This is a test question\",\"notes\":\"This is some ntes on the question\",\"participants\":[],\"vote\":{\"vote\":\"Fully\",\"name\":\"name\",\"sessionId\":\"sessionid\"}}";
        Assert.Equal(mystr, response.Body);

        Assert.True(response.MultiValueHeaders.ContainsKey("Content-Type"));
        Assert.Equal("application/json; charset=utf-8", response.MultiValueHeaders["Content-Type"][0]);
    }

    //	response.Body	"{\"id\":\"c57ad48c-8841-44a2-a447-d15e5fe873f2\",\"question\":\"This is a test question\",\"notes\":\"This is some ntes on the question\",\"participants\":[]}"	
    [Fact]
    public async Task TestPost()
    {
        var filename = "./SampleRequests/QuestionManagerController-Post.json";
        APIGatewayProxyResponse response = await LambdaTestHelper.SendRequest(filename);

        Assert.Equal(200, response.StatusCode);
        var responseObj = Newtonsoft.Json.JsonConvert.DeserializeObject<NewQuestionResponse>(response.Body);
        Assert.NotNull(responseObj);
        Assert.NotEmpty(responseObj.QuestionToken);
        Assert.True(response.MultiValueHeaders.ContainsKey("Content-Type"));
        Assert.Equal("application/json; charset=utf-8", response.MultiValueHeaders["Content-Type"][0]);
    }
}