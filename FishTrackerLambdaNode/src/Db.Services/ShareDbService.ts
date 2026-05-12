import { injectable } from 'tsyringe';
import {
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    PutItemCommand,
    PutItemCommandInput,
    UpdateItemCommand,
    UpdateItemCommandInput,
    GetItemCommand,
    GetItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDbHelper } from './AWSWrapper';
import { IDynamoDbShare } from '../Models/lambda';

/**
 * Share repository ported from .NET DynamoShareRepository + ShareDbTable.
 *
 * Table: FishTracker-Shares-${FISHTRACKER_ENV ?? 'Prod'}
 *   PK = OwnerSubject, SK = ShareId
 *   GSI ShareId-Index       (PK = ShareId)
 *   GSI RecipientEmail-Index (PK = RecipientEmail lowercase)
 *
 * The Trips array (and its nested Catches array) is marshalled via
 * util-dynamodb so nested maps/lists go in as native DDB types.
 */
@injectable()
export class ShareDbService {
    private readonly client: DynamoDBClient;
    private readonly tableName: string;
    private readonly logger = new Logger({ serviceName: 'FishTrackerLambda' });

    constructor(helper: DynamoDbHelper) {
        this.client = helper.docClient;
        this.tableName = `FishTracker-Shares-${process.env.FISHTRACKER_ENV ?? 'Prod'}`;
    }

    private static marshallOpts(input: any) {
        return marshall(input, { convertClassInstanceToMap: true, removeUndefinedValues: true });
    }

    public async getByOwner(ownerSubject: string, shareId: string): Promise<IDynamoDbShare | null> {
        const params: GetItemCommandInput = {
            TableName: this.tableName,
            Key: ShareDbService.marshallOpts({ OwnerSubject: ownerSubject, ShareId: shareId }),
        };
        try {
            const resp = await this.client.send(new GetItemCommand(params));
            if (!resp.Item) return null;
            return unmarshall(resp.Item) as IDynamoDbShare;
        } catch (error) {
            this.logger.error('ShareDbService.getByOwner failed', { error: (error as Error).message });
            return null;
        }
    }

    public async listByOwner(ownerSubject: string): Promise<IDynamoDbShare[]> {
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: '#pk = :owner',
            ExpressionAttributeNames: { '#pk': 'OwnerSubject' },
            ExpressionAttributeValues: ShareDbService.marshallOpts({ ':owner': ownerSubject }),
        };
        try {
            const resp = await this.client.send(new QueryCommand(params));
            return (resp.Items ?? []).map(i => unmarshall(i) as IDynamoDbShare);
        } catch (error) {
            this.logger.error('ShareDbService.listByOwner failed', { error: (error as Error).message });
            return [];
        }
    }

    public async getByShareId(shareId: string): Promise<IDynamoDbShare | null> {
        const params: QueryCommandInput = {
            TableName: this.tableName,
            IndexName: 'ShareId-Index',
            KeyConditionExpression: 'ShareId = :sid',
            ExpressionAttributeValues: ShareDbService.marshallOpts({ ':sid': shareId }),
            Limit: 1,
        };
        try {
            const resp = await this.client.send(new QueryCommand(params));
            if (!resp.Items || resp.Items.length === 0) return null;
            return unmarshall(resp.Items[0]) as IDynamoDbShare;
        } catch (error) {
            this.logger.error('ShareDbService.getByShareId failed', {
                shareId,
                error: (error as Error).message,
            });
            return null;
        }
    }

    public async listByRecipientEmail(lowerCaseEmail: string): Promise<IDynamoDbShare[]> {
        const params: QueryCommandInput = {
            TableName: this.tableName,
            IndexName: 'RecipientEmail-Index',
            KeyConditionExpression: 'RecipientEmail = :e',
            ExpressionAttributeValues: ShareDbService.marshallOpts({ ':e': lowerCaseEmail }),
        };
        try {
            const resp = await this.client.send(new QueryCommand(params));
            return (resp.Items ?? []).map(i => unmarshall(i) as IDynamoDbShare);
        } catch (error) {
            this.logger.error('ShareDbService.listByRecipientEmail failed', {
                email: lowerCaseEmail,
                error: (error as Error).message,
            });
            return [];
        }
    }

    public async save(share: IDynamoDbShare): Promise<IDynamoDbShare> {
        if (share.DynamoDbVersion === undefined) {
            share.DynamoDbVersion = 0;
        }
        const params: PutItemCommandInput = {
            TableName: this.tableName,
            Item: ShareDbService.marshallOpts(share),
        };
        await this.client.send(new PutItemCommand(params));
        return share;
    }

    /**
     * Best-effort optimistic update mirroring DynamoDbService.updateRecord's
     * version check so concurrent clones don't stomp each other.
     */
    public async update(share: IDynamoDbShare): Promise<IDynamoDbShare> {
        const currentVersion = share.DynamoDbVersion ?? 0;
        const isNewRecord = share.DynamoDbVersion === undefined;

        const updateParts: string[] = [];
        const names: Record<string, string> = {};
        const values: Record<string, any> = {};

        for (const [attr, value] of Object.entries(share)) {
            if (attr === 'OwnerSubject' || attr === 'ShareId' || attr === 'DynamoDbVersion') continue;
            if (value === undefined) continue;
            const n = `#${attr}`;
            const v = `:${attr}`;
            updateParts.push(`${n} = ${v}`);
            names[n] = attr;
            values[v] = value;
        }

        updateParts.push('#DynamoDbVersion = :newVersion');
        names['#DynamoDbVersion'] = 'DynamoDbVersion';
        values[':newVersion'] = currentVersion + 1;

        const conditionExpression = isNewRecord
            ? 'attribute_not_exists(#DynamoDbVersion)'
            : '#DynamoDbVersion = :currentVersion';

        const marshalledValues = isNewRecord
            ? ShareDbService.marshallOpts(values)
            : ShareDbService.marshallOpts({ ...values, ':currentVersion': currentVersion });

        const params: UpdateItemCommandInput = {
            TableName: this.tableName,
            Key: ShareDbService.marshallOpts({
                OwnerSubject: share.OwnerSubject,
                ShareId: share.ShareId,
            }),
            UpdateExpression: `SET ${updateParts.join(', ')}`,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: marshalledValues,
            ReturnValues: 'ALL_NEW',
        };

        const resp = await this.client.send(new UpdateItemCommand(params));
        if (resp.Attributes) {
            const updated = unmarshall(resp.Attributes) as IDynamoDbShare;
            return updated;
        }
        share.DynamoDbVersion = currentVersion + 1;
        return share;
    }
}
