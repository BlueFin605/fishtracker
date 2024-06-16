using Amazon.SecurityToken;
using Amazon.SecurityToken.Model;

namespace FishTracker.AWSProxy
{
    class AmazonSecurityTokenServiceClient_AWS : IAmazonSecurityTokenServiceClientProxy
    {
        private readonly ILogger<AmazonSecurityTokenServiceClient_AWS> m_logger;
        private AmazonSecurityTokenServiceClient m_stsClient;

        public AmazonSecurityTokenServiceClient_AWS(ILogger<AmazonSecurityTokenServiceClient_AWS> logger)
        {
            m_stsClient = new AmazonSecurityTokenServiceClient();
            m_logger = logger;
        }

        public Task<AssumeRoleResponse> AssumeRoleAsync(IEnumerable<Tag> tags, CancellationToken cancellationToken = default)
        {
            m_logger.LogInformation("Got STS Client");
            var role = new AssumeRoleRequest();
            role.RoleArn = "arn:aws:iam::083148603667:role/gradientsofagreement-user-access-role-prod";
            role.RoleSessionName = "GradientsOfAgreement";
            role.Tags.AddRange(tags);
            return m_stsClient.AssumeRoleAsync(role);
        }
    }
}

