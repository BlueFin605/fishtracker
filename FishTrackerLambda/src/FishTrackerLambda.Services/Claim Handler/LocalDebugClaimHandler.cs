using System.Security.Claims;
using Amazon.Lambda.APIGatewayEvents;

namespace FishTrackerLambda.ClaimHandler;

public class LocalDebugClaimHandler : IClaimHandler
{
    public string ExtractSubject(IEnumerable<Claim> claims)
    {
        return "myprincipal";
    }

    public string ExtractSubject(APIGatewayHttpApiV2ProxyRequest proxy)
    {
        return "myprincipal";
    }

    public string ExtractEmail(IEnumerable<Claim> claims) => "dev@example.com";

    public bool ExtractEmailVerified(IEnumerable<Claim> claims) => true;

    public string ExtractDisplayName(IEnumerable<Claim> claims) => "Dev User";
}

