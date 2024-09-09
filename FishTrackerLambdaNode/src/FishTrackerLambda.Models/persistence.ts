namespace CombinedNamespace
{
    export interface DynamoDbProfile {
        subject: string;
        timezone?: string;
        species: string[];
        defaultSpecies: string;
        dynamoDbVersion?: number;
    }
    
    export class DynamoDbProfileImpl implements DynamoDbProfile {
        subject: string;
        timezone?: string;
        species: string[];
        defaultSpecies: string;
        dynamoDbVersion?: number;
    
        constructor(subject: string, timezone: string | undefined, species: string[], defaultSpecies: string, dynamoDbVersion: number | undefined) {
            this.subject = subject;
            this.timezone = timezone;
            this.species = species;
            this.defaultSpecies = defaultSpecies;
            this.dynamoDbVersion = dynamoDbVersion;
        }
    }    

    export interface DynamoDbSettings {
        settings: string;
        species: string[];
        dynamoDbVersion?: number;
    }
    
    export class DynamoDbSettingsImpl implements DynamoDbSettings {
        settings: string;
        species: string[];
        dynamoDbVersion?: number;
    
        constructor(settings: string, species: string[], dynamoDbVersion: number | undefined) {
            this.settings = settings;
            this.species = species;
            this.dynamoDbVersion = dynamoDbVersion;
        }
    
        static createDefault(): DynamoDbSettingsImpl {
            return new DynamoDbSettingsImpl('', [], undefined);
        }
    }    

    export interface DynamoDbCatch {
        subject: string;
        tripId: string;
        catchId: string;
        species: string;
        length: number;
        weight?: number;
        timestamp: string;
    }
    
    export class DynamoDbCatchImpl implements DynamoDbCatch {
        subject: string;
        tripId: string;
        catchId: string;
        species: string;
        length: number;
        weight?: number;
        timestamp: string;
    
        constructor(
            subject: string,
            tripId: string,
            catchId: string,
            species: string,
            length: number,
            weight: number | undefined,
            timestamp: string
        ) {
            this.subject = subject;
            this.tripId = tripId;
            this.catchId = catchId;
            this.species = species;
            this.length = length;
            this.weight = weight;
            this.timestamp = timestamp;
        }
    }

    export interface DynamoDbTrip {
        subject: string;
        tripId: string;
        startTime: string;
        endTime?: string;
    }
    
    export class DynamoDbTripImpl implements DynamoDbTrip {
        subject: string;
        tripId: string;
        startTime: string;
        endTime?: string;
    
        constructor(subject: string, tripId: string, startTime: string, endTime: string | undefined) {
            this.subject = subject;
            this.tripId = tripId;
            this.startTime = startTime;
            this.endTime = endTime;
        }
    }    
}
