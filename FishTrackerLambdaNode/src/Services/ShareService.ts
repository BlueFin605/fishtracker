import { injectable } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { ShareDbService } from '../Db.Services/ShareDbService';
import { TripDbService } from '../Db.Services/TripDbService';
import { CatchDbService } from '../Db.Services/CatchDbService';
import { IdGenerator } from '../Helpers/IdGenerator';
import { LocationFuzzer } from '../Helpers/LocationFuzzer';
import { StaticMapRenderer, IStaticMapCatch } from './StaticMapRenderer';
import { ThumbnailStorage } from './ThumbnailStorage';
import { ShareEmailer } from './ShareEmailer';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { Results } from '../Http/Result';
import { EnumToString } from '../Http/serialisation';
import {
    ICreateShareResponse,
    IDynamoDbShare,
    IFrozenCatch,
    IFrozenCatchDto,
    IFrozenTrip,
    IFrozenTripDto,
    INewShare,
    IShareDetails,
    IShareSummary,
    FishSize,
    TripRating,
    ILocation,
    IBiteTimesDetails,
    ITripTags,
} from '../Models/lambda';

interface IOwnedCatch {
    CatchId: string;
    SpeciesId: string;
    CaughtLocation: ILocation;
    CaughtWhen: string;
    CaughtSize: FishSize | undefined;
    CaughtLength: number;
    BiteInfo?: IBiteTimesDetails;
}

interface IOwnedTrip {
    TripId: string;
    StartTime: string;
    EndTime?: string;
    Notes: string;
    Rating: TripRating;
    Tags: ITripTags[];
    Species: string[];
    DefaultSpecies: string;
    Catches: IOwnedCatch[];
}

/**
 * Ported from .NET ShareService.
 *
 * Loads owner-owned trips directly via TripDbService + CatchDbService (no
 * ITripLookup abstraction in TS), freezes a snapshot into DynamoDB, then
 * best-effort renders a Google Static Maps thumbnail and sends the SES
 * invite email. Thumbnail/email failures never fail the share.
 */
@injectable()
export class ShareService {
    private static readonly MaxTripsPerShare = 50;
    private static readonly MaxActiveSharesPerOwner = 100;
    private static readonly EmailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    private readonly viewUrlBase: string;

    constructor(
        private shares: ShareDbService,
        private tripDbService: TripDbService,
        private catchDbService: CatchDbService,
        private fuzzer: LocationFuzzer,
        private renderer: StaticMapRenderer,
        private thumbs: ThumbnailStorage,
        private emailer: ShareEmailer,
        private logger: Logger
    ) {
        this.viewUrlBase = process.env.SHARE_VIEW_URL_BASE ?? '';
    }

    public async newShare(
        ownerSubject: string,
        ownerDisplayName: string,
        req: INewShare
    ): Promise<HttpWrapper<ICreateShareResponse>> {
        if (!req.tripIds || req.tripIds.length === 0) {
            return HttpWrapper.FromResult(Results.BadRequest());
        }

        if (req.tripIds.length > ShareService.MaxTripsPerShare) {
            return HttpWrapper.FromResult(Results.PayloadTooLarge());
        }

        const recipient = (req.recipientEmail ?? '').trim().toLowerCase();
        if (!ShareService.EmailRegex.test(recipient)) {
            return HttpWrapper.FromResult(Results.BadRequest());
        }

        const distinctTripIds = Array.from(new Set(req.tripIds));
        const owned = await this.getOwnedTrips(ownerSubject, distinctTripIds);
        if (owned.length !== distinctTripIds.length) {
            this.logger.warn('NewShare: caller attempted to share non-owned trips', {
                ownerSubject,
            });
            return HttpWrapper.FromResult(Results.Forbidden());
        }

        const activeShares = await this.shares.listByOwner(ownerSubject);
        const activeCount = activeShares.filter(s => !s.RevokedAt).length;
        if (activeCount >= ShareService.MaxActiveSharesPerOwner) {
            return HttpWrapper.FromResult(Results.TooManyRequests());
        }

        const shareId = IdGenerator.generateUUID();
        const now = new Date();
        const expiresAt =
            req.expiresInDays !== undefined && req.expiresInDays !== null
                ? new Date(now.getTime() + req.expiresInDays * 86_400_000).toISOString()
                : undefined;

        const frozenTrips: IFrozenTrip[] = owned.map(t => ({
            TripId: t.TripId,
            StartTime: t.StartTime,
            EndTime: t.EndTime && t.EndTime.length > 0 ? t.EndTime : undefined,
            Notes: t.Notes ?? '',
            Rating: t.Rating,
            Tags: t.Tags ?? [],
            Species: t.Species ?? [],
            DefaultSpecies: t.DefaultSpecies ?? '',
            Catches: t.Catches.map<IFrozenCatch>(c => ({
                CatchId: c.CatchId,
                SpeciesId: c.SpeciesId,
                DisplayLocation: req.fuzzLocation
                    ? this.fuzzer.fuzz(c.CaughtLocation, shareId, c.CatchId)
                    : c.CaughtLocation,
                CaughtWhen: c.CaughtWhen,
                CaughtSize: c.CaughtSize,
                CaughtLength: c.CaughtLength,
                BiteInfo: c.BiteInfo,
            })),
        }));

        const messageTrimmed = req.message?.trim();
        let share: IDynamoDbShare = {
            OwnerSubject: ownerSubject,
            ShareId: shareId,
            OwnerDisplayName: ownerDisplayName,
            RecipientEmail: recipient,
            CreatedAt: now.toISOString(),
            ExpiresAt: expiresAt,
            FuzzLocation: req.fuzzLocation,
            Message: messageTrimmed && messageTrimmed.length > 0 ? messageTrimmed : undefined,
            Trips: frozenTrips,
            ViewCount: 0,
        };

        share = await this.shares.save(share);

        const thumbnailGenerated = await this.tryRenderThumbnail(share, frozenTrips);
        // Re-read the share in memory so tryRenderThumbnail's Update doesn't clobber
        // our sender-side view of ThumbnailS3Key for TrySendEmail.
        const emailSent = await this.trySendEmail(share, frozenTrips);

        return HttpWrapper.Ok<ICreateShareResponse>({
            shareId,
            emailSent,
            thumbnailGenerated,
        });
    }

