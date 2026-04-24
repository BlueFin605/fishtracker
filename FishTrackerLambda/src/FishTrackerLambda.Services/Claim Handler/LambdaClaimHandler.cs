using System.Security.Claims;
using Amazon.Lambda.APIGatewayEvents;

namespace FishTrackerLambda.ClaimHandler;

public class LambdaClaimHandler : IClaimHandler
{
    public string ExtractSubject(IEnumerable<Claim> claims)
    {
        var subjectClaim = claims.FirstOrDefault(claim => claim.Type == "principalId")?.Value ?? throw new Exception("No Subject[principalId] in claim");
        return subjectClaim;
    }

    public string ExtractSubject(APIGatewayHttpApiV2ProxyRequest proxy)
    {
        var subjectClaim = proxy?.RequestContext?.Authorizer?.Jwt?.Claims["principalId"] ?? throw new Exception("No Subject[principalId] in claim");
        return subjectClaim;
    }

    public string ExtractEmail(IEnumerable<Claim> claims) =>
        claims.FirstOrDefault(c => c.Type == "email")?.Value ?? "";

    public bool ExtractEmailVerified(IEnumerable<Claim> claims) =>
        claims.FirstOrDefault(c => c.Type == "email_verified")?.Value == "true";

    public string ExtractDisplayName(IEnumerable<Claim> claims) =>
        claims.FirstOrDefault(c => c.Type == "name")?.Value
        ?? claims.FirstOrDefault(c => c.Type == "cognito:username")?.Value
        ?? ExtractEmail(claims);
}

