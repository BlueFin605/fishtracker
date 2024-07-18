using System.Security.Claims;

namespace FishTrackerLambda.ClaimHandler;

public class LambdaClaimHandler : IClaimHandler
{
    public string ExtractSubject(IEnumerable<Claim> claims)
    {
        var subjectClaim = claims.FirstOrDefault(claim => claim.Type == "principalId")?.Value ?? throw new Exception("No Subject[principalId] in claim");
        return subjectClaim;
    }
}

