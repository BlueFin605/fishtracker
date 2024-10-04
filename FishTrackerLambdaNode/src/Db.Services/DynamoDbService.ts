import { DynamoDBClient, DynamoDBClientConfig, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand, PutItemCommandInput, GetItemCommandInput, QueryCommandInput, UpdateItemCommandInput, DeleteItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { HttpWrapper } from '../Functional/HttpWrapper';
import { Logger } from '@aws-lambda-powertools/logger';
import { Agent } from "http";
import { NodeHttpHandler } from "@smithy/node-http-handler";

class DynamoDbService<T> {
    private docClient: DynamoDBClient;
    private tableName: string;
    private partitionKeyName: string;
    private sortKeyName?: string;
    
    private logger = new Logger({ serviceName: 'FishTrackerLambda' });
    
    static marshallWithOptions(input: any) {
        return marshall(input, { convertClassInstanceToMap: true, removeUndefinedValues: true });
    }

    constructor(client: DynamoDBClient, tableName: string, partitionKeyName: string, sortKeyName?: string) {
        // const dynamoDbClientConfig: DynamoDBClientConfig = {
        //     region: 'us-west-2', // Replace with your desired region
        //     requestHandler: new NodeHttpHandler({
        //         httpAgent: new Agent({
        //             /*params*/
        //         }),
        //     }),
        //     endpoint: 'http://localhost:8000', // Replace with your DynamoDB service URL if using a local instance
        //     credentials: {
        //         accessKeyId: 'your-access-key-id', // Replace with your AWS access key ID
        //         secretAccessKey: 'your-secret-access-key' // Replace with your AWS secret access key
        //     }
        // };
        // const dynamoDbClient = new DynamoDBClient(dynamoDbClientConfig);

        const dynamoDbClient = new DynamoDBClient({
            region: 'us-west-2', // Replace with your desired region
            endpoint: 'http://localhost:8000', // Replace with your DynamoDB service URL
            credentials: {
                accessKeyId: 'xxx', // Replace with your AWS access key ID
                secretAccessKey: 'xxx' // Replace with your AWS secret access key
            },
        });
        
        this.docClient = dynamoDbClient;
        console.log(this.docClient);        
        this.tableName = tableName;
        this.partitionKeyName = partitionKeyName;
        this.sortKeyName = sortKeyName;
    }

    public async createRecord(record: T): Promise<HttpWrapper<T>> {
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
                return HttpWrapper.Ok(unmarshall(resp.Item) as T);
            } else {
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
                return HttpWrapper.Ok(unmarshall(resp.Item) as T);
            } else {
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
                return HttpWrapper.Ok(resp.Items.map(item => unmarshall(item) as T));
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

    async updateRecord(partitionKeyName: string, partitionValue: any, sortKeyName: string, sortValue: any, value: T): Promise<HttpWrapper<T>> {
        const params: UpdateItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions({
                [partitionKeyName]: partitionValue,
                [sortKeyName]: sortValue
            }),
            UpdateExpression: 'set #value = :value',
            ExpressionAttributeNames: {
                '#value': 'value'
            },
            ExpressionAttributeValues: DynamoDbService.marshallWithOptions({
                ':value': value
            }),
            ReturnValues: 'ALL_NEW'
        };

        try {
            const command = new UpdateItemCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('UpdateRecord Response', { response: resp });
            if (resp.Attributes) {
                return HttpWrapper.Ok(unmarshall(resp.Attributes) as T);
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
        const params: UpdateItemCommandInput = {
            TableName: this.tableName,
            Key: DynamoDbService.marshallWithOptions({
                [partitionKeyName]: partitionValue
            }),
            UpdateExpression: 'set #value = :value',
            ExpressionAttributeNames: {
                '#value': 'value'
            },
            ExpressionAttributeValues: DynamoDbService.marshallWithOptions({
                ':value': value
            }),
            ReturnValues: 'ALL_NEW'
        };

        try {
            const command = new UpdateItemCommand(params);
            const resp = await this.docClient.send(command);
            this.logger.info('UpdateRecordWithoutSortKey Response', { response: resp });
            if (resp.Attributes) {
                return HttpWrapper.Ok(unmarshall(resp.Attributes) as T);
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
                return HttpWrapper.Ok(resp.Items.map(item => unmarshall(item) as T));
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
                return HttpWrapper.Ok(unmarshall(resp.Attributes) as T);
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
