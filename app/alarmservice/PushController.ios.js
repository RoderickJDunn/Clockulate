import { Platform } from "react-native";
import NotificationsIOS, {
    NotificationAction,
    NotificationCategory
} from "react-native-notifications";
import { PushNotificationIOS } from "react-native";

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

export const ALARM_CAT = new NotificationCategory({
    identifier: "ALARM_CATEGORY",
    actions: [snoozeAction, disableAction],
    context: "default"
});
