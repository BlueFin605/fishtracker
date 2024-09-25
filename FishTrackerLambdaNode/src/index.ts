import 'reflect-metadata';
import { container } from 'tsyringe';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { ClaimsPrincipal } from 'some-claims-library'; // Replace with actual claims library
// import { IClaimHandler, IProfileService, ISettingsService, ITripService, ICatchService } from './services'; // Replace with actual service imports
import { ProfileDetails, SettingsDetails, NewTrip, TripDetails, UpdateTripDetails, EndTripDetails, NewCatch, CatchDetails, UpdateCatchDetails } from './Models/lambda'; // Replace with actual model imports
import { HttpWrapper } from './Functional/HttpWrapper';
import { CatchService } from './Services/CatchService';

const logger = new Logger({ serviceName: 'FishTrackerLambda' });

const getClaimSubject = (event: APIGatewayProxyEvent): string => {
    console.log('event.requestContext.authorizer', JSON.stringify(event.requestContext.authorizer));
    console.log('event.requestContext.authorizer', JSON.stringify(event.requestContext));
    console.log('event.requestContext.authorizer', JSON.stringify(event));
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
        throw new Error('No claims found in the request context');
    }
    const subjectClaim = claims.find((claim: any) => claim.Type === 'principalId')?.Value;
    if (!subjectClaim) {
        throw new Error('No Subject[principalId] in claim');
    }    
    return subjectClaim;
};

