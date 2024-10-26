import SunCalc, { GetTimesResult } from 'suncalc';
import { IBiteTime, IBiteTimesDetails } from '../Models/lambda';
import { DateTime } from 'luxon';
import { DateConverter } from '../Helpers/DateConverter';

export interface GetLocalTimesResult {
    dawn: DateTime;
    dusk: DateTime;
    goldenHour: DateTime;
    goldenHourEnd: DateTime;
    nadir: DateTime;
    nauticalDawn: DateTime;
    nauticalDusk: DateTime;
    night: DateTime;
    nightEnd: DateTime;
    solarNoon: DateTime;
    sunrise: DateTime;
    sunriseEnd: DateTime;
    sunset: DateTime;
    sunsetStart: DateTime;
}

function convertTimsResultToTimeZone(times: GetTimesResult, timeZone?: string): GetLocalTimesResult {
    if (!timeZone) {
        return {
            dawn: DateTime.fromJSDate(times.dawn),
            dusk: DateTime.fromJSDate(times.dusk),
            goldenHour: DateTime.fromJSDate(times.goldenHour),
            goldenHourEnd: DateTime.fromJSDate(times.goldenHourEnd),
            nadir: DateTime.fromJSDate(times.nadir),
            nauticalDawn: DateTime.fromJSDate(times.nauticalDawn),
            nauticalDusk: DateTime.fromJSDate(times.nauticalDusk),
            night: DateTime.fromJSDate(times.night),
            nightEnd: DateTime.fromJSDate(times.nightEnd),
            solarNoon: DateTime.fromJSDate(times.solarNoon),
            sunrise: DateTime.fromJSDate(times.sunrise),
            sunriseEnd: DateTime.fromJSDate(times.sunriseEnd),
            sunset: DateTime.fromJSDate(times.sunset),
            sunsetStart: DateTime.fromJSDate(times.sunsetStart)
        };
    }

    return {
        dawn: DateConverter.convertDateToLocal(times.dawn, timeZone),
        dusk: DateConverter.convertDateToLocal(times.dusk, timeZone),
        goldenHour: DateConverter.convertDateToLocal(times.goldenHour, timeZone),
        goldenHourEnd: DateConverter.convertDateToLocal(times.goldenHourEnd, timeZone),
        nadir: DateConverter.convertDateToLocal(times.nadir, timeZone),
        nauticalDawn: DateConverter.convertDateToLocal(times.nauticalDawn, timeZone),
        nauticalDusk: DateConverter.convertDateToLocal(times.nauticalDusk, timeZone),
        night: DateConverter.convertDateToLocal(times.night, timeZone),
        nightEnd: DateConverter.convertDateToLocal(times.nightEnd, timeZone),
        solarNoon: DateConverter.convertDateToLocal(times.solarNoon, timeZone),
        sunrise: DateConverter.convertDateToLocal(times.sunrise, timeZone),
        sunriseEnd: DateConverter.convertDateToLocal(times.sunriseEnd, timeZone),
        sunset: DateConverter.convertDateToLocal(times.sunset, timeZone),
        sunsetStart: DateConverter.convertDateToLocal(times.sunsetStart, timeZone)
    }
}

function moonPhase(date: DateTime): string {
    const diff = date.toJSDate().getTime() - new Date('2001-01-01').getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    const lunations = days / 29.53058867;
    const phaseIndex = lunations % 1;
    if (phaseIndex < 0.05 || phaseIndex > 0.95) {
        return "New Moon";
    } else if (0.45 < phaseIndex && phaseIndex < 0.55) {
        return "Full Moon";
    } else if (phaseIndex < 0.5) {
        return "First Quarter";
    } else {
        return "Last Quarter";
    }
}


function formatTimeDifference(diff: number): string {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

export function biteTimes(timeZone: string | undefined, caughtWhen: DateTime, latitude: number, longitude: number): IBiteTimesDetails {
    const today = caughtWhen.toJSDate();
    const times = convertTimsResultToTimeZone(SunCalc.getTimes(today, latitude, longitude), timeZone);
    // const localTime = {}
    console.log(`Sunrise: ${times.sunrise}`);
    console.log(`Sunset: ${times.sunset}`);
    const sunrise = times.sunrise;
    const sunset = times.sunset;
    const moon = moonPhase(caughtWhen);

    console.log(`Moon Phase: ${moon}`);

    const majorBiteTimes: IBiteTime[] = [
        { start: DateTime.fromMillis(sunrise.toMillis() - 60 * 60 * 1000), end: DateTime.fromMillis(sunrise.toMillis() + 60 * 60 * 1000) },
        { start: DateTime.fromMillis(sunset.toMillis() - 60 * 60 * 1000), end: DateTime.fromMillis(sunset.toMillis() + 60 * 60 * 1000) }
    ];

    const minorBiteTimes: IBiteTime[] = [
        { start: DateTime.fromMillis(sunrise.toMillis() - 30 * 60 * 1000), end: DateTime.fromMillis(sunrise.toMillis() + 60 * 60 * 1000) },
        { start: DateTime.fromMillis(sunset.toMillis() - 30 * 60 * 1000), end: DateTime.fromMillis(sunset.toMillis() + 60 * 60 * 1000) }
    ];

    if (moon === "Full Moon" || moon === "New Moon") {
        majorBiteTimes.push({ start: DateTime.fromMillis(sunrise.toMillis() + 6 * 60 * 60 * 1000), end: DateTime.fromMillis(sunrise.toMillis() + 8 * 60 * 60 * 1000) });
        majorBiteTimes.push({ start: DateTime.fromMillis(sunset.toMillis() + 6 * 60 * 60 * 1000), end: DateTime.fromMillis(sunset.toMillis() + 8 * 60 * 60 * 1000) });
    }

    majorBiteTimes.forEach(time => {
        console.log(`Major Bite Time: ${time.start} - ${time.end}`);
    });

    minorBiteTimes.forEach(time => {
        console.log(`Minor Bite Time: ${time.start} - ${time.end}`);
    });
        
    const timeToSunrise = formatTimeDifference(sunrise.toMillis() - today.getTime());
    const timeToSunset = formatTimeDifference(sunset.toMillis() - today.getTime());

    return { moonPhase: moon, majorBiteTimes, minorBiteTimes, sunrise: sunrise, sunset: sunset, timeToSunrise, timeToSunset };
}
