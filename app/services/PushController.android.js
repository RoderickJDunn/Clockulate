import PushNotification from "react-native-push-notification";
import Colors from "../styles/colors";
import realm from "../data/DataSchemas";
import { SOUND_TYPES, ALARM_STATES } from "../data/constants";
import moment from "moment";
import { AppRegistry } from "react-native";

let FAKE_CATEGORY = "MyFakeCategory";

let reloadAlarmsList = null;

// export function PushNotificationConfigure() {
//     console.log("configuring notifications *************");
//     PushNotification.configure({
//         options: {
//             onNotification: notification => {
//                 console.log("notification", notification);
//             }
//         }
//     });
// }

const notificationActionHandler = async actionData => {
    console.log("Notification action received: " + JSON.stringify(actionData));
    // const info = JSON.parse(action);
    const info = actionData.notification;
    console.log("info", info);
    if (info.action == "snooze") {
        // Do work pertaining to Accept action here
        snoozeAlarm(info, reloadAlarmsList);
    } else if (info.action == "turnoff") {
        // Do work pertaining to Reject action here
        clearAlarm(null, info.id, reloadAlarmsList);
    }
};

AppRegistry.registerHeadlessTask(
    "RNPushNotificationActionHandlerTask", // you must use the same name
    () => {
        return notificationActionHandler;
    }
);

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
            `Found more than 1 alarm (${alarms.length})  with notificationID ${notificationId}`
        );
        return null;
    }
}

export let snoozeAlarm = (notificationInfo, reloadAlarmsList) => {
    console.log("snoozeAlarm");
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
            alarm.status = ALARM_STATES.SNOOZED;
        });

        console.log("upped snooze count");
        // console.log("alarm.snoozeCount", alarm.snoozeCount);

        if (reloadAlarmsList) {
            console.log("reloading alarms list");
            reloadAlarmsList();
        } else {
            console.error("reloadingAlarms callback is null!!!!");
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
        cancelInAppAlarm(alarm);
        realm.write(() => {
            alarm.notificationId = null;
            alarm.snoozeCount = 0;
            alarm.status = ALARM_STATES.OFF;
        });
    }

    console.log("alarm", alarm);

    // PushNotification.cancelAllLocalNotifications();

    // Reload AlarmsList ... (in case we got the notification while app is open)
    if (reloadAlarmsList) {
        reloadAlarmsList();
    }
};

export let cancelAllNotifications = () => {};

export let resumeAlarm = (alarm, reload, alarmDidInitialize) => {
    // The notification has already been set. We need to set the inApp timer only
    setInAppAlarm(alarm, reload);
};

export let scheduleAlarm = (alarm, reload, alarmDidInitialize) => {
    console.log(
        "scheduleAlarm for (rn-push-notification lib): " + alarm.wakeUpTime
    );

    reloadAlarmsList = reload;
    // let in30Sec = new Date(Date.now() + 30 * 1000);
    // console.log("scheduleAlarm for (rn-push-notification lib): " + in30Sec);

    // TODO: MAKE SURE WE ARE NOT SETTING NOTIF FOR AN ALREADY-ENABLED ALARM
    ///     This function is called when app comes into foreground, and when

    let notifId = alarmUUID_to_notificationID(alarm.id);
    console.log("alarmId", alarm.id);
    console.log("Setting notification ID", notifId);

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

    let snoozeTime = alarm.snoozeTime * 60 * 1000;
    // DEV:
    // if (__DEV__) {
    //     snoozeTime = 60 * 1000;
    // }
    setInAppAlarm(alarm, reloadAlarmsList);
    // console.log("notifId", notifId);

    console.log("soundFile", soundFile);
    console.log("snoozeTime", snoozeTime);

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
        actions: [
            { id: "snooze", text: "Snooze" },
            { id: "turnoff", text: "Turn Off" }
        ]
    });

    alarmDidInitialize();
};

