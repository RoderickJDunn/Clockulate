/**
 * Created by rdunn on 2017-08-25.
 */

import * as DateUtils from "../util/date_utils";

export let SOUND_TYPES = {
    SILENT: 0,
    NORMAL: 1,
    RANDOM: 2,
    RANDOM_SUBSET: 3
};

export let ALARM_STATES = {
    OFF: 0,
    SET: 1,
    RINGING: 2,
    SNOOZED: 3
};

export const DefaultSound = {};

export const DefaultAlarm = {
    wakeUpTime: getDateForHour(8), // 8:00 am
    arrivalTime: getDateForHour(8),
    mode: "autocalc",
    tasks: [],
    label: "",
    status: ALARM_STATES.SET,
    visible: true,
    preset: false,
    order: null,
    alarmSound: {},
    snoozeTime: 10 // minutes
};

export const DefaultTask = {
    name: "",
    duration: 0
};

let minuteArr = [];
export const minuteRange = () => {
    function _minuteArr() {
        // console.log("..generating minute array");
        // return [...(new Array(60)).keys()];  // this creates an array of numbers from 0-60
        return [...new Array(60)].map((x, i) => {
            // this creates an array of strings from 0-60 with " minutes" appended
            return i + " minutes";
        });
    }
    minuteArr = minuteArr.length ? minuteArr : _minuteArr();
    return minuteArr;
};

let hourArr = [];
export const hourRange = () => {
    function _hourArr() {
        // console.log("..generating hour array");
        return [...new Array(25)].map((x, i) => {
            // this creates an array of strings from 0-60 with " minutes" appended
            return i + " hours";
        });
    }
    hourArr = hourArr.length ? hourArr : _hourArr();
    return hourArr;
};

function getDateForHour(hour) {
    let d = new Date();
    d.setHours(hour);
    d.setMinutes(0);
    d.setMilliseconds(0);

    d = DateUtils.date_to_nextTimeInstance(d);
    return d;
}
