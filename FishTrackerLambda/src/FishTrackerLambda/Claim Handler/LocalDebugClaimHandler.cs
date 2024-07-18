using System.Security.Claims;

namespace FishTrackerLambda.ClaimHandler;

public class LocalDebugClaimHandler : IClaimHandler
{
    public string ExtractSubject(IEnumerable<Claim> claims)
    {
        return "myprincipal";
    }
}

