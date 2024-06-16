using System.Text.Json;
using Amazon.Lambda.TestUtilities;
using Amazon.Lambda.APIGatewayEvents;

namespace FishTracker.Tests;

public static class LambdaTestHelper
{
    public static async Task<APIGatewayProxyResponse> SendRequest(string filename)
    {
        var lambdaFunction = new TestEntryPoint();

        var requestStr = File.ReadAllText(filename);
        var request = JsonSerializer.Deserialize<APIGatewayProxyRequest>(requestStr, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        var context = new TestLambdaContext();
        var response = await lambdaFunction.FunctionHandlerAsync(request, context);
        return response;
    }
}
