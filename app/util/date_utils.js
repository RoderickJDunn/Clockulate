/**
 * Created by rdunn on 2017-08-20.
 */


// No need for this module as of right now... leaving just in case.

// import moment from 'moment';


// function epochToTime(seconds, military) {
//     if (seconds === null) {
//         console.error("'seconds' is a required argument for the conversion");
//         return;
//     }
//     let totalMinutes = calcFullMinutes(seconds);
//     let hours = calcFullHours(seconds);
//     let minutes = totalMinutes - hours*60;  // calculate the number of minutes in the 'incomplete' hour
//
//     if (military) {
//         // use 24-hour clock
//
//     }
//     else {
//         // use 12-hour clock
//
//     }
// }
//
// /*
// Calculates the number of full hours for the given number of seconds
//  */
// function calcFullHours(seconds)
// {
//     return Math.trunc(seconds / 3600);
// }
//
// /*
//  Calculates the number of full minutes for the given number of seconds
//  */
// function calcFullMinutes(seconds) {
//     return Math.trunc(seconds / 60);
// }


export function calcWholeHours(seconds)
{
    return Math.trunc(seconds / 3600);
}

export function calcMinutes(seconds, hours)
{
    seconds = seconds - hours * 3600;
    return Math.trunc(seconds / 60);
}

export function hour_min_toSec(hours_mins) {
    if (hours_mins.constructor === Array && hours_mins.length === 2) {
        return hours_mins[0] * 3600 + hours_mins[1] * 60;
    }
    else {
        console.error("Paramter must be a time array of the format: [h, m]");
    }
}