const executeService = async <T>(logDesc: string, func: () => Promise<HttpWrapper<T>>): Promise<APIGatewayProxyResult> => {
    try {
        logger.info(logDesc);
        const result = await func();
        const httpResult = result.result;
        if (httpResult.statusCode === 200) {
            return {
                statusCode: 200,
                body: JSON.stringify(httpResult.object),
            };
        } else {
            return {
                statusCode: httpResult.statusCode,
                body: JSON.stringify({ message: httpResult.message }),
            };
        }
    } catch (e) {
        const error = e as Error;
        logger.error(`${logDesc} Exception ${error.message}`, { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Received event', { event });

    const { httpMethod, path } = event;

    // const claims = getClaims(event);

    // const user = 'weneedtogetthisfromtheclaim';

    // const user = new ClaimsPrincipal(event.requestContext.authorizer.claims); // Replace with actual claims extraction

    // const claimHandler = container.resolve(ClaimHandler);
    // const profileService = container.resolve(ProfileService);
    const catchService = container.resolve(CatchService);

    try {
        if (httpMethod === 'GET' && path === '/') {
            return {
                statusCode: 200,
                body: 'Welcome to running AWS Lambda',
            };
        }

        // if (httpMethod === 'GET' && path === '/api/profile') {
        //     const subjectClaim = getClaimSubject(event);
        //     return await executeService(`GetProfile subject:[${subjectClaim}]`, async () => await profileService.getProfile(subjectClaim));
        // }

        // if (httpMethod === 'PATCH' && path === '/api/profile') {
        //     const subjectClaim = getClaimSubject(event);
        //     const profile: ProfileDetails = JSON.parse(event.body || '{}');
        //     return await executeService(`UpdateProfile subject:[${subjectClaim}]`, async () => await profileService.updateProfile(subjectClaim, profile));
        // }

        // if (httpMethod === 'GET' && path === '/api/settings') {
        //     const subjectClaim = getClaimSubject(event);
        //     return await executeService(`GetSettings subject:[${subjectClaim}]`, async () => await settingsService.getSettings());
        // }

        // if (httpMethod === 'PATCH' && path === '/api/settings') {
        //     const subjectClaim = getClaimSubject(event);
        //     const settings: SettingsDetails = JSON.parse(event.body || '{}');
        //     return await executeService(`UpdateSettings subject:[${subjectClaim}]`, async () => await settingsService.updateSettings(settings));
        // }

        // if (httpMethod === 'GET' && path.startsWith('/api/trip/')) {
        //     const subjectClaim = getClaimSubject(event);
        //     const view = event.queryStringParameters?.view;
        //     return await executeService(`GetAllTrips subject:[${subjectClaim}] view:[${view}]`, async () => await tripService.getTrips(subjectClaim, view));
        // }

        // if (httpMethod === 'GET' && path.match(/^\/api\/trip\/[^\/]+$/)) {
        //     const subjectClaim = getClaimSubject(event);
        //     const tripId = path.split('/').pop();
        //     return await executeService(`GetTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.getTrip(subjectClaim, tripId));
        // }

        // if (httpMethod === 'DELETE' && path.match(/^\/api\/trip\/[^\/]+$/)) {
        //     const subjectClaim = getClaimSubject(event);
        //     const tripId = path.split('/').pop();
        //     return await executeService(`DeleteTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.deleteTrip(subjectClaim, tripId));
        // }

        // if (httpMethod === 'POST' && path === '/api/trip') {
        //     const subjectClaim = getClaimSubject(event);
        //     const newTrip: NewTrip = JSON.parse(event.body || '{}');
        //     return await executeService(`NewTrip subject:[${subjectClaim}]`, async () => await tripService.newTrip(subjectClaim, newTrip));
        // }

        // if (httpMethod === 'PUT' && path.match(/^\/api\/trip\/[^\/]+$/)) {
        //     const subjectClaim = getClaimSubject(event);
        //     const tripId = path.split('/').pop();
        //     const trip: TripDetails = JSON.parse(event.body || '{}');
        //     return await executeService(`UpdateTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.updateTrip(subjectClaim, tripId, trip));
        // }

        // if (httpMethod === 'PATCH' && path.match(/^\/api\/trip\/[^\/]+$/)) {
        //     const subjectClaim = getClaimSubject(event);
        //     const tripId = path.split('/').pop();
        //     const trip: UpdateTripDetails = JSON.parse(event.body || '{}');
        //     return await executeService(`PatchTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.patchTrip(subjectClaim, tripId, trip));
        // }

        // if (httpMethod === 'POST' && path.match(/^\/api\/trip\/[^\/]+\/endtrip$/)) {
        //     const subjectClaim = getClaimSubject(event);
        //     const tripId = path.split('/').slice(-2, -1)[0];
        //     const trip: EndTripDetails = JSON.parse(event.body || '{}');
        //     return await executeService(`EndTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.endTrip(subjectClaim, tripId, trip));
        // }

        if (httpMethod === 'GET' && path.match(/^\/api\/trip\/[^\/]+\/catch$/)) {
            const subjectClaim = getClaimSubject(event);
            const tripId = path.split('/').slice(-2, -1)[0];
            return await executeService(`GetTripCatch subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await catchService.getTripCatch(subjectClaim, tripId));
        }

        if (httpMethod === 'GET' && path.match(/^\/api\/trip\/[^\/]+\/catch\/[^\/]+$/)) {
            const subjectClaim = getClaimSubject(event);
            const [tripId, catchId] = path.split('/').slice(-3, -1);
            return await executeService(`GetCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, async () => await catchService.getCatch(subjectClaim, tripId, catchId));
        }

        if (httpMethod === 'POST' && path.match(/^\/api\/trip\/[^\/]+\/catch$/)) {
            const subjectClaim = getClaimSubject(event);
            const tripId = path.split('/').slice(-2, -1)[0];
            const newCatch: NewCatch = JSON.parse(event.body || '{}');
            return await executeService(`NewCatch subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await catchService.newCatch(subjectClaim, tripId, newCatch));
        }

        if (httpMethod === 'PUT' && path.match(/^\/api\/trip\/[^\/]+\/catch\/[^\/]+$/)) {
            const subjectClaim = getClaimSubject(event);
            const [tripId, catchId] = path.split('/').slice(-3, -1);
            const updateCatch: CatchDetails = JSON.parse(event.body || '{}');
            return await executeService(`UpdateCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, async () => await catchService.updateCatch(subjectClaim, tripId, catchId, updateCatch));
        }

        if (httpMethod === 'PATCH' && path.match(/^\/api\/trip\/[^\/]+\/catch\/[^\/]+$/)) {
            const subjectClaim = getClaimSubject(event);
            const [tripId, catchId] = path.split('/').slice(-3, -1);
            const updateCatch: UpdateCatchDetails = JSON.parse(event.body || '{}');
            return await executeService(`PatchCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, async () => await catchService.patchCatch(subjectClaim, tripId, catchId, updateCatch));
        }

        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Not Found' }),
        };
    } catch (error) {
        logger.error('Error processing request', { error });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};