import { injectable } from 'tsyringe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
@injectable()
export class DynamoDbHelper {
    private _docClient: DynamoDBClient;

    constructor(client: DynamoDBClient) {
        this._docClient = client;
    }

    public get docClient(): DynamoDBClient {
        return this._docClient;
    }

    private set docClient(client: DynamoDBClient) {
        this._docClient = client;
    }

    public configureLocal(): void {
        this.docClient = new DynamoDBClient({
            region: 'us-west-2', // Replace with your desired region
            endpoint: 'http://localhost:8000', // Replace with your DynamoDB service URL
            credentials: {
                accessKeyId: 'xxx', // Replace with your AWS access key ID
                secretAccessKey: 'xxx' // Replace with your AWS secret access key
            },
        });
    }
}