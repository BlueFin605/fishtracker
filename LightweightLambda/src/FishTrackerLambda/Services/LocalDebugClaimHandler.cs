using System.Security.Claims;

namespace FishTrackerLambda.Services
{
    public class LocalDebugClaimHandler : IClaimHandler
    {
        public string ExtractSubject(IEnumerable<Claim> claims)
        {
            return "myprincipal";
        }
    }
}

