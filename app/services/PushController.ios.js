import { Alert, NativeModules, NativeEventEmitter } from "react-native";
import NotificationsIOS, {
    NotificationAction,
    NotificationCategory
} from "react-native-notifications";
import { PushNotificationIOS, AsyncStorage } from "react-native";
import moment from "moment";
import Sound from "react-native-sound";
import RNFS from "react-native-fs";

import { SOUND_TYPES, ALARM_STATES } from "../data/constants";
import realm from "../data/DataSchemas";
import { DisturbanceModel, AlarmInstance } from "../data/models";
import Settings from "../config/settings";

// console.log(NativeModules.AlarmAudioService);

// let initNativeAlarm = () => {
//     console.log("Fake initNativeAlarm");
// };
// let snoozeNative = () => {
//     console.log("Fake snoozeNative");
// };
// let turnOffNative = () => {
//     console.log("Fake turnOffNative");
// };

let {
    initializeAlarm: initNativeAlarm,
    snoozeAlarm: snoozeNative,
    turnOffAlarm: turnOffNative
} = NativeModules.AlarmAudioService;

const NoiseDetectionEvents = new NativeEventEmitter(
    NativeModules.AlarmAudioService
);

let initializeAlarm = (alarm, alarmDidInitialize) => {
    console.log("sending time: ", alarm.wakeUpTime.toISOString());

    initNativeAlarm(
        {
            time: alarm.wakeUpTime.toISOString(),
            sound: alarm.sound,
            instId: alarm.instId
        },
        { recCooldown: Settings.recCooldown() },
        err => {
            console.log("didInitializeAlarm?: ", err ? false : true);
            alarmDidInitialize();
        }
    );
};

