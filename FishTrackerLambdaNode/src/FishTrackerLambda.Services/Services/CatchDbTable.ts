import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Logger } from 'winston';

interface HttpWrapper<T> {
    statusCode: number;
    body: T | string;
}

class HttpWrapper<T> {
    static Ok<T>(body: T): HttpWrapper<T> {
        return { statusCode: 200, body };
    }

    static NotFound<T>(): HttpWrapper<T> {
        return { statusCode: 404, body: 'Not Found' };
    }
}

export class DynamoDbHelper {
    static async saveDynamoDbRecord<T>(record: T, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T>> {
        logger.info('DynamoDbHelper::SaveDynamoDbRecord');

        const params: DocumentClient.PutItemInput = {
            TableName: 'YourTableName', // Replace with your table name
            Item: record
        };

        await client.put(params).promise();
        return HttpWrapper.Ok(record);
    }

    static async updateDynamoDbRecord<T>(record: T, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T>> {
        logger.info('DynamoDbHelper::UpdateDynamoDbRecord');

        const params: DocumentClient.PutItemInput = {
            TableName: 'YourTableName', // Replace with your table name
            Item: record
        };

        await client.put(params).promise();
        return HttpWrapper.Ok(record);
    }

    static async deleteDynamoDbRecord<T>(record: T, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T>> {
        logger.info('DynamoDbHelper::DeleteDynamoDbRecord');

        const params: DocumentClient.DeleteItemInput = {
            TableName: 'YourTableName', // Replace with your table name
            Key: record
        };

        await client.delete(params).promise();
        return HttpWrapper.Ok(record);
    }

    static async getDynamoDbRecord<T, P, S>(part: P, sortKey: S, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T>> {
        logger.info(`DynamoDbHelper::GetDynamoDbRecord part[${part}] sort[${sortKey}]`);

        try {
            const params: DocumentClient.GetItemInput = {
                TableName: 'YourTableName', // Replace with your table name
                Key: {
                    'PartitionKey': part,
                    'SortKey': sortKey
                }
            };

            const result = await client.get(params).promise();
            return result.Item ? HttpWrapper.Ok(result.Item as T) : HttpWrapper.NotFound();
        } catch (error) {
            logger.error(`GetDynamoDbRecord:[${part}][${sortKey}] Exception:[${error.message}] [Type[${error.constructor.name}]]`);
            throw error;
        }
    }

    static async getDynamoDbRecord<T, P>(part: P, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T>> {
        logger.info(`DynamoDbHelper::GetDynamoDbRecord part[${part}]`);

        try {
            const params: DocumentClient.GetItemInput = {
                TableName: 'YourTableName', // Replace with your table name
                Key: {
                    'PartitionKey': part
                }
            };

            const result = await client.get(params).promise();
            return result.Item ? HttpWrapper.Ok(result.Item as T) : HttpWrapper.NotFound();
        } catch (error) {
            logger.error(`GetDynamoDbRecord:[${part}] Exception:[${error.message}] [Type[${error.constructor.name}]]`);
            throw error;
        }
    }

    static async getDynamoDbRecords<T>(client: DocumentClient, logger: Logger): Promise<HttpWrapper<T[]>> {
        logger.info('DynamoDbHelper::GetDynamoDbRecords');

        try {
            const params: DocumentClient.ScanInput = {
                TableName: 'YourTableName' // Replace with your table name
            };

            const result = await client.scan(params).promise();
            return HttpWrapper.Ok(result.Items as T[]);
        } catch (error) {
            logger.error(`GetDynamoDbRecords:Exception:[${error.message}] [Type[${error.constructor.name}]]`);
            throw error;
        }
    }

    static async getDynamoDbRecordsByPartitionKey<T, P>(part: P, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T[]>> {
        logger.info(`DynamoDbHelper::GetDynamoDbRecords part[${part}]`);

        try {
            const params: DocumentClient.QueryInput = {
                TableName: 'YourTableName', // Replace with your table name
                KeyConditionExpression: '#partitionKey = :partitionKey',
                ExpressionAttributeNames: {
                    '#partitionKey': 'PartitionKey'
                },
                ExpressionAttributeValues: {
                    ':partitionKey': part
                }
            };

            const result = await client.query(params).promise();
            return HttpWrapper.Ok(result.Items as T[]);
        } catch (error) {
            logger.error(`GetDynamoDbRecords:[${part}] Exception:[${error.message}] [Type[${error.constructor.name}]]`);
            throw error;
        }
    }

    static async getDynamoDbRecordsBySortKeyRange<T, P>(partitionKey: P, partKeyName: string, sortKeyName: string, lowerBound: string, upperBound: string, client: DocumentClient, logger: Logger): Promise<HttpWrapper<T[]>> {
        logger.info(`GetDynamoDbRecordsBySortKeyRange partitionKey[${partitionKey}], lowerBound[${lowerBound}], upperBound[${upperBound}]`);

        try {
            const params: DocumentClient.QueryInput = {
                TableName: 'YourTableName', // Replace with your table name
                KeyConditionExpression: '#partitionKey = :partitionKey AND #sortKey BETWEEN :lowerBound AND :upperBound',
                ExpressionAttributeNames: {
                    '#partitionKey': partKeyName,
                    '#sortKey': sortKeyName
                },
                ExpressionAttributeValues: {
                    ':partitionKey': partitionKey,
                    ':lowerBound': lowerBound,
                    ':upperBound': upperBound
                }
            };

            const result = await client.query(params).promise();
            return HttpWrapper.Ok(result.Items as T[]);
        } catch (error) {
            logger.error(`GetDynamoDbRecordsBySortKeyRange partitionKey[${partitionKey}], lowerBound[${lowerBound}], upperBound[${upperBound}]  Exception:[${error.message}] Type[${error.constructor.name}]`);
            throw error;
        }
    }
}