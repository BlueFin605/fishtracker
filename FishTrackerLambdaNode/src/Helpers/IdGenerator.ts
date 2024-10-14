const crypto = require("crypto");
import { DateTime } from 'luxon';

export class IdGenerator {
    static generateTripId(start: DateTime): string {
        const pad = (num: number): string => num.toString().padStart(2, '0');
        const month = pad(start.month);
        const day = pad(start.day);
        const hours = pad(start.hour);
        const minutes = pad(start.minute);
        const seconds = pad(start.second);
        const year = start.year.toString().slice(-2);
        return `${month}${day}:${hours}${minutes}${seconds}-${year}`;
    }
    
    static generateTripKey(subject: string, tripId: string): string {
        return `s:${subject};i:${tripId}`;
    }
    
    static generateUUID(): string {
        return crypto.randomUUID();
        // return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        //     const r = Math.random() * 16 | 0;
        //     const v = c === 'x' ? r : (r & 0x3 | 0x8);
        //     return v.toString(16);
        // });
    }
}