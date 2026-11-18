import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'reflect-metadata';
import { IdentityAliasService } from '../src/Services/IdentityAliasService';

describe('IdentityAliasService.resolveSubject', () => {
    const send = vi.fn();
    const helper = { docClient: { send } } as any;

    beforeEach(() => {
        send.mockReset();
        process.env.IDENTITY_ALIAS_TABLE = 'FishTracker-IdentityAlias-Test';
    });

    it('returns LegacySubject when an alias exists', async () => {
        send.mockResolvedValue({ Item: { Subject: { S: 'new-sub' }, LegacySubject: { S: 'legacy-sub' } } });
        const svc = new IdentityAliasService(helper);
        expect(await svc.resolveSubject('new-sub')).toBe('legacy-sub');
        expect(send.mock.calls[0][0].input).toEqual({ TableName: 'FishTracker-IdentityAlias-Test', Key: { Subject: { S: 'new-sub' } } });
    });

    it('returns the sub when no alias exists', async () => {
        send.mockResolvedValue({});
        const svc = new IdentityAliasService(helper);
        expect(await svc.resolveSubject('new-sub')).toBe('new-sub');
    });

    it('serves repeat lookups (hits and misses) from cache', async () => {
        send.mockResolvedValueOnce({ Item: { LegacySubject: { S: 'legacy' } } }).mockResolvedValueOnce({});
        const svc = new IdentityAliasService(helper);
        expect(await svc.resolveSubject('a')).toBe('legacy');
        expect(await svc.resolveSubject('a')).toBe('legacy');
        expect(await svc.resolveSubject('b')).toBe('b');
        expect(await svc.resolveSubject('b')).toBe('b');
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('returns the sub without a lookup when the table is not configured', async () => {
        delete process.env.IDENTITY_ALIAS_TABLE;
        const svc = new IdentityAliasService(helper);
        expect(await svc.resolveSubject('x')).toBe('x');
        expect(send).not.toHaveBeenCalled();
    });
});
