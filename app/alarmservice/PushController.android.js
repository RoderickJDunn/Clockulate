// import ReactNativeAN from "react-native-alarm-notification";

import PushNotification from "react-native-push-notification";
import Colors from "../styles/colors";
import realm from "../data/DataSchemas";

let FAKE_CATEGORY = "MyFakeCategory";

function alarmUUID_to_notificationID(alarmId) {
    let notifId = alarmId.replace(/[^[0-9]/g, "");
    return notifId.substring(0, 9);
}

export let clearAlarm = (alarm, notificationID) => {
    if (alarm != null) {
        notificationID = alarm.notificationId;
    }

    console.log("Clearing notification ID", notificationID);
    PushNotification.cancelLocalNotifications({
        id: notificationID
    });

    if (alarm) {
        realm.write(() => {
            alarm.notificationId = null;
        });
    }

    console.log("alarm", alarm);

    PushNotification.clearAllNotifications();
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
    let snoozeTime = 60 * 1000; // in milliseconds
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
        playSound: true,
        soundName: "super_ringtone.mp3", // Plays custom notification ringtone if sound_name: null
        color: Colors.brandLightPurple,
        // tag: "some_tag",
        date: alarm.wakeUpTime,
        // date: new Date(Date.now() + 30 * 1000),
        repeatType: "time",
        repeatTime: snoozeTime,
        actions: '["Snooze", "Turn Off"]'
    });
};
