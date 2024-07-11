using System;

namespace FishTrackerLambda.Services
{
    public interface IClaimHandler
	{
		public string ExtractSubject(IEnumerable<System.Security.Claims.Claim> claims);
	}
}

