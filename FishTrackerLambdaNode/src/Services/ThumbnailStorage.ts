import { injectable } from 'tsyringe';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Logger } from '@aws-lambda-powertools/logger';

/**
 * Ported from .NET S3ThumbnailStorage.
 *
 * Stores share thumbnails in the bucket named by SHARE_THUMBNAILS_BUCKET
 * and emits virtual-hosted-style public URLs using AWS_REGION.
 */
@injectable()
export class ThumbnailStorage {
    private readonly bucket: string;
    private readonly region: string;
    private readonly client: S3Client;

    constructor(private logger: Logger) {
        const bucket = process.env.SHARE_THUMBNAILS_BUCKET;
        if (!bucket) {
            throw new Error('SHARE_THUMBNAILS_BUCKET environment variable is not set');
        }
        this.bucket = bucket;
        this.region = process.env.AWS_REGION ?? 'us-east-1';
        this.client = new S3Client({});
    }

    public async put(shareId: string, png: Uint8Array): Promise<string> {
        const key = `${shareId}.png`;
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: png,
                ContentType: 'image/png',
            })
        );
        this.logger.info('Uploaded share thumbnail', { key, bytes: png.length });
        return key;
    }

    public async delete(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );
    }

    public publicUrl(key: string): string {
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
}
