export class IdGenerator {
    static generateTripId(start: Date): string {
        const pad = (num: number): string => num.toString().padStart(2, '0');
        const month = pad(start.getMonth() + 1);
        const day = pad(start.getDate());
        const hours = pad(start.getHours());
        const minutes = pad(start.getMinutes());
        const seconds = pad(start.getSeconds());
        const year = start.getFullYear().toString().slice(-2);
        return `${month}${day}:${hours}${minutes}${seconds}-${year}`;
    }

    static generateTripKey(subject: string, tripId: string): string {
        return `s:${subject};i:${tripId}`;
    }
}