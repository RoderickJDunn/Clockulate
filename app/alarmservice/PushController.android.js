import ReactNativeAN from "react-native-alarm-notification";

import moment from "moment";

let FAKE_CATEGORY = "MyFakeCategory";

function alarmUUID_to_notificationID(alarmId) {
    let notifId = alarmId.replace(/[^[0-9]/g, "");
    return notifId.substring(0, 9);
}

// function alarmUUID_to_notificationID(alarmId) {
//     let notifId = alarmId.replace(/[^[0-9]/g, "");
//     return notifId.substring(0, 9);
// }

// TODO: Looks like this library doesn't support Notification Actions (or custom notification views). I can just move back to react-native-notifications (wix)

export let scheduleAlarm = alarm => {
    let notifId = alarmUUID_to_notificationID(alarm.id);
    let wakeUpMoment = moment(alarm.wakeUpTime);
    console.log("scheduleAlarm for: " + wakeUpMoment.toDate());
    const alarmNotifData = {
        id: notifId, // Required
        title: "Clockulate", // Required
        message: alarm.label, // Required
        ticker: "My Notification Ticker",
        auto_cancel: false, // default: true
        vibrate: true,
        vibration: 100, // default: 100, no vibration if vibrate: false
        small_icon: "ic_launcher", // Required
        large_icon: "ic_launcher",
        play_sound: true,
        sound_name: "super_ringtone", // Plays custom notification ringtone if sound_name: null
        color: "red",
        schedule_once: true, // Works with ReactNativeAN.scheduleAlarm so alarm fires once
        tag: "some_tag",
        // fire_date: "24-07-2018 21:32:00" // Date for firing alarm, Required for ReactNativeAN.scheduleAlarm. Format: dd-MM-yyyy HH:mm:ss
        fire_date: wakeUpMoment.format("DD-MM-YYYY HH:mm:SS") // Date for firing alarm, Required for ReactNativeAN.scheduleAlarm. Format: dd-MM-yyyy HH:mm:ss
    };

    ReactNativeAN.scheduleAlarm(alarmNotifData);
};
