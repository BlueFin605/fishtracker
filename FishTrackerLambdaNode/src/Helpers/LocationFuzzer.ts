import { injectable } from 'tsyringe';
import { createHmac } from 'node:crypto';
import { ILocation } from '../Models/lambda';

/**
 * Ported from .NET LocationFuzzer.
 *
 * Uses HMAC-SHA256(shareId, catchId) as a deterministic seed so that a given
 * (share, catch) pair always produces the same fuzzed point, then samples a
 * uniform disk of radius 200m via a Mulberry32 PRNG seeded with the first 4
 * bytes of the digest (matching System.Random(int) behaviour in spirit -- the
 * goal is determinism, not cryptographic quality).
 */
@injectable()
export class LocationFuzzer {
    private static readonly MaxRadiusMetres = 200.0;
    private static readonly MetresPerLatDegree = 111_320.0;

    public fuzz(original: ILocation, shareId: string, catchId: string): ILocation {
        const digest = createHmac('sha256', shareId).update(catchId).digest();
        // Interpret first 4 bytes as a little-endian int32 (matches BitConverter.ToInt32 on x86/x64).
        const seed = digest.readInt32LE(0);

        const rng = LocationFuzzer.mulberry32(seed);

        const angle = rng() * 2 * Math.PI;
        const radius = Math.sqrt(rng()) * LocationFuzzer.MaxRadiusMetres;

        const latRad = (original.latitude * Math.PI) / 180;
        const cosLat = Math.cos(latRad);
        const safeCosLat = Math.max(Math.abs(cosLat), 1e-6);

        const latOffset = (radius * Math.cos(angle)) / LocationFuzzer.MetresPerLatDegree;
        const lngOffset = (radius * Math.sin(angle)) / (LocationFuzzer.MetresPerLatDegree * safeCosLat);

        return {
            latitude: original.latitude + latOffset,
            longitude: original.longitude + lngOffset,
        };
    }

    private static mulberry32(seed: number): () => number {
        // Coerce to unsigned 32-bit.
        let t = seed >>> 0;
        return function next(): number {
            t = (t + 0x6d2b79f5) >>> 0;
            let r = t;
            r = Math.imul(r ^ (r >>> 15), r | 1);
            r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }
}
