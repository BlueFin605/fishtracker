import 'reflect-metadata';
import { container } from 'tsyringe';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import awsServerlessExpress from 'aws-serverless-express';
import express from 'express';
import { Server } from 'http';
import { CatchService } from './Services/CatchService';
import { TripService } from './Services/TripService';
import { DynamoDbHelper } from './Db.Services/AWSWrapper';
import injectApiGatewayEventHeader from './injectApiGatewayEventHeader';
import { Routes } from './routes';

var server: Server | undefined = undefined;

const logger = new Logger({ serviceName: 'FishTrackerLambda' });
container.registerSingleton(CatchService);
container.registerSingleton(TripService);
container.registerSingleton(DynamoDbHelper);
container.registerSingleton(Routes);
container.registerInstance(Logger, logger);

// Initialize Express App
const app = express();
app.use(express.json());

if (!process.env.IS_LAMBDA) {
    console.log('Applying injectApiGatewayEventHeader middleware'); // Debug log
    app.use(injectApiGatewayEventHeader);

    const awswrapper = container.resolve(DynamoDbHelper);
    awswrapper.configureLocal();
}

const routes = container.resolve(Routes);

// Use the routes
app.use('/api', routes.router);

// Main function to run the handler locally as a REST server
if (!process.env.IS_LAMBDA) {
    console.log('Is Running locally');
        
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
    });
}

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
    if (!server) {
        server = awsServerlessExpress.createServer(app);
    }

    event.headers['x-apigateway-event'] = JSON.stringify(event);
    awsServerlessExpress.proxy(server, event, context);
};
