using Amazon.CDK;
using Amazon.CDK.Assertions;
using FishTracker.Cdk;
using Xunit;

namespace FishTracker.Cdk.Tests;

public class FishTrackerStackTests
{
    private static Template Synth(string? poolId = null, string? domain = null)
    {
        // Lambda assets are referenced relative to the infrastructure folder (where cdk runs).
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "cdk.json"))) dir = dir.Parent;
        Directory.SetCurrentDirectory(dir!.FullName);

        var app = new App();
        var stack = new FishTrackerStack(app, "FishTracker-Test", new FishTrackerStackProps
        {
            Env = new Amazon.CDK.Environment { Account = "123456789012", Region = "ap-southeast-2" },
            Environment = "Test",
            DomainName = "example.com",
            IdentityUserPoolId = poolId,
            IdentityDomain = domain
        });
        return Template.FromStack(stack);
    }

    [Fact]
    public void DefaultMode_CreatesOwnPoolGoogleIdpAndDomain()
    {
        var t = Synth();
        t.ResourceCountIs("AWS::Cognito::UserPool", 1);
        t.ResourceCountIs("AWS::Cognito::UserPoolIdentityProvider", 1);
        t.ResourceCountIs("AWS::Cognito::UserPoolDomain", 1);
        t.ResourceCountIs("AWS::Cognito::UserPoolClient", 2);
        var pools = t.FindResources("AWS::Cognito::UserPool");
        foreach (var p in pools.Values)
            Assert.Contains("Retain", System.Text.Json.JsonSerializer.Serialize(p));
        t.HasOutput("AuthDomain", Match.ObjectLike(new Dictionary<string, object> { { "Value", "auth.test.fishtracker.example.com" } }));
    }

    [Fact]
    public void ExternalMode_ImportsPoolAndSkipsOwnIdentityResources()
    {
        var t = Synth("ap-southeast-2_TEST", "auth.example.com");
        t.ResourceCountIs("AWS::Cognito::UserPool", 0);
        t.ResourceCountIs("AWS::Cognito::UserPoolIdentityProvider", 0);
        t.ResourceCountIs("AWS::Cognito::UserPoolDomain", 0);
        t.ResourceCountIs("AWS::Cognito::UserPoolClient", 2);
        t.AllResourcesProperties("AWS::Cognito::UserPoolClient", Match.ObjectLike(new Dictionary<string, object>
        {
            { "UserPoolId", "ap-southeast-2_TEST" },
            { "SupportedIdentityProviders", new[] { "COGNITO", "Google" } }
        }));
        t.HasOutput("AuthDomain", Match.ObjectLike(new Dictionary<string, object> { { "Value", "auth.example.com" } }));
        t.HasOutput("UserPoolId", Match.ObjectLike(new Dictionary<string, object> { { "Value", "ap-southeast-2_TEST" } }));
        t.HasResourceProperties("AWS::IAM::Policy", Match.ObjectLike(new Dictionary<string, object>
        {
            { "PolicyDocument", Match.ObjectLike(new Dictionary<string, object>
                { { "Statement", Match.ArrayWith(new object[] { Match.ObjectLike(new Dictionary<string, object> { { "Action", "cognito-idp:AdminGetUser" } }) }) } }) }
        }));
    }

    [Fact]
    public void OnlyOneIdentityParam_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => Synth(poolId: "ap-southeast-2_TEST"));
        Assert.Throws<InvalidOperationException>(() => Synth(domain: "auth.example.com"));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void IdentityAliasTable_ExistsInBothModes_AndIsWiredToLambda(bool external)
    {
        var t = external ? Synth("ap-southeast-2_TEST", "auth.example.com") : Synth();
        t.HasResource("AWS::DynamoDB::Table", Match.ObjectLike(new Dictionary<string, object>
        {
            { "Properties", Match.ObjectLike(new Dictionary<string, object>
                {
                    { "TableName", "FishTracker-IdentityAlias-Test" },
                    { "BillingMode", "PAY_PER_REQUEST" },
                    { "KeySchema", new object[] { new Dictionary<string, object> { { "AttributeName", "Subject" }, { "KeyType", "HASH" } } } },
                    { "PointInTimeRecoverySpecification", new Dictionary<string, object> { { "PointInTimeRecoveryEnabled", true } } }
                }) },
            { "DeletionPolicy", "Retain" }
        }));
        t.HasResourceProperties("AWS::Lambda::Function", Match.ObjectLike(new Dictionary<string, object>
        {
            { "FunctionName", "FishTracker-Lambda-NodeJs-Test" },
            { "Environment", Match.ObjectLike(new Dictionary<string, object>
                { { "Variables", Match.ObjectLike(new Dictionary<string, object> { { "IDENTITY_ALIAS_TABLE", Match.AnyValue() } }) } }) }
        }));
    }
}
