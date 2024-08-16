using System;

namespace FishTrackerLambda.ClaimHandler;

public interface IClaimHandler
{
    public string ExtractSubject(IEnumerable<System.Security.Claims.Claim> claims);
}