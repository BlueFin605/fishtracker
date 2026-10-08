import { injectable } from 'tsyringe';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

/**
 * Reads secrets out of SSM Parameter Store once per cold-start and memoises them.
 *
 * Registered as a singleton so the underlying SDK client and cached values live
 * across Lambda invocations within the same container.
 */
@injectable()
export class SecretsCache {
    private client: SSMClient | undefined;
    private staticMapsKeyPromise: Promise<string> | undefined;

    public async getStaticMapsKey(): Promise<string> {
        if (!this.staticMapsKeyPromise) {
            this.staticMapsKeyPromise = this.loadStaticMapsKey();
        }
        return this.staticMapsKeyPromise;
    }

    private async loadStaticMapsKey(): Promise<string> {
        const parameterName = process.env.STATIC_MAPS_PARAMETER_NAME;
        if (!parameterName) {
            throw new Error('STATIC_MAPS_PARAMETER_NAME environment variable is not set');
        }

        const client = this.getClient();
        const resp = await client.send(
            new GetParameterCommand({ Name: parameterName, WithDecryption: true })
        );
        const value = resp.Parameter?.Value;
        if (!value) {
            throw new Error(`SSM parameter ${parameterName} has no value`);
        }

        // Allow the parameter to be stored either as a raw string or as a JSON blob
        // with an "apiKey" or "key" field (matches the pattern the other projects use).
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

    private getClient(): SSMClient {
        if (!this.client) {
            this.client = new SSMClient({});
        }
        return this.client;
    }
}
