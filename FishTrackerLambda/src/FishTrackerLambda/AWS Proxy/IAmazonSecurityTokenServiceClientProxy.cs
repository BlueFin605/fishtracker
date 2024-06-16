using System;
using System.Net.Mail;
using Amazon.SecurityToken.Model;

namespace GradientOfAgreementLambda.AWSProxy
{
    public interface IAmazonSecurityTokenServiceClientProxy
	{
        Task<AssumeRoleResponse> AssumeRoleAsync(IEnumerable<Tag> tags, CancellationToken cancellationToken = default(CancellationToken));
    }
}

