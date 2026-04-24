using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using FishTrackerLambda.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace FishTrackerLambda.Tests
{
    public class SesShareEmailerTests
    {
        [Fact]
        public async Task Sends_WithExpectedTemplateAndData()
        {
            var ses = new Mock<IAmazonSimpleEmailServiceV2>();
            SendEmailRequest? captured = null;
            ses.Setup(s => s.SendEmailAsync(It.IsAny<SendEmailRequest>(), It.IsAny<CancellationToken>()))
               .Callback<SendEmailRequest, CancellationToken>((r, _) => captured = r)
               .ReturnsAsync(new SendEmailResponse());

            var sut = new SesShareEmailer(ses.Object, "noreply@example.com",
                "FishTracker-ShareInvite-Test", NullLogger<SesShareEmailer>.Instance);

            await sut.SendAsync(new ShareEmailContext(
                ShareId: "s1",
                OwnerDisplayName: "Dean",
                RecipientEmail: "bob@example.com",
                TripCount: 2,
                CatchCount: 5,
                Message: "nice day",
                ThumbnailUrl: "https://x/y.png",
                ViewUrl: "https://x/shared/s1",
                ExpiresAt: new DateTimeOffset(2026, 5, 25, 0, 0, 0, TimeSpan.Zero)),
                CancellationToken.None);

            Assert.NotNull(captured);
            Assert.Equal("FishTracker-ShareInvite-Test", captured!.Content.Template.TemplateName);
            Assert.Contains("Dean",          captured.Content.Template.TemplateData);
            Assert.Contains("bob@example.com", captured.Destination.ToAddresses);
            Assert.Contains("2026-05-25",    captured.Content.Template.TemplateData);
        }
    }
}
