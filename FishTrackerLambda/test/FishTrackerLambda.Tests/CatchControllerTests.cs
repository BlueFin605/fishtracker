using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft;
using FishTrackerLambda.Models.Lambda;

namespace FishTrackerLambda.Tests;

public class TripControllerTests
{
    [Fact]
    public async Task TestGet()
    {
        var filename = "./SampleRequests/TripController-Get.json";
        APIGatewayProxyResponse response = await LambdaTestHelper.SendRequest(filename);

        Assert.Equal(200, response.StatusCode);

        var mystr = "{\"tripId\":\"6cc39752-b9b1-4bb4-befe-f1b082cc9e3d\",\"catchId\":\"5acb3a1b-9311-447b-95e5-7dfca626a3d2\",\"speciesId\":\"aa632249-1ab4-423b-bc4d-3eeb9f2dbaa0\",\"caughtLocation\":{\"longitude\":1,\"latitute\":2},\"caughtWhen\":\"1970-01-01T00:00:00Z\",\"caughtSize\":\"Medium\",\"caughtLength\":10}";
        Assert.Equal(mystr, response.Body);

        Assert.True(response.MultiValueHeaders.ContainsKey("Content-Type"));
        Assert.Equal("application/json; charset=utf-8", response.MultiValueHeaders["Content-Type"][0]);
    }

    //	response.Body	"{\"id\":\"c57ad48c-8841-44a2-a447-d15e5fe873f2\",\"question\":\"This is a test question\",\"notes\":\"This is some ntes on the question\",\"participants\":[]}"	
    [Fact]
    public async Task TestPost()
    {
        var filename = "./SampleRequests/TripController-Post.json";
        APIGatewayProxyResponse response = await LambdaTestHelper.SendRequest(filename);

        Assert.Equal(200, response.StatusCode);
        var responseObj = Newtonsoft.Json.JsonConvert.DeserializeObject<CatchDetails>(response.Body);
        Assert.NotNull(responseObj);

        var mystr = "{\"tripId\":\"6cc39752-b9b1-4bb4-befe-f1b082cc9e3d\",\"catchId\":\"5acb3a1b-9311-447b-95e5-7dfca626a3d2\",\"speciesId\":\"aa632249-1ab4-423b-bc4d-3eeb9f2dbaa0\",\"caughtLocation\":{\"longitude\":1,\"latitute\":2},\"caughtWhen\":\"1970-01-01T00:00:00Z\",\"caughtSize\":\"Medium\",\"caughtLength\":10}";
        Assert.Equal(mystr, response.Body);

        //Assert.(responseObj.catchId);
        Assert.True(response.MultiValueHeaders.ContainsKey("Content-Type"));
        Assert.Equal("application/json; charset=utf-8", response.MultiValueHeaders["Content-Type"][0]);
    }
}