import { DateTime } from 'luxon';
import * as Astronomy from 'astronomy-engine';

export interface IBite {
    start: DateTime;
    end: DateTime;
}

export interface IBiteDetails {
    moonPhase: string;
    majorBiteTimes: IBite[];
    minorBiteTimes: IBite[];
    sunrise: DateTime;
    sunset: DateTime;
    moonrise?: DateTime;
    moonset?: DateTime;
    moonover?: DateTime;
    moonunder?: DateTime;
    timeToSunrise?: string;
    timeToSunset?: string;
}
interface IMoonTimes {
    under: DateTime;
    over: DateTime;
}

interface IRiseSetTimes {
    rise: DateTime | undefined;
    set: DateTime | undefined;
}

function formatTimeDifference(diff: number): string {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

function calcMTimes(body: Astronomy.Body, lat: number, lon: number, date: Date) : IRiseSetTimes{
    const observer = new Astronomy.Observer(lat, lon, 0);
    const time = new Astronomy.AstroTime(date);

    // Search for moonrise time
    const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, +1, time, 300);
    const moonriseTime = moonrise ? DateTime.fromJSDate(moonrise.date) : undefined;

    // Search for moonset time
    const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, time, 300);
    const moonsetTime = moonset ? DateTime.fromJSDate(moonset.date) : undefined;

    return {
        rise: moonriseTime,
        set: moonsetTime,
    };    
}


function calcMoonTimes(lat: number, lon: number, date: Date) : IRiseSetTimes{
    return calcMTimes(Astronomy.Body.Moon, lat, lon, date);
}

function calcSunTimes(lat: number, lon: number, date: Date) : IRiseSetTimes {
    return calcMTimes(Astronomy.Body.Sun, lat, lon, date);
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

function getMoonTransitTimes(latitude: number, longitude: number, date: Date): IMoonTimes {
    const observer = new Astronomy.Observer(latitude, longitude, 0);
    const time = new Astronomy.AstroTime(date);

    // Search for moon overhead (transit) time
    const moonOverhead = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 0, time);
    const moonOverheadTime = moonOverhead ? DateTime.fromJSDate(moonOverhead.time.date) : DateTime.invalid("Invalid date");

    // Search for moon underfoot (opposite transit) time
    const moonUnderfoot = Astronomy.SearchHourAngle(Astronomy.Body.Moon, observer, 12, time);
    const moonUnderfootTime = moonUnderfoot ? DateTime.fromJSDate(moonUnderfoot.time.date) : DateTime.invalid("Invalid date");

    return {
        over: moonOverheadTime,
        under: moonUnderfootTime
    };
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


//some good bite times
//https://www.bitetimes.fishing/bite-times/auckland
//https://www.fishingreminder.com/NZ/charts/fishing_times/Auckland


//over: 12:43
//rise:5:46
//set:19:40

//subtr:6:27
//half: (13:56) 6:28


//19:19 - 06:69 = 12:20
//18:27 - 06:02 = 12:25
//17:31 - 05:00 = 12:31
//16:32 - 04:12 = 12:20

export async function biteTimes(timeZone: string, caughtWhen: DateTime, latitude: number, longitude: number): Promise<IBiteDetails> {
    const today = caughtWhen.minus({ hours: 2 }).toJSDate();
    console.log(`Today: ${today}`);

    const moon = calcMoonPhase(today);    
    const moonTimes = calcMoonTimes(latitude, longitude, today);
    const sunTimes = calcSunTimes(latitude, longitude, today);
    console.log(`Moon Times: ${moonTimes.rise} - ${moonTimes.set}`);
    
    const majorBiteTimes: IBite[] = [];
    const minorBiteTimes: IBite[] = [];
    
    const posTimes = getMoonTransitTimes(latitude, longitude, today);
    majorBiteTimes.push({ start: posTimes.over.minus({ hours: 1 }), end: posTimes.over.plus({ hours: 1 }) });
    majorBiteTimes.push({ start: posTimes.under.minus({ hours: 1 }), end: posTimes.under.plus({ hours: 1 }) });

    // Calculate minor bite times (moonrise and moonset)
    if (moonTimes.rise) {
        minorBiteTimes.push({ start: moonTimes.rise.minus({ hours: 1 }), end: moonTimes.rise.plus({ hours: 1 }) });
    }
    if (moonTimes.set) {
        minorBiteTimes.push({ start: moonTimes.set.minus({ hours: 1 }), end: moonTimes.set.plus({ hours: 1 }) });
    }

    // majorBiteTimes.forEach(time => {
    //     console.log(`Major Bite Time: ${time.start} - ${time.end}`);
    // });

    // minorBiteTimes.forEach(time => {
    //     console.log(`Minor Bite Time: ${time.start} - ${time.end}`);
    // });

    const timeToSunrise = sunTimes.rise ? formatTimeDifference(sunTimes.rise.toMillis() - DateTime.now().toMillis()) : undefined;
    const timeToSunset = sunTimes.set ? formatTimeDifference(sunTimes.set.toMillis() - DateTime.now().toMillis()) : undefined;

    const ret =  { 
             moonPhase: moon, 
             majorBiteTimes: majorBiteTimes, 
             minorBiteTimes: minorBiteTimes, 
             sunrise: sunTimes.rise ?? DateTime.invalid("Invalid date"), 
             sunset: sunTimes.set ?? DateTime.invalid("Invalid date"), 
             moonrise: moonTimes?.rise, 
             moonset: moonTimes?.set, 
             moonover: posTimes.over,
             moonunder: posTimes.under,
             timeToSunrise: timeToSunrise, 
             timeToSunset: timeToSunset
    };

    return ret;
}
