import { Alert } from "react-native";
import NotificationsIOS, {
    NotificationAction,
    NotificationCategory
} from "react-native-notifications";
import { PushNotificationIOS } from "react-native";
import moment from "moment";
import Sound from "react-native-sound";

import realm from "../data/DataSchemas";

let snoozeAction = new NotificationAction(
    {
        activationMode: "background",
        title: "Snooze",
        identifier: "SNOOZE_ACTION"
    },
    (action, completed) => {
        NotificationsIOS.log("SNOOZE RECEIVED");
        NotificationsIOS.log(JSON.stringify(action));

        try {
            let { _data } = action.notification;

            let currAlarm = realm.objectForPrimaryKey("Alarm", _data.alarmId);
            if (currAlarm) {
                realm.write(() => {
                    if (currAlarm.snoozeCount == null) {
                        currAlarm.snoozeCount = 1;
                    } else {
                        currAlarm.snoozeCount += 1;
                    }
                });
            }
        } catch (e) {
            console.log("Error: ", e);
        }
        completed();
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

            let currAlarm = realm.objectForPrimaryKey("Alarm", _data.alarmId);
            if (currAlarm) {
                realm.write(() => {
                    currAlarm.enabled = false;
                    currAlarm.snoozeCount = 0;
                });
            }
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

export let scheduleAlarm = (alarm, reloadAlarmsList) => {
    console.log("scheduleAlarm");
    let wakeUpMoment = moment(alarm.wakeUpTime);

    /* Make sure there are no System or In-App notifications already set for this alarm 
        Passing in 'false' as third param to 'clearAlarm' means this function will leave this Alarm set to 'enabled'
    */
    clearAlarm(alarm, null, false);

    setInAppAlarm(alarm, reloadAlarmsList);

    // schedule notifications for this Alarm, staggering them by the "SNOOZE Time"
    // NOTE: "Snooze Time" will likely be changable option for users per Alarm.
    //         TODO: Add "snoozePeriod" as a property to Alarm entity in database
    //         TODO: Add UI and functionality to set a Snooze time from AlarmDetail screen (menu maybe?)

    // For now, use a constant 15 sec as a Snooze Time for testing
    let snoozeTime = 15; // FIXME: Before 'releasing' v1.0-alpha, change to 600.
    let notiCount = 10;
    for (let i = 0; i < notiCount; i++) {
        NotificationsIOS.localNotification({
            alertBody: alarm.label,
            alertTitle: "Clockulate",
            alertAction: "Click here to open",
            soundName: alarm.sound,
            silent: alarm.sound == "" ? true : false,
            category: "ALARM_CATEGORY",
            fireDate: wakeUpMoment.toDate(),
            // fireDate: new Date(Date.now() + 10 * 1000).toISOString(),
            userInfo: { alarmId: alarm.id }
        });
        wakeUpMoment.add(snoozeTime, "s");
    }
};

/* Cancels Notifications and In-App Notification for this alarm
    Also resets the snoozeCount of the alarm and sets the alarm to disabled
*/
export let clearAlarm = (alarm, notificationId, disableAlarm = true) => {
    if (alarm) {
        console.log("clearAlarm", alarm.wakeUpTime);
        console.log("snoozeCount", alarm.snoozeCount);
        console.log("enabled", alarm.enabled);
    }

    PushNotificationIOS.cancelLocalNotifications({ alarmId: alarm.id });

    if (!alarm) {
        alarm = realm.objectForPrimaryKey("Alarm", notificationId);
    }
    if (alarm) {
        realm.write(() => {
            if (disableAlarm) {
                alarm.enabled = false;
            }
            alarm.snoozeCount = 0;
        });
        cancelInAppAlarm(alarm);
    }
};

let onInAppSnoozePressed = (alarm, reloadAlarmsList, sound) => {
    console.log("onInAppSnoozePressed");

    sound.stop();
    sound.release();

    realm.write(() => {
        if (alarm.snoozeCount == null) {
            alarm.snoozeCount = 1;
        } else {
            alarm.snoozeCount += 1;
        }
    });

    setInAppAlarm(alarm, reloadAlarmsList);

    reloadAlarmsList();
};

let onInAppTurnOffPressed = (alarm, reloadAlarmsList, sound) => {
    console.log("onInAppTurnOffPressed");

    sound.stop();
    sound.release();

    clearAlarm(alarm);

    /* TODO: Test that app doesn't crash here if this function isn't called on another screen (not AlarmsList)*/
    reloadAlarmsList();
};

export let setInAppAlarm = (alarm, reloadAlarmsList) => {
    console.log("setInAppAlarm");

    if (alarm) {
        console.log("setInAppAlarm", alarm.wakeUpTime);
        console.log("snoozeCount", alarm.snoozeCount);
        console.log("enabled", alarm.enabled);
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
        // For now use 0.25 minutes as the snooze time (15 sec) for dev/testing
        let minutesToAdd = alarm.snoozeCount * 0.25; // FIXME: Make this '10' before alpha release. '10' is the hard-coded snooze time for now...
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

    let timeoutId = setTimeout(() => {
        console.log("Alarm went off while app is open!");

        /* Start sound playback */
        var sound = new Sound(alarm.sound, Sound.MAIN_BUNDLE, error => {
            if (error) {
                console.log("failed to load the sound", error);
                return;
            }
            // loaded successfully
            console.log(
                "duration in seconds: " +
                    sound.getDuration() +
                    "number of channels: " +
                    sound.getNumberOfChannels()
            );
            sound.play(success => {
                if (success) {
                    console.log("successfully finished playing");
                } else {
                    console.log("playback failed due to audio decoding errors");
                    // reset the player to its uninitialized state (android only)
                    // this is the only option to recover after an error occured and use the player again
                    sound.reset();
                }
                sound.release();
            });
        });

        Alert.alert(
            "!!!",
            alarm.label,
            [
                {
                    text: "Snooze",
                    onPress: onInAppSnoozePressed.bind(
                        this,
                        alarm,
                        reloadAlarmsList,
                        sound
                    )
                },
                {
                    text: "Turn Off",
                    onPress: onInAppTurnOffPressed.bind(
                        this,
                        alarm,
                        reloadAlarmsList,
                        sound
                    )
                }
                // { text: "OK", onPress: () => console.log("OK Pressed") }
            ],
            { cancelable: false }
        );
    }, msUntilAlarm);

    realm.write(() => {
        alarm.timeoutId = timeoutId;
    });
};

export let cancelInAppAlarm = alarm => {
    if (alarm && alarm.timeoutId) {
        clearTimeout(alarm.timeoutId);
        realm.write(() => {
            alarm.timeoutId = null;
        });
    }
};
