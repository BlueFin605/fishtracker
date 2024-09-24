import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
// import { ClaimsPrincipal } from 'some-claims-library'; // Replace with actual claims library
import { IClaimHandler, IProfileService, ISettingsService, ITripService, ICatchService } from './services'; // Replace with actual service imports
import { ProfileDetails, SettingsDetails, NewTrip, TripDetails, UpdateTripDetails, EndTripDetails, NewCatch, CatchDetails, UpdateCatchDetails } from './models'; // Replace with actual model imports
import { HttpWrapper } from './Functional/HttpWrapper';

const logger = new Logger({ serviceName: 'FishTrackerLambda' });

const getClaims = (event: APIGatewayProxyEvent): any => {
    console.log('event.requestContext.authorizer', JSON.stringify(event.requestContext.authorizer));
    const claims = event.requestContext.authorizer?.claims;
    if (!claims) {
        throw new Error('No claims found in the request context');
    }
    return claims;
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
        logger.error(`${logDesc} Exception ${e.message}`, { error: e });
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Received event', { event });

    const { httpMethod, path } = event;

    const claims = getClaims(event);

    const user = 'weneedtogetthisfromtheclaim';

    // const user = new ClaimsPrincipal(event.requestContext.authorizer.claims); // Replace with actual claims extraction

    try {
        if (httpMethod === 'GET' && path === '/') {
            return {
                statusCode: 200,
                body: 'Welcome to running AWS Lambda',
            };
        }

        if (httpMethod === 'GET' && path === '/api/profile') {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            return await executeService(`GetProfile subject:[${subjectClaim}]`, async () => await profileService.getProfile(subjectClaim));
        }

        if (httpMethod === 'PATCH' && path === '/api/profile') {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const profile: ProfileDetails = JSON.parse(event.body || '{}');
            return await executeService(`UpdateProfile subject:[${subjectClaim}]`, async () => await profileService.updateProfile(subjectClaim, profile));
        }

        if (httpMethod === 'GET' && path === '/api/settings') {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            return await executeService(`GetSettings subject:[${subjectClaim}]`, async () => await settingsService.getSettings());
        }

        if (httpMethod === 'PATCH' && path === '/api/settings') {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const settings: SettingsDetails = JSON.parse(event.body || '{}');
            return await executeService(`UpdateSettings subject:[${subjectClaim}]`, async () => await settingsService.updateSettings(settings));
        }

        if (httpMethod === 'GET' && path.startsWith('/api/trip/')) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const view = event.queryStringParameters?.view;
            return await executeService(`GetAllTrips subject:[${subjectClaim}] view:[${view}]`, async () => await tripService.getTrips(subjectClaim, view));
        }

        if (httpMethod === 'GET' && path.match(/^\/api\/trip\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').pop();
            return await executeService(`GetTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.getTrip(subjectClaim, tripId));
        }

        if (httpMethod === 'DELETE' && path.match(/^\/api\/trip\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').pop();
            return await executeService(`DeleteTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.deleteTrip(subjectClaim, tripId));
        }

        if (httpMethod === 'POST' && path === '/api/trip') {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const newTrip: NewTrip = JSON.parse(event.body || '{}');
            return await executeService(`NewTrip subject:[${subjectClaim}]`, async () => await tripService.newTrip(subjectClaim, newTrip));
        }

        if (httpMethod === 'PUT' && path.match(/^\/api\/trip\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').pop();
            const trip: TripDetails = JSON.parse(event.body || '{}');
            return await executeService(`UpdateTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.updateTrip(subjectClaim, tripId, trip));
        }

        if (httpMethod === 'PATCH' && path.match(/^\/api\/trip\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').pop();
            const trip: UpdateTripDetails = JSON.parse(event.body || '{}');
            return await executeService(`PatchTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.patchTrip(subjectClaim, tripId, trip));
        }

        if (httpMethod === 'POST' && path.match(/^\/api\/trip\/[^\/]+\/endtrip$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').slice(-2, -1)[0];
            const trip: EndTripDetails = JSON.parse(event.body || '{}');
            return await executeService(`EndTrip subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await tripService.endTrip(subjectClaim, tripId, trip));
        }

        if (httpMethod === 'GET' && path.match(/^\/api\/trip\/[^\/]+\/catch$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').slice(-2, -1)[0];
            return await executeService(`GetTripCatch subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await catchService.getTripCatch(subjectClaim, tripId));
        }

        if (httpMethod === 'GET' && path.match(/^\/api\/trip\/[^\/]+\/catch\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const [tripId, catchId] = path.split('/').slice(-3, -1);
            return await executeService(`GetCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, async () => await catchService.getCatch(subjectClaim, tripId, catchId));
        }

        if (httpMethod === 'POST' && path.match(/^\/api\/trip\/[^\/]+\/catch$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const tripId = path.split('/').slice(-2, -1)[0];
            const newCatch: NewCatch = JSON.parse(event.body || '{}');
            return await executeService(`NewCatch subject:[${subjectClaim}] tripId:[${tripId}]`, async () => await catchService.newCatch(subjectClaim, tripId, newCatch));
        }

        if (httpMethod === 'PUT' && path.match(/^\/api\/trip\/[^\/]+\/catch\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
            const [tripId, catchId] = path.split('/').slice(-3, -1);
            const updateCatch: CatchDetails = JSON.parse(event.body || '{}');
            return await executeService(`UpdateCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, async () => await catchService.updateCatch(subjectClaim, tripId, catchId, updateCatch));
        }

        if (httpMethod === 'PATCH' && path.match(/^\/api\/trip\/[^\/]+\/catch\/[^\/]+$/)) {
            const subjectClaim = claimHandler.extractSubject(user.claims);
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