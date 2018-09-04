// import ReactNativeAN from "react-native-alarm-notification";

import PushNotification from "react-native-push-notification";
import Colors from "../styles/colors";
import realm from "../data/DataSchemas";
import { SOUND_TYPES } from "../data/constants";

let FAKE_CATEGORY = "MyFakeCategory";

// export function configure() {
//     console.log("configuring notifications *************");
//     PushNotification.configure({
//         options: {
//             onNotification: notification => {
//                 console.log("notification", notification);
//             }
//         }
//     });
// }

function alarmUUID_to_notificationID(alarmId) {
    let notifId = alarmId.replace(/[^[0-9]/g, "");
    return notifId.substring(0, 9);
}

function fetchAlarmByNotifId(notificationId) {
    let alarms = realm
        .objects("Alarm")
        .filtered("notificationId = $0", notificationId);

    if (alarms.length == 1) {
        return alarms[0];
    } else if (alarms.length == 0) {
        console.warn(`No alarms found with notificationID ${notificationId}`);
        return null;
    } else {
        console.warn(
            `Found more than 1 alarm (${
                alarms.length
            })  with notificationID ${notificationId}`
        );
        return null;
    }
}

export let snoozeAlarm = (notificationInfo, reloadAlarmsList) => {
    let alarm = fetchAlarmByNotifId(notificationInfo.id);

    if (!alarm) {
        clearAlarm(null, notificationInfo.id, reloadAlarmsList);
    } else {
        realm.write(() => {
            if (alarm.snoozeCount == null) {
                alarm.snoozeCount = 1;
            } else {
                alarm.snoozeCount += 1;
            }
        });

        if (reloadAlarmsList) {
            reloadAlarmsList();
        }
    }
};

export let clearAlarm = (alarm, notificationID, reloadAlarmsList) => {
    if (alarm != null) {
        notificationID = alarm.notificationId;
    } else {
        alarm = fetchAlarmByNotifId(notificationID);
    }

    console.log("Clearing notification ID", notificationID);
    PushNotification.cancelLocalNotifications({
        id: notificationID
    });

    if (alarm) {
        realm.write(() => {
            alarm.notificationId = null;
            alarm.snoozeCount = 0;
            alarm.enabled = false;
        });
    }

    console.log("alarm", alarm);

    PushNotification.clearAllNotifications();

    // Reload AlarmsList ... (in case we got the notification while app is open)
    if (reloadAlarmsList) {
        reloadAlarmsList();
    }
};

export let scheduleAlarm = alarm => {
    console.log(
        "scheduleAlarm for (rn-push-notification lib): " + alarm.wakeUpTime
    );
    // let in30Sec = new Date(Date.now() + 30 * 1000);

    // console.log("scheduleAlarm for (rn-push-notification lib): " + in30Sec);

    let notifId = alarmUUID_to_notificationID(alarm.id);
    console.log("alarmId", alarm.id);
    console.log("notifId", notifId);

    realm.write(() => {
        alarm.notificationId = notifId;
    });

    let soundFile = "";
    let filesLen = alarm.alarmSound.sound.files.length;
    if (alarm.alarmSound.type == SOUND_TYPES.NORMAL) {
        soundFile = alarm.alarmSound.sound.files[filesLen - 1]; // this selects the last file in the file array (should be the FULL version if it exists)
    } else if (alarm.alarmSound.type == SOUND_TYPES.SILENT) {
        soundFile = "";
    } else if (alarm.alarmSound.type == SOUND_TYPES.RANDOM) {
        let allSounds = realm
            .objects("Sound")
            .filtered("type = $0", SOUND_TYPES.NORMAL);
        let randomSound =
            allSounds[Math.floor(Math.random() * allSounds.length)];
        soundFile = randomSound.files[randomSound.files.length - 1];
    } else if (alarm.alarmSound.type == SOUND_TYPES.RANDOM_SUBSET) {
        // TODO: This functionality will be a premium feature
    }

    let snoozeTime = 600 * 1000;
    if (__DEV__) {
        snoozeTime = 15 * 1000;
    }
    // let snoozeTime = 600 * 1000; // in milliseconds
    // for (let i = 1; i <= notiCount; i++) {
    PushNotification.localNotificationSchedule({
        id: notifId,
        title: "Clockulate", // Required
        message: alarm.label, // Required
        ticker: alarm.label,
        autoCancel: false, // default: true
        vibrate: true,
        vibration: 100, // default: 100, no vibration if vibrate: false
        smallIcon: "icon.png", // Required
        largeIcon: "icon.png",
        playSound: soundFile == "" ? false : true,
        soundName: soundFile, // Plays custom notification ringtone if sound_name: null
        color: Colors.brandLightPurple,
        // tag: "some_tag",
        date: alarm.wakeUpTime,
        // date: new Date(Date.now() + 30 * 1000),
        repeatType: "time",
        repeatTime: snoozeTime,
        actions: '["Snooze", "Turn Off"]'
    });
};

export let cancelInAppAlarm = () => {};
export let setInAppAlarm = () => {};