    public async getShares(
        subject: string,
        verifiedEmail: string,
        direction: string | undefined
    ): Promise<HttpWrapper<IShareSummary[]>> {
        let rows: IDynamoDbShare[];
        const dir = direction ?? '';
        switch (dir) {
            case 'outbox':
            case '':
                rows = await this.shares.listByOwner(subject);
                break;
            case 'inbox': {
                const byRecipient = await this.shares.listByRecipientEmail(
                    (verifiedEmail ?? '').toLowerCase()
                );
                rows = byRecipient.filter(
                    s =>
                        s.RecipientSubject === subject ||
                        (!s.RecipientSubject && !!verifiedEmail)
                );
                break;
            }
            default:
                return HttpWrapper.FromResult(Results.BadRequest());
        }

        return HttpWrapper.Ok(rows.map(s => ShareService.toSummary(s)));
    }

    public async getShare(
        subject: string,
        verifiedEmail: string,
        emailVerified: boolean,
        shareId: string
    ): Promise<HttpWrapper<IShareDetails>> {
        const share = await this.shares.getByShareId(shareId);
        if (!share) {
            return HttpWrapper.FromResult(Results.NotFound());
        }

        if (share.RevokedAt && share.RevokedAt.length > 0) {
            return HttpWrapper.FromResult(Results.Gone());
        }

        if (
            share.ExpiresAt &&
            share.ExpiresAt.length > 0 &&
            Date.parse(share.ExpiresAt) < Date.now()
        ) {
            return HttpWrapper.FromResult(Results.Gone());
        }

        const isOwner = share.OwnerSubject === subject;
        const isClaimedRecipient = share.RecipientSubject === subject;
        const canAutoClaim =
            !share.RecipientSubject &&
            emailVerified &&
            !!verifiedEmail &&
            share.RecipientEmail.toLowerCase() === verifiedEmail.trim().toLowerCase();

        if (!isOwner && !isClaimedRecipient && !canAutoClaim) {
            // Return 404 to avoid leaking share existence.
            return HttpWrapper.FromResult(Results.NotFound());
        }

        let current = share;
        if (!isOwner) {
            if (canAutoClaim) {
                current.RecipientSubject = subject;
                current.ClaimedAt = new Date().toISOString();
            }
            current.ViewCount = (current.ViewCount ?? 0) + 1;
            current.LastViewedAt = new Date().toISOString();
            current.LastViewedBySubject = subject;
            current = await this.shares.update(current);
        }

        return HttpWrapper.Ok<IShareDetails>({
            shareId: current.ShareId,
            ownerDisplayName: current.OwnerDisplayName,
            createdAt: current.CreatedAt,
            expiresAt:
                current.ExpiresAt && current.ExpiresAt.length > 0 ? current.ExpiresAt : undefined,
            fuzzLocation: current.FuzzLocation,
            message: current.Message,
            trips: (current.Trips ?? []).map(t => ShareService.toFrozenTripDto(t)),
        });
    }

