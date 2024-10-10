import { DynamoDBClient, DynamoDBClientConfig, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand, PutItemCommandInput, GetItemCommandInput, QueryCommandInput, UpdateItemCommandInput, DeleteItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { Logger } from '@aws-lambda-powertools/logger';
import { Agent } from "http";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { DynamoDbHelper } from './AWSWrapper';
import { IVersionedRecord } from '../Models/lambda';

class DynamoDbService<T extends IVersionedRecord> {
    private docClient: DynamoDBClient;
    private tableName: string;
    private partitionKeyName: string;
    private sortKeyName?: string;

    private logger = new Logger({ serviceName: 'FishTrackerLambda' });

    static marshallWithOptions(input: any) {
        console.log('Marshalling', input);
        const convertedInput = DynamoDbService.convertStringArraysToSets(input);
        const m = marshall(convertedInput, { convertClassInstanceToMap: true, removeUndefinedValues: true });
        console.log('Marshalled', m);
        return m;
    }

    static unmarshallWithOptions(input: any) {
        console.log('Unmarshalling', input);
        const u = unmarshall(input);
        const convertedOutput = DynamoDbService.convertSetsToStringArrays(u);
        console.log('Unmarshalled', convertedOutput);
        return convertedOutput;
    }

    private static convertStringArraysToSets(input: any): any {
        console.log('convertStringArraysToSets Converting', input);
        const output: any = {};
        for (const key in input) {
            if (Array.isArray(input[key]) && input[key].every((item: string) => typeof item === 'string')) {
                output[key] = { SS: input[key] }; // Convert array of strings to String Set
            } else if (typeof input[key] === 'object' && input[key] !== null) {
                output[key] = DynamoDbService.convertStringArraysToSets(input[key]); // Recursively handle nested objects
            } else {
                output[key] = input[key];
            }
        }
        console.log('convertStringArraysToSets Converted', output);
        return output;
    }
    
    private static convertSetsToStringArrays(input: any): any {
        console.log('convertSetsToStringArrays Converting', input);
        const output: any = {};
        for (const key in input) {
            if (input[key] && input[key].SS) {
                output[key] = input[key].SS; // Convert String Set to array of strings
            } else if (typeof input[key] === 'object' && input[key] !== null) {
                output[key] = DynamoDbService.convertSetsToStringArrays(input[key]); // Recursively handle nested objects
            } else {
                output[key] = input[key];
            }
        }
        console.log('convertSetsToStringArrays Converted', output);
        return output;
    }
    constructor(client: DynamoDbHelper, tableName: string, partitionKeyName: string, sortKeyName?: string) {
        this.docClient = client.docClient;
        this.tableName = tableName;
        this.partitionKeyName = partitionKeyName;
        this.sortKeyName = sortKeyName;
    }

    public async createRecord(record: T): Promise<HttpWrapper<T>> {
        if (record.DynamoDbVersion === undefined)
            record.DynamoDbVersion = 0;

        const params: PutItemCommandInput = {
            TableName: this.tableName,
            Item: DynamoDbService.marshallWithOptions(record)
        };

        try {    
            const command = new PutItemCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('CreateRecord Response', { response: resp });
            return HttpWrapper.Ok(record);
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('CreateRecord Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('CreateRecord Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    async readRecord(partitionValue: any): Promise<HttpWrapper<T>> {
        const params: GetItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions({
                [this.partitionKeyName]: partitionValue
            })
        };

        try {
            const command = new GetItemCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('ReadRecord Response', { response: resp });
            if (resp.Item) {
                const unmarshalled: T = DynamoDbService.unmarshallWithOptions(resp.Item) as T;
                this.logger.info('Unmarshalled', unmarshalled);
                return HttpWrapper.Ok(unmarshalled);
            } else {
                this.logger.info('HttpWrapper.NotFound');
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('ReadRecord Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('ReadRecord Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    async readRecordWithSortKey(partitionValue: any, sortValue: any): Promise<HttpWrapper<T>> {
        if (!this.sortKeyName) {
            throw new Error('Sort key name is not defined');
        }
        const params: GetItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions({
                [this.partitionKeyName]: partitionValue,
                [this.sortKeyName]: sortValue
            })
        };

        try {
            const command = new GetItemCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('ReadRecordWithSortKey Response', { response: resp });
            if (resp.Item) {
                const unmarshalled: T = DynamoDbService.unmarshallWithOptions(resp.Item) as T;
                this.logger.info('Unmarshalled', unmarshalled);
                return HttpWrapper.Ok(unmarshalled);
            } else {
                this.logger.info('HttpWrapper.NotFound');
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('ReadRecordWithSortKey Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('ReadRecordWithSortKey Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    async readAllRecordsForPartition(partitionValue: any): Promise<HttpWrapper<T[]>> {
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: '#partitionKey = :partitionValue',
            ExpressionAttributeNames: {
                '#partitionKey': this.partitionKeyName
            },
            ExpressionAttributeValues: DynamoDbService.marshallWithOptions({
                ':partitionValue': partitionValue
            })
        };

        try {
            const command = new QueryCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('ReadAllRecordsForPartition Response', { response: resp });
            if (resp.Items) {
                return HttpWrapper.Ok(resp.Items.map(item => DynamoDbService.unmarshallWithOptions(item) as T));
            } else {
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('ReadAllRecordsForPartition Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('ReadAllRecordsForPartition Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    shouldSkipAttribute(attribute: string, attributeValue: any, attributesToSkip: string[]): boolean {
        return attribute === 'DynamoDbVersion' || attributesToSkip.includes(attribute) || attributeValue === undefined;
    }

    async updateRecord(partitionKeyName: string, partitionValue: any, sortKeyName: string, sortValue: any, value: T): Promise<HttpWrapper<T>> {
        const updateExpressionParts: string[] = [];
        const expressionAttributeNames: { [key: string]: string } = {};
        const expressionAttributeValues: { [key: string]: any } = {};

        for (const [attribute, attributeValue] of Object.entries(value)) {
            if (this.shouldSkipAttribute(attribute, attributeValue, [partitionKeyName, sortKeyName])) continue;

            const attributePlaceholder = `#${attribute}`;
            const valuePlaceholder = `:${attribute}`;

            updateExpressionParts.push(`${attributePlaceholder} = ${valuePlaceholder}`);
            expressionAttributeNames[attributePlaceholder] = attribute;
            expressionAttributeValues[valuePlaceholder] = attributeValue;
        }

        // Increment the version
        updateExpressionParts.push('#DynamoDbVersion = :newVersion');
        expressionAttributeNames['#DynamoDbVersion'] = 'DynamoDbVersion';
        if (value.DynamoDbVersion === undefined)
            value.DynamoDbVersion = 0;
        expressionAttributeValues[':newVersion'] = value.DynamoDbVersion + 1;

        const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

        const params: UpdateItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions({
                [partitionKeyName]: partitionValue,
                [sortKeyName]: sortValue
            }),
            UpdateExpression: updateExpression,
            ConditionExpression: '#DynamoDbVersion = :currentVersion',
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: DynamoDbService.marshallWithOptions({
                ...expressionAttributeValues,
                ':currentVersion': value.DynamoDbVersion
            }),
            ReturnValues: 'ALL_NEW'
        };

        try {
            const command = new UpdateItemCommand(params);
            console.log(JSON.stringify(command));

            const resp = await this.docClient.send(command);
            this.logger.info('UpdateRecord Response', { response: resp });
            if (resp.Attributes) {
                return HttpWrapper.Ok(DynamoDbService.unmarshallWithOptions(resp.Attributes) as T);
            } else {
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('UpdateRecord Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('UpdateRecord Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    async updateRecordWithoutSortKey(partitionKeyName: string, partitionValue: any, value: T): Promise<HttpWrapper<T>> {
        const updateExpressionParts: string[] = [];
        const expressionAttributeNames: { [key: string]: string } = {};
        const expressionAttributeValues: { [key: string]: any } = {};

        for (const [attribute, attributeValue] of Object.entries(value)) {
            if (this.shouldSkipAttribute(attribute, attributeValue, [partitionKeyName])) continue;

            const attributePlaceholder = `#${attribute}`;
            const valuePlaceholder = `:${attribute}`;

            updateExpressionParts.push(`${attributePlaceholder} = ${valuePlaceholder}`);
            expressionAttributeNames[attributePlaceholder] = attribute;
            expressionAttributeValues[valuePlaceholder] = attributeValue;
        }

        // Increment the version
        updateExpressionParts.push('#DynamoDbVersion = :newVersion');
        expressionAttributeNames['#DynamoDbVersion'] = 'DynamoDbVersion';
        if (value.DynamoDbVersion === undefined)
            value.DynamoDbVersion = 0;
        expressionAttributeValues[':newVersion'] = value.DynamoDbVersion + 1;

        const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

        const params: UpdateItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions({
                [partitionKeyName]: partitionValue
            }),
            UpdateExpression: updateExpression,
            ConditionExpression: '#DynamoDbVersion = :currentVersion',
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: DynamoDbService.marshallWithOptions({
                ...expressionAttributeValues,
                ':currentVersion': value.DynamoDbVersion
            }),
            ReturnValues: 'ALL_NEW'
        };

        try {
            const command = new UpdateItemCommand(params);
            console.log(JSON.stringify(command));

            const resp = await this.docClient.send(command);
            this.logger.info('UpdateRecordWithoutSortKey Response', { response: resp });
            if (resp.Attributes) {
                return HttpWrapper.Ok(DynamoDbService.unmarshallWithOptions(resp.Attributes) as T);
            } else {
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('UpdateRecordWithoutSortKey Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('UpdateRecordWithoutSortKey Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    async readRecordsBetweenSortKeys(partitionValue: any, startSortValue: any, endSortValue: any): Promise<HttpWrapper<T[]>> {
        if (!this.sortKeyName) {
            throw new Error('Sort key name is not defined');
        }
        const params: QueryCommandInput = {
            TableName: this.tableName,
            KeyConditionExpression: '#partitionKey = :partitionValue AND #sortKey BETWEEN :startSortValue AND :endSortValue',
            ExpressionAttributeNames: {
                '#partitionKey': this.partitionKeyName,
                '#sortKey': this.sortKeyName
            },
            ExpressionAttributeValues: DynamoDbService.marshallWithOptions({
                ':partitionValue': partitionValue,
                ':startSortValue': startSortValue,
                ':endSortValue': endSortValue
            })
        };

        try {
            const command = new QueryCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('ReadRecordsBetweenSortKeys Response', { response: resp });
            if (resp.Items) {
                return HttpWrapper.Ok(resp.Items.map(item => DynamoDbService.unmarshallWithOptions(item) as T));
            } else {
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('ReadRecordsBetweenSortKeys Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('ReadRecordsBetweenSortKeys Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }

    async deleteRecord(partitionValue: any, sortValue?: any): Promise<HttpWrapper<T>> {
        const key: any = {
            [this.partitionKeyName]: partitionValue
        };

        if (this.sortKeyName && sortValue !== undefined) {
            key[this.sortKeyName] = sortValue;
        }

        const params: DeleteItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions(key),
            ReturnValues: 'ALL_OLD'
        };

        try {
            const command = new DeleteItemCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('DeleteRecord Response', { response: resp });
            if (resp.Attributes) {
                return HttpWrapper.Ok(DynamoDbService.unmarshallWithOptions(resp.Attributes) as T);
            } else {
                return HttpWrapper.NotFound;
            }
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('DeleteRecord Exception', { message: error.message, name: error.name });
                return HttpWrapper.NotFound;
            } else {
                this.logger.error('DeleteRecord Unknown Exception', { error });
                return HttpWrapper.NotFound;
            }
        }
    }
}

export {
    DynamoDbService
}
