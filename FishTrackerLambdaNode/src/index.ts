import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'FishTrackerLambda' });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Received event', { event });

    try {
        const { httpMethod, path } = event;

        if (httpMethod === 'GET' && path === '/hello') {
            const response = {
                statusCode: 200,
                body: JSON.stringify({ message: 'Hello, FishTrackerLambda!' }),
            };
            logger.info('Response', { response });
            return response;
        }

        const response = {
            statusCode: 404,
            body: JSON.stringify({ message: 'Not Found' }),
        };
        logger.warn('Not Found', { response });
        return response;
    } catch (error) {
        logger.error('Error processing request', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};