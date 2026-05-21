import { injectable } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { FishSize, ILocation } from '../Models/lambda';
import { SecretsCache } from '../Helpers/SecretsCache';

export class StaticMapError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StaticMapError';
    }
}

export interface IStaticMapCatch {
    location: ILocation;
    size: FishSize | undefined;
    catchId: string;
}

/**
 * Ported from .NET GoogleStaticMapRenderer.
 *
 * Builds a Google Static Maps URL for up to 20 catches (evenly sampled when
 * more are supplied), then fetches the PNG via Node 22's global fetch.
 */
@injectable()
export class StaticMapRenderer {
    private static readonly MaxMarkers = 20;
    private static readonly MaxUrlLength = 16_384;
    private static readonly Endpoint = 'https://maps.googleapis.com/maps/api/staticmap';

    private static readonly ColorByFishSize: Record<string, string> = {
        Undersize: 'gray',
        Small: 'blue',
        Medium: 'green',
        Large: 'orange',
        VeryLarge: 'red',
    };

    constructor(private secrets: SecretsCache, private logger: Logger) {}

    public async render(catches: readonly IStaticMapCatch[]): Promise<Uint8Array> {
        if (catches.length === 0) {
            throw new StaticMapError('No catches to render');
        }

        const sampled = StaticMapRenderer.sampleEvenly(catches, StaticMapRenderer.MaxMarkers);
        const apiKey = await this.secrets.getStaticMapsKey();
        const url = StaticMapRenderer.buildUrl(sampled, apiKey);

        if (url.length >= StaticMapRenderer.MaxUrlLength) {
            throw new StaticMapError(`Static-map URL too long: ${url.length} chars`);
        }

        this.logger.info('Rendering static map', {
            markers: sampled.length,
            urlLength: url.length,
        });

        const resp = await fetch(url);
        if (!resp.ok) {
            this.logger.warn('Static map HTTP non-2xx', { status: resp.status });
            throw new StaticMapError(`Static map HTTP ${resp.status}`);
        }

        const buf = await resp.arrayBuffer();
        return new Uint8Array(buf);
    }

    private static sampleEvenly(
        source: readonly IStaticMapCatch[],
        cap: number
    ): IStaticMapCatch[] {
        if (source.length <= cap) return source.slice();
        const step = source.length / cap;
        const picks: IStaticMapCatch[] = new Array(cap);
        for (let i = 0; i < cap; i++) {
            picks[i] = source[Math.floor(i * step)];
        }
        return picks;
    }

    private static buildUrl(catches: readonly IStaticMapCatch[], apiKey: string): string {
        let url = `${StaticMapRenderer.Endpoint}?size=600x300&maptype=terrain`;
        for (const c of catches) {
            const sizeName =
                c.size !== undefined ? (FishSize[c.size] as string | undefined) : undefined;
            const color = (sizeName && StaticMapRenderer.ColorByFishSize[sizeName]) || 'gray';
            url += `&markers=color:${color}|${c.location.latitude.toFixed(6)},${c.location.longitude.toFixed(6)}`;
        }
        url += `&key=${encodeURIComponent(apiKey)}`;
        return url;
    }
}
