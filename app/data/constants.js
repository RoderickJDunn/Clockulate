/**
 * Created by rdunn on 2017-08-25.
 */

export const DefaultAlarm = {
    wakeUpTime: 45000000, // 8:00 am
    arrivalTime: 45000000,
    mode: "autocalc",
    tasks: [],
    label: "",
    enabled: true,
    visible: true,
    preset: false,
    order: null
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