    public async revokeShare(
        ownerSubject: string,
        shareId: string
    ): Promise<HttpWrapper<{}>> {
        const share = await this.shares.getByOwner(ownerSubject, shareId);
        if (!share) {
            return HttpWrapper.FromResult(Results.NotFound());
        }

        if (share.ThumbnailS3Key && share.ThumbnailS3Key.length > 0) {
            try {
                await this.thumbs.delete(share.ThumbnailS3Key);
            } catch (err) {
                this.logger.warn('Thumbnail delete failed', {
                    shareId: share.ShareId,
                    error: (err as Error).message,
                });
            }
        }

        share.RevokedAt = new Date().toISOString();
        await this.shares.update(share);

        return HttpWrapper.Ok({});
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private async getOwnedTrips(
        ownerSubject: string,
        tripIds: string[]
    ): Promise<IOwnedTrip[]> {
        const owned: IOwnedTrip[] = [];
        for (const tripId of tripIds) {
            const tripWrap = await this.tripDbService.readRecordWithSortKey(
                ownerSubject,
                tripId
            );
            if (!tripWrap.continue || !tripWrap.value) continue;
            const trip = tripWrap.value;

            const tripKey = IdGenerator.generateTripKey(ownerSubject, tripId);
            const catchesWrap = await this.catchDbService.readAllRecordsForPartition(tripKey);
            const catches = catchesWrap.continue && catchesWrap.value ? catchesWrap.value : [];

            owned.push({
                TripId: trip.TripId,
                StartTime: trip.StartTime,
                EndTime: trip.EndTime,
                Notes: trip.Notes ?? '',
                Rating: trip.Rating,
                Tags: trip.Tags ?? [],
                Species: trip.Species ?? [],
                DefaultSpecies: trip.DefaultSpecies ?? '',
                Catches: catches.map<IOwnedCatch>(c => ({
                    CatchId: c.CatchId,
                    SpeciesId: c.SpeciesId,
                    CaughtLocation: c.CaughtLocation,
                    CaughtWhen: c.CaughtWhen,
                    CaughtSize: c.CaughtSize,
                    CaughtLength: c.CaughtLength,
                    BiteInfo: c.BiteInfo,
                })),
            });
        }
        return owned;
    }

    private static toSummary(s: IDynamoDbShare): IShareSummary {
        return {
            shareId: s.ShareId,
            ownerDisplayName: s.OwnerDisplayName,
            recipientEmail: s.RecipientEmail,
            createdAt: s.CreatedAt,
            expiresAt: s.ExpiresAt && s.ExpiresAt.length > 0 ? s.ExpiresAt : undefined,
            revokedAt: s.RevokedAt && s.RevokedAt.length > 0 ? s.RevokedAt : undefined,
            tripCount: s.Trips?.length ?? 0,
            catchCount: (s.Trips ?? []).reduce((sum, t) => sum + (t.Catches?.length ?? 0), 0),
            viewCount: s.ViewCount ?? 0,
            lastViewedAt:
                s.LastViewedAt && s.LastViewedAt.length > 0 ? s.LastViewedAt : undefined,
        };
    }

    private static toFrozenTripDto(t: IFrozenTrip): IFrozenTripDto {
        return {
            tripId: t.TripId,
            startTime: t.StartTime,
            endTime: t.EndTime && t.EndTime.length > 0 ? t.EndTime : undefined,
            notes: t.Notes ?? '',
            rating: EnumToString(TripRating, t.Rating) ?? 'NonRated',
            tags: t.Tags ?? [],
            species: t.Species ?? [],
            defaultSpecies: t.DefaultSpecies ?? '',
            catches: (t.Catches ?? []).map(c => ShareService.toFrozenCatchDto(c)),
        };
    }

    private static toFrozenCatchDto(c: IFrozenCatch): IFrozenCatchDto {
        return {
            catchId: c.CatchId,
            speciesId: c.SpeciesId,
            displayLocation: c.DisplayLocation,
            caughtWhen: c.CaughtWhen,
            caughtSize: EnumToString(FishSize, c.CaughtSize) ?? 'Undersize',
            caughtLength: c.CaughtLength,
            biteInfo: c.BiteInfo,
        };
    }

    private async tryRenderThumbnail(
        share: IDynamoDbShare,
        trips: IFrozenTrip[]
    ): Promise<boolean> {
        try {
            const flat: IStaticMapCatch[] = trips.flatMap(t =>
                (t.Catches ?? []).map(c => ({
                    location: c.DisplayLocation,
                    size: c.CaughtSize,
                    catchId: c.CatchId,
                }))
            );
            if (flat.length === 0) return false;

            const png = await this.renderer.render(flat);
            const key = await this.thumbs.put(share.ShareId, png);

            share.ThumbnailS3Key = key;
            await this.shares.update(share);
            return true;
        } catch (err) {
            this.logger.warn('Thumbnail render/upload failed', {
                shareId: share.ShareId,
                error: (err as Error).message,
            });
            return false;
        }
    }

    private async trySendEmail(
        share: IDynamoDbShare,
        trips: IFrozenTrip[]
    ): Promise<boolean> {
        try {
            const catchCount = trips.reduce((n, t) => n + (t.Catches?.length ?? 0), 0);
            await this.emailer.send({
                shareId: share.ShareId,
                ownerDisplayName: share.OwnerDisplayName,
                recipientEmail: share.RecipientEmail,
                tripCount: trips.length,
                catchCount,
                message: share.Message,
                thumbnailUrl:
                    share.ThumbnailS3Key && share.ThumbnailS3Key.length > 0
                        ? this.thumbs.publicUrl(share.ThumbnailS3Key)
                        : undefined,
                viewUrl: `${this.viewUrlBase}/${share.ShareId}`,
                expiresAt:
                    share.ExpiresAt && share.ExpiresAt.length > 0 ? share.ExpiresAt : undefined,
            });
            return true;
        } catch (err) {
            this.logger.warn('Share email failed', {
                shareId: share.ShareId,
                error: (err as Error).message,
            });
            return false;
        }
    }
}
