export enum FishSize {
  Undersize = 'Undersize',
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
  VeryLarge = 'VeryLarge',
}

export const FISH_SIZE_COLORS: Record<FishSize, string> = {
  [FishSize.Undersize]: '#888888',
  [FishSize.Small]:     '#3B82F6',
  [FishSize.Medium]:    '#22C55E',
  [FishSize.Large]:     '#F97316',
  [FishSize.VeryLarge]: '#EF4444',
};

export interface Location {
  latitude: number;
  longitude: number;
}

export interface WeatherAttributes {
  fromMajorBiteTime?: string;
  fromMinorBiteTime?: string;
  majorBiteTime?: string;
  minorBiteTime?: string;
  sunSet?: string;
  sunRise?: string;
  moonSet?: string;
  moonRise?: string;
  lowTide?: string;
  highTide?: string;
  tideHeight?: number;
  wind?: { speedKnots: number; direction: number };
}

export interface NewShare {
  tripIds: string[];
  recipientEmail: string;
  fuzzLocation: boolean;
  expiresInDays: number | null;
  message: string | null;
}

export interface CreateShareResponse {
  shareId: string;
  emailSent: boolean;
  thumbnailGenerated: boolean;
}

export interface ShareSummary {
  shareId: string;
  ownerDisplayName: string;
  recipientEmail: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  tripCount: number;
  catchCount: number;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface FrozenCatchDto {
  catchId: string;
  speciesId: string;
  displayLocation: Location;
  caughtWhen: string;
  caughtSize: FishSize;
  caughtLength: number;
  weather: WeatherAttributes | null;
}

export interface FrozenTripDto {
  tripId: string;
  startTime: string;
  endTime: string | null;
  notes: string;
  rating: number;
  tags: string[];
  species: string[];
  defaultSpecies: string;
  catches: FrozenCatchDto[];
}

export interface ShareDetails {
  shareId: string;
  ownerDisplayName: string;
  createdAt: string;
  expiresAt: string | null;
  fuzzLocation: boolean;
  message: string | null;
  trips: FrozenTripDto[];
}
