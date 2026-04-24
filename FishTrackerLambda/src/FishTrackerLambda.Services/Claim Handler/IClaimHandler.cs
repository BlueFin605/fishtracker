using Amazon.Lambda.APIGatewayEvents;

namespace FishTrackerLambda.ClaimHandler;

public interface IClaimHandler
{
    public string ExtractSubject(IEnumerable<System.Security.Claims.Claim> claims);
    public string ExtractSubject(APIGatewayHttpApiV2ProxyRequest proxy);
    public string ExtractEmail(IEnumerable<System.Security.Claims.Claim> claims);
    public bool ExtractEmailVerified(IEnumerable<System.Security.Claims.Claim> claims);
    public string ExtractDisplayName(IEnumerable<System.Security.Claims.Claim> claims);
}
