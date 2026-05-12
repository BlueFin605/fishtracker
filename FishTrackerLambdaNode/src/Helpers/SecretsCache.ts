import { injectable } from 'tsyringe';
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

/**
 * Reads secrets out of AWS Secrets Manager once per cold-start and memoises them.
 *
 * Registered as a singleton so the underlying SDK client and cached values live
 * across Lambda invocations within the same container.
 */
@injectable()
export class SecretsCache {
    private client: SecretsManagerClient | undefined;
    private staticMapsKeyPromise: Promise<string> | undefined;

    public async getStaticMapsKey(): Promise<string> {
        if (!this.staticMapsKeyPromise) {
            this.staticMapsKeyPromise = this.loadStaticMapsKey();
        }
        return this.staticMapsKeyPromise;
    }

    private async loadStaticMapsKey(): Promise<string> {
        const secretName = process.env.STATIC_MAPS_SECRET_NAME;
        if (!secretName) {
            throw new Error('STATIC_MAPS_SECRET_NAME environment variable is not set');
        }

        const client = this.getClient();
        const resp = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
        const value = resp.SecretString;
        if (!value) {
            throw new Error(`Secret ${secretName} has no SecretString value`);
        }

        // Allow the secret to be stored either as a raw string or as a JSON blob
        // with an "apiKey" or "key" field (matches the pattern the CDK uses).
        const trimmed = value.trim();
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed) as Record<string, unknown>;
                const candidate = parsed.apiKey ?? parsed.key ?? parsed.value;
                if (typeof candidate === 'string' && candidate.length > 0) {
                    return candidate;
                }
            } catch {
                // fall through: treat as raw string
            }
        }
        return trimmed;
    }

    private getClient(): SecretsManagerClient {
        if (!this.client) {
            this.client = new SecretsManagerClient({});
        }
        return this.client;
    }
}
