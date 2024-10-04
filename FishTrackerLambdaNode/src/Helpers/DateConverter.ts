const timeZoneMap: { [key: string]: string } = {
    "Dateline Standard Time": "Etc/GMT+12",
    "UTC-11": "Etc/GMT+11",
    "Hawaiian Standard Time": "Pacific/Honolulu",
    "Alaskan Standard Time": "America/Anchorage",
    "Pacific Standard Time": "America/Los_Angeles",
    "US Mountain Standard Time": "America/Phoenix",
    "Mountain Standard Time": "America/Denver",
    "Central Standard Time": "America/Chicago",
    "Eastern Standard Time": "America/New_York",
    "Atlantic Standard Time": "America/Halifax",
    "Newfoundland Standard Time": "America/St_Johns",
    "UTC-02": "Etc/GMT+2",
    "UTC": "Etc/UTC",
    "GMT Standard Time": "Europe/London",
    "Central European Standard Time": "Europe/Berlin",
    "Eastern European Standard Time": "Europe/Bucharest",
    "South Africa Standard Time": "Africa/Johannesburg",
    "Russian Standard Time": "Europe/Moscow",
    "Arabian Standard Time": "Asia/Dubai",
    "Iran Standard Time": "Asia/Tehran",
    "Pakistan Standard Time": "Asia/Karachi",
    "India Standard Time": "Asia/Kolkata",
    "Bangladesh Standard Time": "Asia/Dhaka",
    "China Standard Time": "Asia/Shanghai",
    "Tokyo Standard Time": "Asia/Tokyo",
    "Korea Standard Time": "Asia/Seoul",
    "AUS Eastern Standard Time": "Australia/Sydney",
    "New Zealand Standard Time": "Pacific/Auckland",
    "Afghanistan Standard Time": "Asia/Kabul",
    "West Asia Standard Time": "Asia/Tashkent",
    "Nepal Standard Time": "Asia/Kathmandu",
    "Central Asia Standard Time": "Asia/Almaty",
    "Myanmar Standard Time": "Asia/Yangon",
    "SE Asia Standard Time": "Asia/Bangkok",
    "Singapore Standard Time": "Asia/Singapore",
    "Taipei Standard Time": "Asia/Taipei",
    "W. Australia Standard Time": "Australia/Perth",
    "Central Pacific Standard Time": "Pacific/Guadalcanal",
    "Fiji Standard Time": "Pacific/Fiji",
    "Tonga Standard Time": "Pacific/Tongatapu",
    "Azores Standard Time": "Atlantic/Azores",
    "Cape Verde Standard Time": "Atlantic/Cape_Verde",
    "Morocco Standard Time": "Africa/Casablanca",
    "Greenwich Standard Time": "Atlantic/Reykjavik",
    "W. Europe Standard Time": "Europe/Berlin",
    "Central Europe Standard Time": "Europe/Budapest",
    "Romance Standard Time": "Europe/Paris",
    "W. Central Africa Standard Time": "Africa/Lagos",
    "Jordan Standard Time": "Asia/Amman",
    "GTB Standard Time": "Europe/Bucharest",
    "Middle East Standard Time": "Asia/Beirut",
    "Egypt Standard Time": "Africa/Cairo",
    "Syria Standard Time": "Asia/Damascus",
    "E. Europe Standard Time": "Europe/Chisinau",
    "FLE Standard Time": "Europe/Kiev",
    "Turkey Standard Time": "Europe/Istanbul",
    "Israel Standard Time": "Asia/Jerusalem",
    "Arabic Standard Time": "Asia/Baghdad",
    "Kaliningrad Standard Time": "Europe/Kaliningrad",
    "Arab Standard Time": "Asia/Riyadh",
    "E. Africa Standard Time": "Africa/Nairobi",
    "Azerbaijan Standard Time": "Asia/Baku",
    "Russia Time Zone 3": "Europe/Samara",
    "Mauritius Standard Time": "Indian/Mauritius",
    "Georgian Standard Time": "Asia/Tbilisi",
    "Caucasus Standard Time": "Asia/Yerevan",
    "Ekaterinburg Standard Time": "Asia/Yekaterinburg",
    "Sri Lanka Standard Time": "Asia/Colombo",
    "N. Central Asia Standard Time": "Asia/Novosibirsk",
    "North Asia Standard Time": "Asia/Krasnoyarsk",
    "North Asia East Standard Time": "Asia/Irkutsk",
    "Ulaanbaatar Standard Time": "Asia/Ulaanbaatar",
    "Yakutsk Standard Time": "Asia/Yakutsk",
    "Cen. Australia Standard Time": "Australia/Adelaide",
    "AUS Central Standard Time": "Australia/Darwin",
    "E. Australia Standard Time": "Australia/Brisbane",
    "West Pacific Standard Time": "Pacific/Port_Moresby",
    "Tasmania Standard Time": "Australia/Hobart",
    "Vladivostok Standard Time": "Asia/Vladivostok",
    "Russia Time Zone 10": "Asia/Srednekolymsk",
    "Russia Time Zone 11": "Asia/Kamchatka",
    "UTC+12": "Etc/GMT-12",
    "Magadan Standard Time": "Asia/Magadan",
    "Samoa Standard Time": "Pacific/Apia"
};

export class DateConverter {
    
    // Function to get IANA time zone name from .NET time zone name
    static getIanaTimeZone(dotNetTimeZone: string): string {
        return timeZoneMap[dotNetTimeZone] || dotNetTimeZone;
    }

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
                const iana = this.getIanaTimeZone(timeZone);
                const date = new Date();
                const formatter = new Intl.DateTimeFormat('en-US', { 
                    timeZone: iana, 
                    hour12: false, 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    timeZoneName: 'short' 
                  });
                  
                  const fdate = formatter.format(date);
                  const ndate = new Date(fdate);
                  console.log(fdate);
                  console.log(ndate);
                  return ndate;
                // const parts = formatter.formatToParts(date);
                // const dateTimeString = parts.map(({ type, value }) => {
                //     switch (type) {
                //         case 'year':
                //         case 'month':
                //         case 'day':
                //         case 'hour':
                //         case 'minute':
                //         case 'second':
                //             return value.padStart(2, '0');
                //         default:
                //             return value;
                //     }
                // }).join('');
                // return new Date(dateTimeString);
            } catch (error) {
                console.error(`Invalid time zone: ${timeZone}`, error);
                return new Date();
            }
        }
    }
}