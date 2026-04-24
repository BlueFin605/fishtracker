using System.Text.Json;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public class SesShareEmailer : IShareEmailer
    {
        private readonly IAmazonSimpleEmailServiceV2 _ses;
        private readonly string _sender;
        private readonly string _templateName;
        private readonly ILogger<SesShareEmailer> _log;

        public SesShareEmailer(
            IAmazonSimpleEmailServiceV2 ses,
            string sender,
            string templateName,
            ILogger<SesShareEmailer> log)
        {
            _ses = ses;
            _sender = sender;
            _templateName = templateName;
            _log = log;
        }

        public async Task SendAsync(ShareEmailContext ctx, CancellationToken ct)
        {
            var data = JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["ownerDisplayName"] = ctx.OwnerDisplayName,
                ["tripCount"]        = ctx.TripCount,
                ["catchCount"]       = ctx.CatchCount,
                ["message"]          = ctx.Message,
                ["thumbnailUrl"]     = ctx.ThumbnailUrl,
                ["viewUrl"]          = ctx.ViewUrl,
                ["expiresAt"]        = ctx.ExpiresAt?.ToString("yyyy-MM-dd")
            });

            var req = new SendEmailRequest
            {
                FromEmailAddress = _sender,
                Destination = new Destination { ToAddresses = new List<string> { ctx.RecipientEmail } },
                Content = new EmailContent
                {
                    Template = new Template
                    {
                        TemplateName = _templateName,
                        TemplateData = data
                    }
                }
            };

            await _ses.SendEmailAsync(req, ct);
            _log.LogInformation("Share invite emailed for {ShareId} (template {Template})",
                ctx.ShareId, _templateName);
        }
    }
}
