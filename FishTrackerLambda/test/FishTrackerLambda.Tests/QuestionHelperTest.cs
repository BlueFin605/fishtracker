using System.Text.Json;
using Xunit;
using Amazon.Lambda.Core;
using Amazon.Lambda.TestUtilities;
using Amazon.Lambda.APIGatewayEvents;
using Newtonsoft;
using FishTracker.Models.Lambda;
using FishTracker.Models.Persistance;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.DataCollection;
using FishTracker.Services;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace FishTracker.Tests;

public class QuestionHelperTest
{
    [Fact]
    public async Task TestAuthenticateQuestion()
    {
        var jsonText = @"{""QuestionId"":""d73cbc26-ba54-4202-901c-d568f65af98e"",""Votes"":{""Bob"":{""Vote"":""DisagreementButFollow""},""Julie"":{""Vote"":""Fully""},""Scott"":{""Vote"":""DisagreementButFollow""},""sessionid1"":{""Vote"":""Fully""},""sessionid2"":{""Vote"":""Fully""}}}";
        var dynoQ = JsonConvert.DeserializeObject<DynamodbQuestion>(jsonText, new StringEnumConverter());

        var dynoT = Task.FromResult(dynoQ);
        var vote = await dynoT.FindScoreForSession("sessionid2");
        Assert.Equal(VoteType.Fully,vote?.vote);
    }
}