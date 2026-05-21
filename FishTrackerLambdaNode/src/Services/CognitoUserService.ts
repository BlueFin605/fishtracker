import { injectable } from 'tsyringe';
import {
    CognitoIdentityProviderClient,
    AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '@aws-lambda-powertools/logger';

export interface CognitoUserInfo {
    email: string;
    emailVerified: boolean;
    displayName: string;
}

/**
 * Looks up Cognito user attributes (email, email_verified, name) by sub.
 * Cached per Lambda cold-start because user attributes rarely change.
 *
 * USER_POOL_ID is set on the Lambda by CDK (lambdaEnvironment).
 * IAM role needs cognito-idp:AdminGetUser on the user pool ARN.
 */
@injectable()
export class CognitoUserService {
    private readonly client: CognitoIdentityProviderClient;
    private readonly userPoolId: string;
    private readonly cache = new Map<string, CognitoUserInfo>();
    private readonly logger = new Logger({ serviceName: 'FishTrackerLambda' });

    constructor() {
        this.client = new CognitoIdentityProviderClient({});
        this.userPoolId = process.env.USER_POOL_ID ?? '';
    }

    public async getUser(sub: string): Promise<CognitoUserInfo> {
        const cached = this.cache.get(sub);
        if (cached) return cached;

        if (!this.userPoolId) {
            this.logger.warn('USER_POOL_ID not set — returning empty user info');
            return { email: '', emailVerified: false, displayName: '' };
        }

        try {
            const resp = await this.client.send(new AdminGetUserCommand({
                UserPoolId: this.userPoolId,
                Username: sub,
            }));
            const attrs = resp.UserAttributes ?? [];
            const info: CognitoUserInfo = {
                email: attrs.find(a => a.Name === 'email')?.Value ?? '',
                emailVerified: (attrs.find(a => a.Name === 'email_verified')?.Value ?? 'false') === 'true',
                displayName:
                    attrs.find(a => a.Name === 'name')?.Value
                    ?? attrs.find(a => a.Name === 'preferred_username')?.Value
                    ?? attrs.find(a => a.Name === 'given_name')?.Value
                    ?? attrs.find(a => a.Name === 'email')?.Value
                    ?? '',
            };
            this.cache.set(sub, info);
            return info;
        } catch (error) {
            this.logger.error('CognitoUserService.getUser failed', {
                sub,
                error: (error as Error).message,
            });
            return { email: '', emailVerified: false, displayName: '' };
        }
    }
}
