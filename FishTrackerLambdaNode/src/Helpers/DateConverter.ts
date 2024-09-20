export class DateConverter {
    static isoToString(offset: Date): string {
        return offset.toISOString();
    }

    static isoFromString(offset: string): Date {
        return new Date(offset);
    }

    static getLocalNow(timeZone?: string): Date {
        if (!timeZone) {
            return new Date();
        } else {
            try {
                const date = new Date();
                const options = { timeZone, hour12: false };
                const formatter = new Intl.DateTimeFormat('en-US', options);
                const parts = formatter.formatToParts(date);
                const dateTimeString = parts.map(({ type, value }) => {
                    switch (type) {
                        case 'year':
                        case 'month':
                        case 'day':
                        case 'hour':
                        case 'minute':
                        case 'second':
                            return value.padStart(2, '0');
                        default:
                            return value;
                    }
                }).join('');
                return new Date(dateTimeString);
            } catch (error) {
                console.error(`Invalid time zone: ${timeZone}`, error);
                return new Date();
            }
        }
    }
}