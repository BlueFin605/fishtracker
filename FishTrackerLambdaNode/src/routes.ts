import { injectable, inject } from 'tsyringe';
import { Router, Request, Response } from 'express';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayEventRequestContextWithAuthorizer, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { CatchService } from './Services/CatchService';
import { TripService } from './Services/TripService';
import { SettingsService } from './Services/SettingsService';
import { ProfileService } from './Services/ProfileService';
import { HttpWrapper } from './Functional/HttpWrapper';
import { IProfileDetails, ISettingsDetails, INewTrip, ITripDetails, IUpdateTripDetails, IEndTripDetails, INewCatch, ICatchDetails, IUpdateCatchDetails } from './Models/lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { plainToClass, classToPlain } from 'class-transformer';

@injectable()
export class Routes {
    public router: Router;

    constructor(
        @inject(TripService) private tripService: TripService,
        @inject(CatchService) private catchService: CatchService,
        @inject(SettingsService) private settingsService: SettingsService,
        @inject(ProfileService) private profileService: ProfileService,
        @inject(Logger) private logger: Logger
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/profile', this.getProfile.bind(this));
        this.router.patch('/profile', this.updateProfile.bind(this));
        this.router.get('/settings', this.getSettings.bind(this));
        this.router.patch('/settings', this.updateSettings.bind(this));
        this.router.get('/trip', this.getAllTrips.bind(this));
        this.router.get('/trip/:tripId', this.getTrip.bind(this));
        this.router.delete('/trip/:tripId', this.deleteTrip.bind(this));
        this.router.post('/trip', this.newTrip.bind(this));
        this.router.put('/trip/:tripId', this.updateTrip.bind(this));
        this.router.patch('/trip/:tripId', this.patchTrip.bind(this));
        this.router.post('/trip/:tripId/endtrip', this.endTrip.bind(this));
        this.router.get('/trip/:tripId/catch', this.getTripCatch.bind(this));
        this.router.get('/trip/:tripId/catch/:catchId', this.getCatch.bind(this));
        this.router.post('/trip/:tripId/catch', this.newCatch.bind(this));
        this.router.put('/trip/:tripId/catch/:catchId', this.updateCatch.bind(this));
        this.router.patch('/trip/:tripId/catch/:catchId', this.patchCatch.bind(this));
    }

    private getClaimSubject(authorizer: APIGatewayEventDefaultAuthorizerContext): string
    {
        if (authorizer?.claims) {
            const subjectClaim = authorizer.claims.find((claim: any) => claim.Type === 'principalId')?.Value;
            if (!subjectClaim) {
                throw new Error('No Subject[principalId] in claim');
            }
            console.log('subjectClaim[claims]', subjectClaim);
            return subjectClaim;
        }

        console.log('subjectClaim[principalId]', authorizer?.principalId);
        return authorizer?.principalId;
    }
    
    private getClaimSubjectFromHeader(request: Request): string 
    {
        const contextHeader = request.headers['x-apigateway-event'];
        if (typeof contextHeader !== 'string') {
            throw new Error('Invalid x-apigateway-event header');
        }
        const decodedContextHeader = decodeURIComponent(contextHeader);        
        const event: APIGatewayProxyEvent = JSON.parse(decodedContextHeader);
        return this.getClaimSubject(event.requestContext?.authorizer);
    }    

    private async executeService<T>(logDesc: string, func: () => Promise<HttpWrapper<T>>, res: Response) {
        try {
            this.logger.info(logDesc);
            const result = await func();
            const httpResult = result.result;
            if (httpResult.statusCode === 200) {
                // const serializedData = classToPlain(httpResult.object);                
                // res.status(200).json(serializedData);
                res.status(200).json(httpResult.object);                
            } else {
                res.status(httpResult.statusCode).send();
            }
        } catch (e) {
            const error = e as Error;
            this.logger.error(`${logDesc} Exception ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    }

    private async getProfile(req: Request, res: Response) {
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`GetProfile subject:[${subjectClaim}]`, () => this.profileService.getProfile(subjectClaim), res);
    }

    private async updateProfile(req: Request, res: Response) {
        const profile = req.body as IProfileDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`UpdateProfile subject:[${subjectClaim}]`, () => this.profileService.updateProfile(subjectClaim, profile), res);
    }

    private async getSettings(req: Request, res: Response) {
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`GetSettings subject:[${subjectClaim}]`, () => this.settingsService.getSettings(), res);
    }

    private async updateSettings(req: Request, res: Response) {
        const settings = req.body as ISettingsDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`UpdateSettings subject:[${subjectClaim}]`, () => this.settingsService.updateSettings(settings), res);
    }

    private async getAllTrips(req: Request, res: Response) {
        const view = req.query.view as string;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`GetAllTrips subject:[${subjectClaim}] view:[${view}]`, () => this.tripService.getTrips(subjectClaim, view), res);
    }

    private async getTrip(req: Request, res: Response) {
        const { tripId } = req.params;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`GetTrip subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.tripService.getTrip(subjectClaim, tripId), res);
    }

    private async deleteTrip(req: Request, res: Response) {
        const { tripId } = req.params;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`DeleteTrip subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.tripService.deleteTrip(subjectClaim, tripId), res);
    }

    private async newTrip(req: Request, res: Response) {
        const newTrip = req.body as INewTrip;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`NewTrip subject:[${subjectClaim}]`, () => this.tripService.newTrip(subjectClaim, newTrip), res);
    }

    private async updateTrip(req: Request, res: Response) {
        const { tripId } = req.params;
        const trip = req.body as ITripDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`UpdateTrip subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.tripService.updateTrip(subjectClaim, tripId, trip), res);
    }

    private async patchTrip(req: Request, res: Response) {
        const { tripId } = req.params;
        const trip = req.body as IUpdateTripDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`PatchTrip subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.tripService.patchTrip(subjectClaim, tripId, trip), res);
    }

    private async endTrip(req: Request, res: Response) {
        const { tripId } = req.params;
        const trip = req.body as IEndTripDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`EndTrip subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.tripService.endTrip(subjectClaim, tripId, trip), res);
    }

    private async getTripCatch(req: Request, res: Response) {
        const { tripId } = req.params;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`GetTripCatch subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.catchService.getTripCatch(subjectClaim, tripId), res);
    }

    private async getCatch(req: Request, res: Response) {
        const { tripId, catchId } = req.params;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`GetCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, () => this.catchService.getCatch(subjectClaim, tripId, catchId), res);
    }

    private async newCatch(req: Request, res: Response) {
        const { tripId } = req.params;
        const newCatch = req.body as INewCatch;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`NewCatch subject:[${subjectClaim}] tripId:[${tripId}]`, () => this.catchService.newCatch(subjectClaim, tripId, newCatch), res);
    }

    private async updateCatch(req: Request, res: Response) {
        const { tripId, catchId } = req.params;
        const updateCatch = req.body as ICatchDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`UpdateCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, () => this.catchService.updateCatch(subjectClaim, tripId, catchId, updateCatch), res);
    }

    private async patchCatch(req: Request, res: Response) {
        const { tripId, catchId } = req.params;
        const updateCatch = req.body as IUpdateCatchDetails;
        const subjectClaim = this.getClaimSubjectFromHeader(req);
        await this.executeService(`PatchCatch subject:[${subjectClaim}] tripId:[${tripId}] catchId:[${catchId}]`, () => this.catchService.patchCatch(subjectClaim, tripId, catchId, updateCatch), res);
    }
}