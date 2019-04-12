let moment = require("moment");

let _calcOffsetFromUserDelay = currAlarm => {
    let now = moment();
    console.log("Time of Snooze:", now);

    let snoozeTime = currAlarm.snoozeTime;
    let snoozeCnt = currAlarm.snoozeCount == null ? 0 : currAlarm.snoozeCount;
    let expSecSinceWake = snoozeCnt * (snoozeTime * 60); // # of secs since wakeUpTime if there was no user-delay in explicit snoozing.
    console.log("expSecSinceWake", expSecSinceWake);

    let wakeUpTime = moment(currAlarm.wakeUpTime);
    console.log("wakeUpTime", wakeUpTime);

    let actualSecSinceWake = (now - wakeUpTime) / 1000; // actual # of seconds since wakeUpTime.
    console.log("actualSecSinceWake", actualSecSinceWake);

    return actualSecSinceWake - expSecSinceWake;
};

let wakeUpTime = new Date();
console.log("wakeUpTime", wakeUpTime);

let triggers = [
    {
        snoozeTime: 0.167,
        snoozeCount: null,
        wakeUpTime: wakeUpTime
    },
    {
        snoozeTime: 0.166,
        snoozeCount: 1,
        wakeUpTime: wakeUpTime
    },
    {
        snoozeTime: 0.166,
        snoozeCount: 2,
        wakeUpTime: wakeUpTime
    }
];

let idx = 0;

let callWithTmo = (alarm, tmo) => {
    setTimeout(() => {
        let res = _calcOffsetFromUserDelay(alarm);

        console.log(res);
        idx++;
        callWithTmo(triggers[idx], 11000);
    }, tmo);
};

callWithTmo(triggers[idx], 3000);
