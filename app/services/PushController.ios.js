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
import Upgrades from "../config/upgrades";

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

const AlarmTriggerEvents = new NativeEventEmitter(
    NativeModules.AlarmAudioService
);

let initializeAlarm = (alarm, alarmDidInitialize) => {
    console.log("sending time: ", alarm.wakeUpTime);

    initNativeAlarm(
        alarm,
        { recCooldown: 0.25 }, // DEV: Setting to 15sec for convenience. Change back to Settings.recCooldown()
        // { recCooldown: Settings.recCooldown() },
        err => {
            console.log("didInitializeAlarm?: ", err ? false : true);
            alarmDidInitialize();
        }
    );
};

AlarmTriggerEvents.addListener("onAlarmTriggered", info => {
    console.log("JS Got ALARM_TRIGGERED EVENT. evtInfo:", info);

    let alarm = info.alarm;
    /* TODO:
        1. Cancel backup (non-silent) LocalNotifications (and reschedule all except the imminent one). - OR - just cancel the imminent one if possible.
        2. Present a SILENT LocalNotification immediately (native AlarmService will be starting to play audio now)
        3. Present an in-app alert for the Alarm, in case this occurrs in the Foreground.
    */

    // TODO: Remove any existing notifications from Notification center.

    // Canceling all local notifications
    console.log("Canceling all local notifications");
    NotificationsIOS.cancelAllLocalNotifications();

    alarm.time = moment(alarm.time).toDate();

    console.log("alarm after modification", alarm);
    // let alarm = realm.objectForPrimaryKey(alarm.alarmId);

    _scheduleBackupNotifications(alarm, alarm.sound);

    NotificationsIOS.localNotification({
        alertBody: alarm.label,
        alertTitle: "Clockulate",
        alertAction: "Click here to open",
        soundName: alarm.sound,
        category: "ALARM_CATEGORY",
        userInfo: { alarmId: alarm.id },
        silent: true
        // NOTE: no fireDate means fire immediately
    });
});

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
        console.log("SNOOZE RECEIVED");
        console.log(JSON.stringify(action));

        try {
            let { _data } = action.notification;

            let currAlarm = realm.objectForPrimaryKey("Alarm", _data.alarmId);
            if (currAlarm) {
                let snoozeTime = currAlarm.snoozeTime;
                // if (__DEV__) {
                //     snoozeTime = 1;
                // }

                // TODO: Since this is an explicit snooze, I need to inform native AlarmService how
                //  long it has been since the Alarm triggered (to this snooze action)
                // Based on current snoozeCount, the wakeUpTime, and currentTime, I can determine
                // the cummulative offset caused by user-delay of explicit snooze

                let offsetFromUserDelay = _calcOffsetFromUserDelay(currAlarm);

                snoozeNative(snoozeTime, offsetFromUserDelay);

                realm.write(() => {
                    if (currAlarm.snoozeCount == null) {
                        currAlarm.snoozeCount = 1;
                    } else {
                        currAlarm.snoozeCount += 1;
                    }

                    currAlarm.status = ALARM_STATES.SNOOZED;
                });

                // I need to cancel and reschedule backup Notifications here as well,
                //   since snoozing explicitly adds an offset to snoozeIntervals
                NotificationsIOS.cancelAllLocalNotifications();

                console.log("alarm: ", currAlarm);

                _scheduleBackupNotifications(currAlarm, currAlarm.sound);
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

let _calcOffsetFromUserDelay = currAlarm => {
    let snoozeTime = currAlarm.snoozeTime;
    let snoozeCnt = currAlarm.snoozeCount == null ? 0 : currAlarm.snoozeCount;
    let expSecSinceWake = snoozeCnt * (snoozeTime * 60); // # of secs since wakeUpTime if there was no user-delay in explicit snoozing.

    let now = moment();
    let wakeUpTime = moment(currAlarm.wakeUpTime);

    let actualSecSinceWake = (now - wakeUpTime) / 1000; // actual # of seconds since wakeUpTime.

    return actualSecSinceWake - expSecSinceWake;
};

let _scheduleBackupNotifications = (alarm, shortSoundFile) => {
    let wakeUpMoment = moment(alarm.wakeUpTime);

    // For now, use a constant 15 sec as a Snooze Time for testing
    let snoozeTime = alarm.snoozeTime * 60;

    // NOTE: These are now ALL backup notifications (WITH SOUND). They will all be canceled
    //  unless the app is terminated/suspended causing the NativeAlarm service to be unable to run.
    //  This is why they are all scheduled at an offset of 20sec after each Trigger time.
    //  Silent notifications will be presented immediately at the time of each Trigger in response
    //  to a Trigger event from native AlarmService.

    let notiCount;
    let now = moment();
    console.log("Scheduling backup notifications: ");

    if (wakeUpMoment - now > 0) {
        console.log("\tAlarm is in the future. Setting all notifications");
        // wakeUpTime is in the future
        wakeUpMoment.add(20, "s");
        notiCount = 10;
    } else {
        console.log("\tAlarm wakeUpTime is in the past...");
        console.log("\t\tSnoozeTime: ", snoozeTime);
        wakeUpMoment = moment(now);
        wakeUpMoment.add(20, "s");
        wakeUpMoment.add(snoozeTime, "s");

        if (alarm.snoozeCount == null) {
            notiCount = 10;
        } else {
            notiCount = alarm.snoozeCount < 10 ? 10 - alarm.snoozeCount : 0;
        }
        console.log(
            `\tSetting ${notiCount} backup snoozeNotifications, the first of which is at ${wakeUpMoment.toDate()}`
        );
    }

    // if (__DEV__) {
    //     snoozeTime = 15;
    // }
    for (let i = 0; i < notiCount; i++) {
        NotificationsIOS.localNotification({
            alertBody:
                alarm.label +
                "(Backup Notification -- should only fire if AlarmService not running)", // DEV: remove extra string
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

export let cancelAllNotifications = () => {
    PushNotificationIOS.cancelAllLocalNotifications();
};

/**
 * Called when app comes into the foreground, and has similar functionality to scheduleAlarm().
 * It is called for Alarm(s) that are SET according to DB, and should therefore already be recording (native) and have in-app timer running.
 * However, its possible that the provided SET Alarm is not initialized, if either
 *      1) The app was terminated,
 *      2) Audio was interupted.
 * Therefore, this function needs to set in-app timer for the alarm if its not already running, and
 * call initializeAlarm in the native AlarmService. If the native AlarmService is already running fine (i.e. no app termination
 * or audio interuption occurred) then it will just ignore this call.
 * It also needs to get the latest AlarmInstance, which should have .end == null if this function is being called. Pass this AlarmInst
 * into Native AlarmService initialization.
 *
 * Note that it doesn't need to schedule any Notifications (LocalNotifications), since those should be unaffected by app termination / audio interruption.
 *
 * @param {*} alarm
 * @param {*} reloadAlarmsList
 * @param {*} alarmDidInitialize
 */
export let resumeAlarm = (alarm, reloadAlarmsList, alarmDidInitialize) => {
    console.log("resumeAlarm");
    // first cancel any in-app timer for this alarm, since we were already doing this anyway in scheduleAlarm, and it wasn't causing problems.
    // Plus, its best to cancel it right away since if the timer expired during this function there could be a race condition.
    cancelInAppAlarm(alarm);

    setInAppAlarm(alarm, reloadAlarmsList);

    // Get sound file
    let shortSoundFile = "";
    let longSoundFile = "";
    let filesLen = alarm.alarmSound.sound.files.length;
    if (alarm.alarmSound.type == SOUND_TYPES.RANDOM) {
        /* Get all 'normal' Sounds (not Silent or Random) */
        let allSounds = realm
            .objects("Sound")
            .filtered("type = $0", SOUND_TYPES.NORMAL);

        if (Upgrades.pro != true) {
            allSounds = allSounds.filtered("isPremium = false");
        }

        /* randomly select any 'Sound' that is not "Vibrate Only" and not "Random"  */
        let randomSound =
            allSounds[Math.floor(Math.random() * allSounds.length)];
        shortSoundFile = randomSound.files[0]; // this selects the first file in the file array which should be the short version
        longSoundFile = randomSound.files[randomSound.files.length - 1]; // this selects the last file in the file array which should be the long version (might be the same)
        // realm.write(() => {
        //     alarm.alarmSound.sound = randomSound;
        // });
    } else if (alarm.alarmSound.type == SOUND_TYPES.NORMAL) {
        shortSoundFile = alarm.alarmSound.sound.files[0]; // this selects the first file in the file array which should be the short version
        longSoundFile = alarm.alarmSound.sound.files[filesLen - 1]; // this selects the last file in the file array which should be the long version (might be the same)
    } else if (alarm.alarmSound.type == SOUND_TYPES.SILENT) {
        shortSoundFile = "";
        longSoundFile = "";
    } else if (alarm.alarmSound.type == SOUND_TYPES.RANDOM_SUBSET) {
        // TODO: This functionality will be a premium feature
    }

    // Get current AlarmInstance
    let allAIs = realm.objects("AlarmInstance").sorted("start"); // sort by most recent first
    let currAlmInst;

    if (allAIs.length == 0 || allAIs[allAIs.length - 1].end != null) {
        // NOTE: Sanity check: There is no active AlarmInstance. In resumeAlarm(), this should NEVER happen.
        // create new AlarmInstance with start date of now, and empty End date, and empty disturbance list
        console.warn(
            "No active AlarmInstances found while running resumeAlarm. Should never happen."
        );
        realm.write(() => {
            currAlmInst = new AlarmInstance();
            realm.create("AlarmInstance", currAlmInst);
        });
    } else {
        // There is already an AlarmInstance in progress. continue with it.
        currAlmInst = allAIs[allAIs.length - 1];
    }

    initializeAlarm(
        {
            id: alarm.id,
            label: alarm.label,
            time: alarm.wakeUpTime.toISOString(),
            sound: longSoundFile.slice(0, -4),
            snoozeCount: alarm.snoozeCount,
            snoozeTime: alarm.snoozeTime,
            instId: currAlmInst.id
        },
        alarmDidInitialize
    );
};

/**
 *  Schedules in-app and local notifications for the provided alarm, and initializes the native Alarm service. Called when Alarm is
 *  first set - either on navigating back from AlarmDetail, or pressing Alarm toggle button.
 *  This function also creates a new AlarmInstance, or uses the latest one if .end == null (since this schedule could be due to
 *  an Alarm update)
 *  The callback alarmDidInitialize when native initialization is finished or failed.
 * @param {*} alarm
 * @param {*} reloadAlarmsList
 * @param {*} alarmDidInitialize
 */
export let scheduleAlarm = (alarm, reloadAlarmsList, alarmDidInitialize) => {
    console.log("scheduleAlarm");

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

        if (Upgrades.pro != true) {
            allSounds = allSounds.filtered("isPremium = false");
        }

        /* randomly select any 'Sound' that is not "Vibrate Only" and not "Random"  */
        let randomSound =
            allSounds[Math.floor(Math.random() * allSounds.length)];
        shortSoundFile = randomSound.files[0]; // this selects the first file in the file array which should be the short version
        longSoundFile = randomSound.files[randomSound.files.length - 1]; // this selects the last file in the file array which should be the long version (might be the same)
        // realm.write(() => {
        //     alarm.alarmSound.sound = randomSound;
        // });
    } else if (alarm.alarmSound.type == SOUND_TYPES.NORMAL) {
        shortSoundFile = alarm.alarmSound.sound.files[0]; // this selects the first file in the file array which should be the short version
        longSoundFile = alarm.alarmSound.sound.files[filesLen - 1]; // this selects the last file in the file array which should be the long version (might be the same)
    } else if (alarm.alarmSound.type == SOUND_TYPES.SILENT) {
        shortSoundFile = "";
        longSoundFile = "";
    } else if (alarm.alarmSound.type == SOUND_TYPES.RANDOM_SUBSET) {
        // TODO: This functionality will be a premium feature
    }

    /***** TODO: Extract the following AlarmInstance code into at least 1 separate function *****/

    let allAIs = realm.objects("AlarmInstance").sorted("start"); // sort by most recent first
    let currAlmInst;

    // NOTE: This check is required so that if user updates parameters of an already SET alarm,
    //         the newly scheduled Alarm is considered to be part of the same AlarmInstance.
    if (allAIs.length == 0 || allAIs[allAIs.length - 1].end != null) {
        // There is no active AlarmInstance.
        // create new AlarmInstance with start date of now, and empty End date, and empty disturbance list
        realm.write(() => {
            currAlmInst = new AlarmInstance();
            realm.create("AlarmInstance", currAlmInst);
        });
    } else {
        // There is already an AlarmInstance in progress. continue with it.
        currAlmInst = allAIs[allAIs.length - 1];
    }

    console.log("currAlmInst", currAlmInst);

    let allDists = realm
        .objects("SleepDisturbance")
        .filtered("recording != null AND recording != ''");

    console.log("allDists with recordings count", allDists.length);

    if (Settings.maxRecs() > -1 && allDists.length > Settings.maxRecs()) {
        console.log("allDists with recordings count", allDists.length);

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

    /***** TODO: Extract END *****/

    initializeAlarm(
        {
            id: alarm.id,
            label: alarm.label,
            time: alarm.wakeUpTime.toISOString(),
            sound: longSoundFile.slice(0, -4),
            snoozeCount: alarm.snoozeCount,
            snoozeTime: alarm.snoozeTime,
            instId: currAlmInst.id
        },
        alarmDidInitialize
    );

    // return;

    setInAppAlarm(alarm, reloadAlarmsList);

    // schedule notifications for this Alarm, staggering them by the "SNOOZE Time"
    _scheduleBackupNotifications(alarm, shortSoundFile);
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
            cancelInAppAlarm(alarm);
        });
    }
};

let onInAppSnoozePressed = (alarm, reloadAlarmsList, sound) => {
    console.log("onInAppSnoozePressed");

    if (sound) {
        sound.stop();
        sound.release();
    }

    let offsetFromUserDelay = _calcOffsetFromUserDelay(alarm);

    snoozeNative(alarm.snoozeTime, offsetFromUserDelay);

    realm.write(() => {
        if (alarm.snoozeCount == null) {
            alarm.snoozeCount = 1;
        } else {
            alarm.snoozeCount += 1;
        }

        alarm.status = ALARM_STATES.SNOOZED;
    });

    setInAppAlarm(alarm, reloadAlarmsList);

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
        // // store running averages of sleep
        // // Async: totalSleepEver, totalSleepThisYear, totalSleepThisMonth, totalSleepThisWeek
        // try {
        //     AsyncStorage.getItem("totalSleepEver").then(value => {
        //         console.log("First Launch");
        //         AsyncStorage.setItem("alreadyLaunched", JSON.stringify(true));
        //     });
        // } catch (error) {
        //     console.error(
        //         `Unable to check if app has already been launched: ${error}`
        //     );
        // }

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

    /* TODO: TEST: test that app doesn't crash here if this function isn't called on another screen (not AlarmsList)*/
    reloadAlarmsList();
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

    /* if alarm has been snoozed at least once, we need to adjust the in-app alarm time accordingly
        (also taking into account snooze-time setting)
     */
    if (alarm.snoozeCount != null && alarm.snoozeCount > 0) {
        console.log(
            "Setting an inAppAlarm for snooze. Snooze Count: ",
            alarm.snoozeCount
        );

        let minutesToAdd = alarm.snoozeCount * alarm.snoozeTime; // DEV: Change '1' to alarm.snoozeTime for release.
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

    console.log(
        `Setting in-app alarm for ${msUntilAlarm / 1000 / 60} minutes from now`
    );

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
                        null
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

        let minutesToAdd = alarm.snoozeCount * alarm.snoozeTime; // DEV: Change '1' to alarm.snoozeTime for release.
        let inAppNotifTime = moment(alarm.wakeUpTime).add(
            minutesToAdd,
            "minute"
        );
        msUntilAlarm = inAppNotifTime.toDate() - mNow.toDate();
        console.log("Snoozing for " + msUntilAlarm, " ms");

        let offsetFromUserDelay = _calcOffsetFromUserDelay(alarm);

        // TODO: Call snoozeNative to ensure that any native Audio playback stops now that the app is open.
        snoozeNative(msUntilAlarm / 1000 / 60, offsetFromUserDelay);
    } else if (alarm.snoozeCount == expectedSnoozeCount) {
        console.log("Got expected value for snoozeCount", expectedSnoozeCount);
        // NOTE: If we are here, I think it means that the app was opened after the user has explicitly snoozed all notifications that were delivered
    } else {
        // sanity check. Should never happen.
        console.error(
            "Expected snoozeCount was LOWER than actual snoozecount",
            `Expected: ${expectedSnoozeCount} | Actual: ${alarm.snoozeCount}`
        );
    }
};

export let snoozeAlarm = () => {};
