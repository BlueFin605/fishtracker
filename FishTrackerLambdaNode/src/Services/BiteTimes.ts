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

function convertTimsResultToTimeZone(times: GetTimesResult, timeZone: string): GetLocalTimesResult {
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
    };
}

function formatTimeDifference(diff: number): string {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

function calcMoonPhase(date: Date): string {
    const diff = date.getTime() - new Date('2001-01-01').getTime();
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

// https://www.fishing.net.nz/fishing-advice/general-articles/understanding-bite-times/#:~:text=He%20concluded%20that%20the%20major,normal)%20at%20moonrise%20and%20moonset.

//He concluded that the major bite time (i.e. when fish are supposedly most active) is when the moon is directly overhead or directly underfoot, 
//and there is a minor bite time (i.e. when fish are more active than normal) at moonrise and moonset. Generally, there are four bite times during 
//a 24-hour period – two major bite times and two minor bite times. Sometimes there are only three because a lunar day is 24 hours and 50 minutes 
//long. Although the length of bite times vary, as a general rule of thumb, major bite times last about two hours and minor bite times last about 
//one hour.

//In addition, his solunar calendar shows that major and minor bite times are best when there is a full moon or a new moon, and weakest when 
//there is a quarter moon or a three quarter moon – apparently because the combined gravitational force of the moon and the sun is strongest when 
//both are directly above or directly below our heads.

//The solunar theory has been the subject of many scientific studies. One interesting experiment I came across involved a United States biologist 
//who flew live saltwater oysters over 700km inland to Chicago. He then placed them in tanks removed from sunlight. For the first week they 
//continued to open their shells according to the high tides from their ocean home. But by the second week, they had adjusted the opening of their 
//shells to when the moon was directly overhead or underfoot in Chicago (i.e. the solunar major bite time).

// Do solunar bite times influence fishing in NZ?
// The timing of solunar bite times varies in relation to the tidal cycle’s location. For example, in the Hauraki Gulf the major bite time begins 
//two hours before low tide, whereas on the Manukau Harbour it begins one hour after high tide. The bulk of my experience is fishing for snapper 
//and kingfish in the Hauraki Gulf, so I only feel qualified to comment on these species in this area.

// For snapper in the gulf, I think it’s definitely worth following the major solunar bite times as I’ve experienced many days where the snapper 
//came on the bite a couple of hours before low tide – as if someone has flicked a fishy switch. I even know some well-respected anglers who only 
//bother fishing out from Auckland during the major solunar bite time. But of course, there are some well-respected anglers who think it’s a load 
//of bollocks too!

//I find that often the snapper on Auckland’s east coast feed hard on either side of a tide change, be it high tide or low tide, while there tends 
//to be a slow period of inactivity at slack tide. However, the very best way to predict a good time to be snapper fishing in the Gulf is knowing 
//when the fish were on the chew the day before heading out, then adding on an hour for the progression of the daily tide cycle.

//In terms of the solunar theory proposing that bite times are strongest during full and new moons, my opinion on snapper is mixed. In my experience, 
//workup fishing is often very productive leading up to full and new moons. This could be attributed to growing tidal ranges given spring tides 
//occur during the full and new moon. Snapper and baitfish tend to be more active when the current is flowing, and lures or baits have more action 
//in moving water. However, the fishing is often terrible for one or two days right on the full moon – a phenomenon experienced by many fishers! 
//Proposed reasons for this include the fact that fish have already had multiple days of feeding hard which can’t be sustained, right through to 
//the full moon glow facilitating nocturnal feeding leading to less activity during the day.

//Workup action often intensifies leading up to the new and full moons, which is consistent with the solunar theory - although right on the full 
//moon the fishing can die off.

//Workup action often intensifies leading up to the new and full moons, which is consistent with the solunar theory - although right on the full 
//moon the fishing can die off.

//For kingfish in the gulf, I haven’t noticed any correlation between the Solunar bite times and good fishing. Sunrise is the best time for 
//topwater fishing, while the action at the spots we fish with livebaits seems to be governed primarily by the tides – some fire up on slack tide, 
//many are best on the outgoing tide and there are also a few areas where we prefer to fish the incoming tide. And as with snapper, often the worst 
//days to be fishing for kings are the day of the full moon and the following day.

//The right time of day or tide is the key for targeting kingfish in the Hauraki Gulf - not the solunar bite time.

//The right time of day or tide is the key for targeting kingfish in the Hauraki Gulf - not the solunar bite time.

//In summary, my advice is simply to go fishing when you can – fishing is as much science as it is smoke and mirrors. After all, it’s the mystery 
//and intrigue associated with saltwater fishing that keeps us coming back for more. But do keep bite times in mind, and if you notice some 
//patterns at your regular haunts you can add them to your list of factors that increase your chances of having a great day.

export async function biteTimes(timeZone: string, caughtWhen: DateTime, latitude: number, longitude: number): Promise<IBiteTimesDetails> {
    const today = caughtWhen.toJSDate();
    const times = convertTimsResultToTimeZone(SunCalc.getTimes(today, latitude, longitude), timeZone);
    const sunrise = times.sunrise;
    const sunset = times.sunset;
    const moonIllumination = SunCalc.getMoonIllumination(today);
    const moon = calcMoonPhase(today);    
    const moonPhase = moonIllumination.phase;
    const moonTimes = SunCalc.getMoonTimes(today, latitude, longitude);
    const moonrise = moonTimes.rise ? DateTime.fromJSDate(moonTimes.rise) : null;
    const moonset = moonTimes.set ? DateTime.fromJSDate(moonTimes.set) : null;

    console.log(`Sunrise: ${sunrise}`);
    console.log(`Sunset: ${sunset}`);
    console.log(`Moon Phase: ${moonPhase}`);
    console.log(`Moonrise: ${moonrise}`);
    console.log(`Moonset: ${moonset}`);
    
    const majorBiteTimes: IBiteTime[] = [];
    const minorBiteTimes: IBiteTime[] = [];
    
    // Calculate major bite times (moon overhead and underfoot)
    if (moonTimes.rise && moonTimes.set && moonrise && moonset) {
        const moonTransit = SunCalc.getMoonPosition(moonrise.toJSDate(), latitude, longitude).altitude === 0 ? moonrise : moonrise.plus({ hours: 12 });
        const moonOppositeTransit = moonTransit.plus({ hours: 12 });
        
        console.log(`Moontransit: ${moonTransit}`);
        console.log(`moonOppositeTransit: ${moonOppositeTransit}`);

        majorBiteTimes.push({ start: moonTransit.minus({ hours: 1 }), end: moonTransit.plus({ hours: 1 }) });
        majorBiteTimes.push({ start: moonOppositeTransit.minus({ hours: 1 }), end: moonOppositeTransit.plus({ hours: 1 }) });
    }

    // Calculate minor bite times (moonrise and moonset)
    if (moonrise) {
        minorBiteTimes.push({ start: moonrise.minus({ minutes: 30 }), end: moonrise.plus({ minutes: 30 }) });
    }
    if (moonset) {
        minorBiteTimes.push({ start: moonset.minus({ minutes: 30 }), end: moonset.plus({ minutes: 30 }) });
    }

    majorBiteTimes.forEach(time => {
        console.log(`Major Bite Time: ${time.start} - ${time.end}`);
    });

    minorBiteTimes.forEach(time => {
        console.log(`Minor Bite Time: ${time.start} - ${time.end}`);
    });

    const timeToSunrise = formatTimeDifference(sunrise.toMillis() - DateTime.now().toMillis());
    const timeToSunset = formatTimeDifference(sunset.toMillis() - DateTime.now().toMillis());

    return { moonPhase: moon, majorBiteTimes, minorBiteTimes, sunrise, sunset, timeToSunrise, timeToSunset };
}

const latitude = -36.8485;
const longitude = 174.7633;

biteTimes('America/New_York', DateTime.now(), latitude, longitude).then(result => {
    console.log(result);
});