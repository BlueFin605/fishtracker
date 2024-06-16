using System;
namespace GradientOfAgreementLambda.Models.Lambda
{
	public record AuthenticationResult(DateTime Expiration,
									   string Token,
									   string AccessKeyId,
									   string SecretAccessKey,
                                       string Region);
}

