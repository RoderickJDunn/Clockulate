import { Platform } from "react-native";
import NotificationsIOS, {
    NotificationAction,
    NotificationCategory
} from "react-native-notifications";
import { PushNotificationIOS } from "react-native";
import moment from "moment";

let snoozeAction = new NotificationAction(
    {
        activationMode: "background",
        title: "Snooze",
        identifier: "SNOOZE_ACTION"
    },
    (action, completed) => {
        NotificationsIOS.log("SNOOZE RECEIVED");
        NotificationsIOS.log(JSON.stringify(action));

        // this.lastNotificationId = NotificationsIOS.localNotification({
        //     alertBody: "Snoozed body message",
        //     alertTitle: "Clockulate",
        //     alertAction: "Click here to open",
        //     soundName: "sci-fi-alarm.mp3",
        //     // silent: true,
        //     category: "ALARM_CATEGORY",
        //     // fireDate: wakeUpDate.toDate()
        //     fireDate: new Date(Date.now() + 10 * 1000).toISOString()
        // });
        completed();
        // NotificationsIOS.localNotification({
        //     alertBody: "Set from callback",
        //     alertTitle: "Clockulate",
        //     alertAction: "Click here to open",
        //     soundName: "super_ringtone.mp3",
        //     // silent: true,
        //     category: "ALARM_CATEGORY",
        //     // fireDate: wakeUpDate.toDate()
        //     fireDate: new Date(Date.now() + 10 * 1000).toISOString()
        // });
    }
);

let disableAction = new NotificationAction(
    {
        activationMode: "background",
        title: "Turn Off",
        behavior: "default",
        identifier: "DISABLE_ACTION"
    },
    (action, completed) => {
        console.log("ACTION RECEIVED");
        console.log(action);
        try {
            let { _data } = action.notification;
            console.log(
                "Got data. Canceling local notifications for this alarm id",
                _data
            );
            PushNotificationIOS.cancelLocalNotifications(_data);
            console.log("done");
        } catch (e) {
            console.log("Error: ", e);
        }
        // console.log(lastNotificationIds);
        // lastNotificationIds.forEach(notifId => {
        //     NotificationsIOS.cancelLocalNotification(notifId);
        // });
        completed();
    }
);

export let clearAlarm = (alarm, notificationId) => {
    PushNotificationIOS.cancelLocalNotifications({ alarmId: alarm.id });
};

export const ALARM_CAT = new NotificationCategory({
    identifier: "ALARM_CATEGORY",
    actions: [snoozeAction, disableAction],
    context: "default"
});

export let scheduleAlarm = alarm => {
    let wakeUpMoment = moment(alarm.wakeUpTime);

    // schedule notifications for this Alarm, staggering them by the "SNOOZE Time"
    // NOTE: "Snooze Time" will likely be changable option for users per Alarm.
    //         TODO: Add "snoozePeriod" as a property to Alarm entity in database
    //         TODO: Add UI and functionality to set a Snooze time from AlarmDetail screen (menu maybe?)

    // For now, use a constant 1 minute as a Snooze Time for testing
    let snoozeTime = 60;
    let notiCount = 10;
    for (let i = 0; i < notiCount; i++) {
        NotificationsIOS.localNotification({
            alertBody: alarm.label,
            alertTitle: "Clockulate",
            alertAction: "Click here to open",
            soundName: alarm.sound,
            // silent: true,
            category: "ALARM_CATEGORY",
            fireDate: wakeUpMoment.toDate(),
            // fireDate: new Date(Date.now() + 10 * 1000).toISOString(),
            userInfo: { alarmId: alarm.id }
        });
        wakeUpMoment.add(snoozeTime, "s");
    }
};