export let setInAppAlarm = (alarm, reloadAlarmsList) => {
    console.log("setInAppAlarm");

    if (alarm) {
        console.log("setInAppAlarm", alarm.wakeUpTime);
        console.log("snoozeCount", alarm.snoozeCount);
        console.log("status", alarm.status);
    }

    // calculate time until alarm
    let now = new Date();

    let msUntilAlarm = alarm.wakeUpTime - now;
    console.log("msUntilAlarm", msUntilAlarm);

    /* if alarm has been snoozed at least once, we need to adjust the in-app alarm time accordingly
     (also taking into account snooze-time setting)
     */
    if (alarm.snoozeCount != null && alarm.snoozeCount > 0) {
        console.log("This is a snooze...");
        let minutesToAdd = alarm.snoozeCount * 1;
        let inAppNotifTime = moment(alarm.wakeUpTime).add(
            minutesToAdd,
            "minute"
        );
        msUntilAlarm = inAppNotifTime.toDate() - now;
    } else if (msUntilAlarm < 0) {
        // This is the first time this alarm has triggered (not a snooze), but the alarmTime was calculated to be in the past.
        // Add 1 day
        let inAppNotifTime = moment(alarm.wakeUpTime).add(1, "day");
        msUntilAlarm = inAppNotifTime.toDate() - now;
    }

    console.log("msUntilAlarm", msUntilAlarm);

    // NOTE: I'm using a modified version of setTimeout (and setInterval), that handle
    //        long times differently (avoids warning on Android). As a result, these functions
    //        will return a string "_lt_<id>" instead of an integer if the timer is long. Because of
    //        this, it cannot be saved in realm this property was setup to be an int. I am therefore
    //        deconstructing the string to get the ID. And when canceling I need to do the opposite
    let timeoutId = setTimeout(() => {
        console.log("Alarm went off while app is open!");

        realm.write(() => {
            alarm.status = ALARM_STATES.RINGING;
        });
        reloadAlarmsList();
    }, msUntilAlarm);

    // hackery to convert the returned "long-timer ID" from a string to a negative integer
    //  for storage in realm
    console.log("timeoutId", timeoutId);
    timeoutId = timeoutId.replace("_lt_", "-");
    console.log("modded timeoutId", timeoutId);

    if (typeof timeoutId === "string") {
        timeoutId = parseInt(timeoutId, 10);
    }

    realm.write(() => {
        alarm.timeoutId = timeoutId;
    });
};

export let cancelInAppAlarm = alarm => {
    if (alarm && alarm.timeoutId) {
        // converting the negative int (stored in realm) back to a long-timer ID string
        let packgedTimeoutId = alarm.timeoutId;
        if (packgedTimeoutId < 0) {
            packgedTimeoutId = "_lt_" + Math.abs(packgedTimeoutId);
        }

        clearTimeout(packgedTimeoutId);
        realm.write(() => {
            alarm.timeoutId = null;
        });
    }
};

export let checkForImplicitSnooze = (alarm, mNow) => {
    let mWakeupTime = moment(alarm.wakeUpTime);

    let secondsDiff = (mNow - mWakeupTime) / 1000;
    console.log("secondsDiff", secondsDiff);

    // sanity check. secondsDiff should always be positive.
    if (secondsDiff < 0) {
        console.error(
            "checkForImplicitSnooze: ",
            `secondsDiff should always be positive, but now=${mNow} and wakeUpTime=${mWakeupTime}`
        );
    }

    // let almSnoozeTime = alarm.snoozeTime * 60; // convert snoozeTime to seconds
    let almSnoozeTime = alarm.snoozeTime * 60; // convert snoozeTime to seconds DEV: Change 1 to alarm.snoozeTime
    console.log("almSnoozeTime", almSnoozeTime);

    let expectedSnoozeCount = Math.ceil(secondsDiff / almSnoozeTime);
    console.log("expectedSnoozeCount", expectedSnoozeCount);

    if (alarm.snoozeCount == null || alarm.snoozeCount < expectedSnoozeCount) {
        // user did not explicitly snooze for x number of notifications.
        realm.write(() => {
            alarm.snoozeCount = expectedSnoozeCount;
            alarm.status = ALARM_STATES.SNOOZED;
        });
    } else if (alarm.snoozeCount == expectedSnoozeCount) {
        console.log("Got expected value for snoozeCount", expectedSnoozeCount);
    } else {
        // sanity check. Should never happen.
        console.error(
            "Expected snoozeCount was LOWER than actual snoozecount",
            `Expected: ${expectedSnoozeCount} | Actual: ${alarm.snoozeCount}`
        );
    }
};
