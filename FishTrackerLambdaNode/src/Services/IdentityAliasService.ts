import { injectable } from 'tsyringe';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDbHelper } from '../Db.Services/AWSWrapper';

/**
 * Maps a verified JWT `sub` to the subject its data is stored under.
 * Alias table (env IDENTITY_ALIAS_TABLE): PK `Subject` (the new shared-pool sub), attribute `LegacySubject`
 * (the pre-migration sub that owns the data). No alias item -> the sub itself.
 * Hits and misses are cached per container; an alias added later is picked up on the next cold start.
 */
@injectable()
export class IdentityAliasService {
    private readonly cache = new Map<string, string>();

    constructor(private readonly helper: DynamoDbHelper) {}

    public async resolveSubject(sub: string): Promise<string> {
        const cached = this.cache.get(sub);
        if (cached !== undefined) return cached;

        const tableName = process.env.IDENTITY_ALIAS_TABLE;
        if (!tableName) return sub;

        const result = await this.helper.docClient.send(new GetItemCommand({
            TableName: tableName,
            Key: { Subject: { S: sub } },
        }));
        const legacy = result.Item?.LegacySubject?.S;
        const resolved = legacy ? legacy : sub;
        this.cache.set(sub, resolved);
        return resolved;
    }
}
