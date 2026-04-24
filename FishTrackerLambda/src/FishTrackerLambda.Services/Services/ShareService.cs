using System.Text.RegularExpressions;
using FishTrackerLambda.DataAccess;
using FishTrackerLambda.Functional;
using FishTrackerLambda.Models.Lambda;
using FishTrackerLambda.Models.Persistance;
using FishTrackerLambda.Services.Http;
using Microsoft.Extensions.Logging;

namespace FishTrackerLambda.Services
{
    public partial class ShareService : IShareService
    {
        private const int MaxTripsPerShare = 50;
        private const int MaxActiveSharesPerOwner = 100;

        private static readonly Regex EmailRegex = new Regex(
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

        private readonly ILogger<ShareService> _log;
        private readonly IShareRepository _shares;
        private readonly ILocationFuzzer _fuzzer;
        private readonly IStaticMapRenderer _renderer;
        private readonly IThumbnailStorage _thumbs;
        private readonly IShareEmailer _emailer;
        private readonly ITripLookup _tripLookup;
        private readonly string _viewUrlBase;

        public ShareService(
            ILogger<ShareService> log,
            IShareRepository shares,
            ILocationFuzzer fuzzer,
            IStaticMapRenderer renderer,
            IThumbnailStorage thumbs,
            IShareEmailer emailer,
            ITripLookup tripLookup,
            string viewUrlBase)
        {
            _log = log;
            _shares = shares;
            _fuzzer = fuzzer;
            _renderer = renderer;
            _thumbs = thumbs;
            _emailer = emailer;
            _tripLookup = tripLookup;
            _viewUrlBase = viewUrlBase;
        }

        public async Task<HttpWrapper<CreateShareResponse>> NewShare(
            string ownerSubject, string ownerDisplayName, NewShare req)
        {
            if (req.TripIds is null || req.TripIds.Length == 0)
                return HttpWrapper<CreateShareResponse>.FromResult(Results.BadRequest());

            if (req.TripIds.Length > MaxTripsPerShare)
                return HttpWrapper<CreateShareResponse>.FromResult(Results.PayloadTooLarge());

            var recipient = (req.RecipientEmail ?? "").Trim().ToLowerInvariant();
            if (!EmailRegex.IsMatch(recipient))
                return HttpWrapper<CreateShareResponse>.FromResult(Results.BadRequest());

            var owned = await _tripLookup.GetOwnedTrips(ownerSubject, req.TripIds);
            if (owned.Count != req.TripIds.Distinct().Count())
            {
                _log.LogWarning("NewShare: caller {Subject} attempted to share non-owned trips", ownerSubject);
                return HttpWrapper<CreateShareResponse>.FromResult(Results.Forbidden());
            }

            var activeShares = await _shares.ListByOwner(ownerSubject);
            if (activeShares.Count(s => s.RevokedAt == null) >= MaxActiveSharesPerOwner)
                return HttpWrapper<CreateShareResponse>.FromResult(Results.TooManyRequests());

            var shareId = Guid.NewGuid().ToString();
            var now = DateTimeOffset.UtcNow;
            var expiresAt = req.ExpiresInDays.HasValue
                ? now.AddDays(req.ExpiresInDays.Value).ToString("o")
                : null;

            var frozenTrips = owned.Select(t => new FrozenTrip
            {
                TripId = t.TripId,
                StartTime = t.StartTime.ToString("o"),
                EndTime = t.EndTime?.ToString("o"),
                Notes = t.Notes,
                Rating = t.Rating,
                Tags = t.Tags,
                Species = t.Species,
                DefaultSpecies = t.DefaultSpecies,
                Catches = t.Catches.Select(c => new FrozenCatch
                {
                    CatchId = c.CatchId,
                    SpeciesId = c.SpeciesId,
                    DisplayLocation = req.FuzzLocation
                        ? _fuzzer.Fuzz(c.CaughtLocation, shareId, c.CatchId)
                        : c.CaughtLocation,
                    CaughtWhen = c.CaughtWhen.ToString("o"),
                    CaughtSize = c.CaughtSize,
                    CaughtLength = c.CaughtLength,
                    Weather = c.Weather
                }).ToList()
            }).ToList();

            var share = new DynamoDbShare
            {
                OwnerSubject = ownerSubject,
                ShareId = shareId,
                OwnerDisplayName = ownerDisplayName,
                RecipientEmail = recipient,
                CreatedAt = now.ToString("o"),
                ExpiresAt = expiresAt,
                FuzzLocation = req.FuzzLocation,
                Message = string.IsNullOrWhiteSpace(req.Message) ? null : req.Message!.Trim(),
                Trips = frozenTrips,
                ViewCount = 0
            };

            share = await _shares.Save(share);

            var thumbnailGenerated = await TryRenderThumbnail(share, frozenTrips);
            var emailSent = await TrySendEmail(share, frozenTrips);

            return HttpWrapper<CreateShareResponse>.Ok(
                new CreateShareResponse(shareId, emailSent, thumbnailGenerated));
        }

        public async Task<HttpWrapper<IEnumerable<ShareSummary>>> GetShares(
            string subject, string verifiedEmail, string direction)
        {
            List<DynamoDbShare> rows;
            switch (direction)
            {
                case "outbox":
                case null:
                case "":
                    rows = await _shares.ListByOwner(subject);
                    break;
                case "inbox":
                    var byRecipient = await _shares.ListByRecipientEmail((verifiedEmail ?? "").ToLowerInvariant());
                    rows = byRecipient
                        .Where(s => s.RecipientSubject == subject
                                 || (s.RecipientSubject == null && !string.IsNullOrEmpty(verifiedEmail)))
                        .ToList();
                    break;
                default:
                    return HttpWrapper<IEnumerable<ShareSummary>>.FromResult(Results.BadRequest());
            }

            var summaries = rows.Select(ToSummary).ToList();
            return HttpWrapper<IEnumerable<ShareSummary>>.Ok(summaries);
        }

        public async Task<HttpWrapper<ShareDetails>> GetShare(
            string subject, string verifiedEmail, bool emailVerified, string shareId)
        {
            var share = await _shares.GetByShareId(shareId);
            if (share is null)
                return HttpWrapper<ShareDetails>.FromResult(Results.NotFound());

            if (!string.IsNullOrEmpty(share.RevokedAt))
                return HttpWrapper<ShareDetails>.FromResult(Results.Gone());

            if (!string.IsNullOrEmpty(share.ExpiresAt)
                && DateTimeOffset.Parse(share.ExpiresAt) < DateTimeOffset.UtcNow)
                return HttpWrapper<ShareDetails>.FromResult(Results.Gone());

            var isOwner = share.OwnerSubject == subject;
            var isClaimedRecipient = share.RecipientSubject == subject;
            var canAutoClaim = share.RecipientSubject is null
                && emailVerified
                && !string.IsNullOrEmpty(verifiedEmail)
                && share.RecipientEmail.Equals(verifiedEmail.Trim(), StringComparison.OrdinalIgnoreCase);

            if (!isOwner && !isClaimedRecipient && !canAutoClaim)
                return HttpWrapper<ShareDetails>.FromResult(Results.NotFound());

            if (!isOwner)
            {
                if (canAutoClaim)
                {
                    share.RecipientSubject = subject;
                    share.ClaimedAt = DateTimeOffset.UtcNow.ToString("o");
                }
                share.ViewCount++;
                share.LastViewedAt = DateTimeOffset.UtcNow.ToString("o");
                share.LastViewedBySubject = subject;
                share = await _shares.Update(share);
            }

            return HttpWrapper<ShareDetails>.Ok(new ShareDetails(
                ShareId: share.ShareId,
                OwnerDisplayName: share.OwnerDisplayName,
                CreatedAt: DateTimeOffset.Parse(share.CreatedAt),
                ExpiresAt: string.IsNullOrEmpty(share.ExpiresAt) ? null : DateTimeOffset.Parse(share.ExpiresAt),
                FuzzLocation: share.FuzzLocation,
                Message: share.Message,
                Trips: share.Trips.Select(t => t.ToDto()).ToList()));
        }

        private static ShareSummary ToSummary(DynamoDbShare s) => new ShareSummary(
            ShareId: s.ShareId,
            OwnerDisplayName: s.OwnerDisplayName,
            RecipientEmail: s.RecipientEmail,
            CreatedAt: DateTimeOffset.Parse(s.CreatedAt),
            ExpiresAt: string.IsNullOrEmpty(s.ExpiresAt) ? null : DateTimeOffset.Parse(s.ExpiresAt),
            RevokedAt: string.IsNullOrEmpty(s.RevokedAt) ? null : DateTimeOffset.Parse(s.RevokedAt),
            TripCount: s.Trips.Count,
            CatchCount: s.Trips.Sum(t => t.Catches.Count),
            ViewCount: s.ViewCount,
            LastViewedAt: string.IsNullOrEmpty(s.LastViewedAt) ? null : DateTimeOffset.Parse(s.LastViewedAt));

        public async Task<HttpWrapper<Unit>> RevokeShare(string ownerSubject, string shareId)
        {
            var share = await _shares.GetByOwner(ownerSubject, shareId);
            if (share is null)
                return HttpWrapper<Unit>.FromResult(Results.NotFound());

            if (!string.IsNullOrEmpty(share.ThumbnailS3Key))
            {
                try { await _thumbs.DeleteAsync(share.ThumbnailS3Key, CancellationToken.None); }
                catch (Exception ex) { _log.LogWarning(ex, "Thumbnail delete failed for {ShareId}", share.ShareId); }
            }

            share.RevokedAt = DateTimeOffset.UtcNow.ToString("o");
            await _shares.Update(share);

            return HttpWrapper<Unit>.Ok(Unit.Value);
        }

        private async Task<bool> TryRenderThumbnail(DynamoDbShare share, List<FrozenTrip> trips)
        {
            try
            {
                var flat = trips.SelectMany(t => t.Catches
                    .Select(c => (c.DisplayLocation, c.CaughtSize, c.CatchId)))
                    .ToList();
                if (flat.Count == 0) return false;

                var png = await _renderer.RenderAsync(flat, CancellationToken.None);
                var key = await _thumbs.PutAsync(share.ShareId, png, CancellationToken.None);

                share.ThumbnailS3Key = key;
                await _shares.Update(share);
                return true;
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Thumbnail render/upload failed for {ShareId}", share.ShareId);
                return false;
            }
        }

        private async Task<bool> TrySendEmail(DynamoDbShare share, List<FrozenTrip> trips)
        {
            try
            {
                var ctx = new ShareEmailContext(
                    ShareId: share.ShareId,
                    OwnerDisplayName: share.OwnerDisplayName,
                    RecipientEmail: share.RecipientEmail,
                    TripCount: trips.Count,
                    CatchCount: trips.Sum(t => t.Catches.Count),
                    Message: share.Message,
                    ThumbnailUrl: string.IsNullOrEmpty(share.ThumbnailS3Key) ? null : _thumbs.PublicUrl(share.ThumbnailS3Key),
                    ViewUrl: $"{_viewUrlBase}/{share.ShareId}",
                    ExpiresAt: string.IsNullOrEmpty(share.ExpiresAt) ? null : DateTimeOffset.Parse(share.ExpiresAt));

                await _emailer.SendAsync(ctx, CancellationToken.None);
                return true;
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Share email failed for {ShareId}", share.ShareId);
                return false;
            }
        }
    }
}
