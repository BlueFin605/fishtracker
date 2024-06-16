using Amazon.SecurityToken.Model;

namespace FishTracker.AWSProxy
{
    class AmazonSecurityTokenServiceClient_Test : IAmazonSecurityTokenServiceClientProxy
    {
        public Task<AssumeRoleResponse> AssumeRoleAsync(IEnumerable<Tag> tags, CancellationToken cancellationToken = default)
        {
            var response = new AssumeRoleResponse();
            response.Credentials = new Credentials();
            response.Credentials.SessionToken = "session token";
            response.Credentials.SecretAccessKey = "secrte access key";
            response.Credentials.AccessKeyId = "12345678901234567890";
            return Task.FromResult(response);
        }
    }
}

