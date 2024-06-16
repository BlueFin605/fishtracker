using System;
namespace FishTracker.Models.Lambda
{
	public record AuthenticationResult(DateTime Expiration,
									   string Token,
									   string AccessKeyId,
									   string SecretAccessKey,
                                       string Region);
}