NoiseDetectionEvents.addListener("onNoiseDetected", info => {
    console.log("JS Got NOISE_DETECTED EVT. info:", info);

    // TODO: Add disturbance/recording in context of current active Alarm instance
    // TODO: Handle intializing/completing AlarmInstances when Alarms are enabled, triggered/disabled
    // TODO: Handle deleting AlarmInstances if Alarm span is too short

    /*  TODO:
        1. Fetch currently active AlarmInstance (will only have start property, end will be null)
        2. Create disturbance, then add it to this current AlarmInstance
    */

    let almInsts = realm.objects("AlarmInstance").sorted("start", true);
    let currAlmInst = almInsts
        ? almInsts.length > 0
            ? almInsts[0]
            : null
        : null;

    if (currAlmInst == null) {
        console.error(
            "No active alarm instance found on noise detected event."
        );
        return;
    }

    // Save disturbance + filepath (if present) to DB
    let newDisturbance = new DisturbanceModel();
    realm.write(() => {
        let dt = new Date(info.timestamp);
        newDisturbance.time = dt;
        newDisturbance.recording = info.file;
        newDisturbance.duration = info.duration;
        let distDBO = realm.create("SleepDisturbance", newDisturbance);
        currAlmInst.disturbances.push(distDBO);
    });

    console.log("added new disturbance: ");
    console.log(newDisturbance);
});

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
                let snoozeTime = currAlarm.snoozeTime;
                if (__DEV__) {
                    snoozeTime = 0.25;
                }
                snoozeNative(snoozeTime);

                realm.write(() => {
                    if (currAlarm.snoozeCount == null) {
                        currAlarm.snoozeCount = 1;
                    } else {
                        currAlarm.snoozeCount += 1;
                    }

                    currAlarm.status = ALARM_STATES.SNOOZED;
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

        turnOffNative();
        try {
            let { _data } = action.notification;
            console.log(
                "Got data. Canceling local notifications for this alarm id",
                _data
            );
            PushNotificationIOS.cancelLocalNotifications(_data);

            let currAlarm = realm.objectForPrimaryKey("Alarm", _data.alarmId);
            if (currAlarm) {
                realm.write(() => {
                    currAlarm.status = ALARM_STATES.OFF;
                    currAlarm.snoozeCount = 0;
                });
            }

            setAlarmInstEnd();
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

export let scheduleAlarm = (alarm, reloadAlarmsList, alarmDidInitialize) => {
    console.log("scheduleAlarm");
    let wakeUpMoment = moment(alarm.wakeUpTime);

    /* Make sure there are no System or In-App notifications already set for this alarm 
        Passing in 'false' as third param to 'clearAlarm' means this function will leave this Alarm set to 'enabled' == SET in DB
    */
    clearAlarm(alarm, null, false);

    // Determine the sound file to use (30s version for system notification)
    let shortSoundFile = "";
    let longSoundFile = "";
    let filesLen = alarm.alarmSound.sound.files.length;
    // console.log("filesLen", filesLen);
    // console.log("alarm.alarmSound", alarm.alarmSound);
    if (alarm.alarmSound.type == SOUND_TYPES.RANDOM) {
        /* Get all 'normal' Sounds (not Silent or Random) */
        let allSounds = realm
            .objects("Sound")
            .filtered("type = $0", SOUND_TYPES.NORMAL);

        /* randomly select any 'Sound' that is not "Vibrate Only" and not "Random"  */
        let randomSound =
            allSounds[Math.floor(Math.random() * allSounds.length)];
        shortSoundFile = randomSound.files[0]; // this selects the first file in the file array which should be the short version
        longSoundFile = randomSound.files[randomSound.files.length - 1]; // this selects the last file in the file array which should be the long version (might be the same)
        realm.write(() => {
            alarm.alarmSound.sound = randomSound;
        });
    } else if (alarm.alarmSound.type == SOUND_TYPES.NORMAL) {
        shortSoundFile = alarm.alarmSound.sound.files[0]; // this selects the first file in the file array which should be the short version
        longSoundFile = alarm.alarmSound.sound.files[filesLen - 1]; // this selects the last file in the file array which should be the long version (might be the same)
    } else if (alarm.alarmSound.type == SOUND_TYPES.SILENT) {
        shortSoundFile = "";
        longSoundFile = "";
    } else if (alarm.alarmSound.type == SOUND_TYPES.RANDOM_SUBSET) {
        // TODO: This functionality will be a premium feature
    }

    let currAlmInst;
    // create AlarmInstance with start date of now, and empty End date, and empty disturbance list
    realm.write(() => {
        currAlmInst = new AlarmInstance();
        realm.create("AlarmInstance", currAlmInst);
    });

    console.log("currAlmInst", currAlmInst);

    let allDists = realm
        .objects("SleepDisturbance")
        .filtered("recording != null AND recording != ''");

    console.log("allDists with recordings count", allDists.length);

    if (allDists.length > Settings.maxRecs()) {
        console.log("allDists with recordings count", allDists.length);

        let allAIs = realm.objects("AlarmInstance").sorted("start");

        let deleteRecsCount = allDists.length - Settings.maxRecs();
        let dirsToDelete = [];
        let indivRecsToDelete = [];

        console.log("Recs to delete:", deleteRecsCount);

        /* Loop through AI recording directories, and delete recordings until total rec count is reduced to Max allowed
            The idea here is loop through all AlmInsts, accumulate a list of directories to delete (and associated DB disturbances),
            as well as a list of individual recording file paths to delete (each associated with a DB disturbance). Then using
            the 2 accumulated lists, run the async code that deletes each directory and file. In the promise callbacks, I then
            set the associated DB Distrubance.recording to "". On promise rejection, I should probably set the recording string
            to "" anyway, since the promise likely failed because the file doesn't exist.
        */
        for (let i = 0; i < allAIs.length; i++) {
            if (deleteRecsCount <= 0) {
                break;
            }

            let almInst = allAIs[i];
            // Gets a list of disturbances for this AlmInst sorted oldest-newest, only those that have valid recordings.
            let recs = almInst.disturbances
                .sorted("time")
                .filtered("recording != null AND recording != ''");

            if (recs.length == 0) {
                // no recordings to delete for this Alarm Instance. Continue to next AlmInst
                continue;
            } else if (recs.length <= deleteRecsCount) {
                // delete all recs for this instance...
                var path = RNFS.DocumentDirectoryPath + "/" + almInst.id;
                console.log("path", path);
                // console.log(
                //     `Deleting all recordings ${
                //         recs.length
                //     } for AlarmInstance w/ start time:`,
                //     almInst.start
                // );

                let recsCopy = recs.snapshot();

                realm.write(() => {
                    recsCopy.forEach(dist => {
                        dist.recording = "";
                    });
                });

                RNFS.unlink(path).then(() => {
                    console.log(
                        `Directory deleted for alarmInst ${
                            almInst.start
                        } (path: ${path})`
                    );
                });

                // dirsToDelete.push(deletionInfo);
                deleteRecsCount -= recsCopy.length;
            } else {
                // Remove the most recent recordings from the array such that exactly 'deleteRecsCount' are leftover
                let recsToDelete = recs.snapshot().slice(0, deleteRecsCount); // remove (in-place) from index "numRecsToKeep" to end of array.
                // recs should now contain only items that should be deleted

                let almInstPath =
                    RNFS.DocumentDirectoryPath + "/" + almInst.id + "/";

                realm.write(() => {
                    recsToDelete.forEach(rec => {
                        let path = almInstPath + rec.recording;
                        rec.recording = "";
                        RNFS.unlink(path).then(() => {
                            console.log(
                                `Rec file deleted for alarmInst ${
                                    almInst.start
                                } (path: ${path})`
                            );
                        });
                    });
                });

                deleteRecsCount -= recsToDelete.length;
            }

            console.log("Number of recs still to delete", deleteRecsCount);
        }

        console.log("dirsToDelete", dirsToDelete);
        console.log("indivRecsToDelete", indivRecsToDelete);
    }

    initializeAlarm(
        {
            wakeUpTime: alarm.wakeUpTime,
            sound: longSoundFile.slice(0, -4),
            instId: currAlmInst.id
        },
        alarmDidInitialize
    );

    // return;

    setInAppAlarm(alarm, reloadAlarmsList, longSoundFile);

    // schedule notifications for this Alarm, staggering them by the "SNOOZE Time"

    // For now, use a constant 15 sec as a Snooze Time for testing
    let snoozeTime = 60;
    // if (__DEV__) {
    //     snoozeTime = 15;
    // }
    let notiCount = 10;
    for (let i = 0; i < notiCount; i++) {
        NotificationsIOS.localNotification({
            alertBody: alarm.label,
            alertTitle: "Clockulate",
            alertAction: "Click here to open",
            soundName: shortSoundFile,
            silent: shortSoundFile == "" ? true : false,
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
    // if (alarm) {
    //     console.log("clearAlarm", alarm.wakeUpTime);
    //     console.log("snoozeCount", alarm.snoozeCount);
    //     console.log("status", alarm.status);
    // }

    PushNotificationIOS.cancelLocalNotifications({ alarmId: alarm.id });

    if (!alarm) {
        alarm = realm.objectForPrimaryKey("Alarm", notificationId);
    }
    if (alarm) {
        realm.write(() => {
            if (disableAlarm) {
                alarm.status = ALARM_STATES.OFF;
                turnOffNative();
                setAlarmInstEnd(); // set end time of active AlarmInstance
            }
            alarm.snoozeCount = 0;
        });
        cancelInAppAlarm(alarm);
    }
};

let onInAppSnoozePressed = (alarm, reloadAlarmsList, sound, soundFile) => {
    console.log("onInAppSnoozePressed");

    if (sound) {
        sound.stop();
        sound.release();
    }

    snoozeNative(alarm.snoozeTime);

    realm.write(() => {
        if (alarm.snoozeCount == null) {
            alarm.snoozeCount = 1;
        } else {
            alarm.snoozeCount += 1;
        }

        alarm.status = ALARM_STATES.SNOOZED;
    });

    setInAppAlarm(alarm, reloadAlarmsList, soundFile);

    reloadAlarmsList();
};

let setAlarmInstEnd = () => {
    // Fetch current AlarmInstance and set its 'end' datetime to now.
    let almInsts = realm.objects("AlarmInstance").sorted("start", true);
    let currAlmInst = almInsts
        ? almInsts.length > 0
            ? almInsts[0]
            : null
        : null;

    if (currAlmInst != null) {
        // store running averages of sleep
        // Async: totalSleepEver, totalSleepThisYear, totalSleepThisMonth, totalSleepThisWeek
        try {
            AsyncStorage.getItem("totalSleepEver").then(value => {
                console.log("First Launch");
                AsyncStorage.setItem("alreadyLaunched", JSON.stringify(true));
            });
        } catch (error) {
            console.error(
                `Unable to check if app has already been launched: ${error}`
            );
        }

        if (realm.isInTransaction) {
            currAlmInst.end = new Date();
        } else {
            realm.write(() => {
                currAlmInst.end = new Date();
            });
        }
    } else {
        console.error("No active alarm instance found on Alarm trigger");
    }
};

let onInAppTurnOffPressed = (alarm, reloadAlarmsList, sound) => {
    console.log("onInAppTurnOffPressed");

    if (sound) {
        sound.stop();
        sound.release();
    }

    clearAlarm(alarm);

    /* TODO: Test that app doesn't crash here if this function isn't called on another screen (not AlarmsList)*/
    reloadAlarmsList();
};

export let setInAppAlarm = (alarm, reloadAlarmsList, soundFile) => {
    console.log("setInAppAlarm");

    if (alarm) {
        console.log("setInAppAlarm", alarm.wakeUpTime);
        console.log("snoozeCount", alarm.snoozeCount);
        console.log("status", alarm.status);
    }
    if (soundFile == null) {
        let filesLen = alarm.alarmSound.sound.files.length;
        soundFile = alarm.alarmSound.sound.files[filesLen - 1];
    }
    console.log("soundFile", soundFile);

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
        let minutesToAdd = alarm.snoozeCount * 1; // FIXME: Make this '10' before alpha release. '10' is the hard-coded snooze time for now...
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

        realm.write(() => {
            alarm.status = ALARM_STATES.RINGING;
        });
        reloadAlarmsList();

        setAlarmInstEnd();

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
                        null,
                        soundFile
                    )
                },
                {
                    text: "Turn Off",
                    onPress: onInAppTurnOffPressed.bind(
                        this,
                        alarm,
                        reloadAlarmsList,
                        null
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
    let almSnoozeTime = 1 * 60; // convert snoozeTime to seconds TODO: Change 1 to alarm.snoozeTime
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

export let snoozeAlarm = () => {};
