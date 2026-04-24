using System.Text.RegularExpressions;
using Amazon.DynamoDBv2;
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
        private readonly IAmazonDynamoDB _ddb;
        private readonly ILocationFuzzer _fuzzer;
        private readonly IStaticMapRenderer _renderer;
        private readonly IThumbnailStorage _thumbs;
        private readonly IShareEmailer _emailer;
        private readonly ITripLookup _tripLookup;
        private readonly string _viewUrlBase;
        private readonly string _sharesTableName;

        public ShareService(
            ILogger<ShareService> log,
            IAmazonDynamoDB ddb,
            ILocationFuzzer fuzzer,
            IStaticMapRenderer renderer,
            IThumbnailStorage thumbs,
            IShareEmailer emailer,
            ITripLookup tripLookup,
            string viewUrlBase,
            string sharesTableName)
        {
            _log = log;
            _ddb = ddb;
            _fuzzer = fuzzer;
            _renderer = renderer;
            _thumbs = thumbs;
            _emailer = emailer;
            _tripLookup = tripLookup;
            _viewUrlBase = viewUrlBase;
            _sharesTableName = sharesTableName;
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

            var activeWrap = await ShareDbTable.ReadSharesByOwner(ownerSubject, _ddb, _log);
            if (activeWrap.Result.StatusCode == 200
                && (activeWrap.Value?.Count(s => s.RevokedAt == null) ?? 0) >= MaxActiveSharesPerOwner)
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

            var saveWrap = await share.WriteShareToDynamoDb(_ddb, _log);
            if (saveWrap.Result.StatusCode != 200)
                return HttpWrapper<CreateShareResponse>.FromResult(Results.StatusCodeResult(saveWrap.Result.StatusCode));

            var thumbnailGenerated = await TryRenderThumbnail(share, frozenTrips);
            var emailSent = await TrySendEmail(share, frozenTrips);

            return HttpWrapper<CreateShareResponse>.Ok(
                new CreateShareResponse(shareId, emailSent, thumbnailGenerated));
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
                await share.UpdateShareInDynamoDb(_ddb, _log);
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
