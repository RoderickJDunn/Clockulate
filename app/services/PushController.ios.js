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

let reloadAlarmsList = null;

let initializeAlarm = (alarm, alarmDidInitialize) => {
    console.log("sending time: ", alarm.time);

    initNativeAlarm(
        alarm,
        // { recCooldown: 0.25 }, // DEV: Setting to 15sec for convenience. Change back to Settings.recCooldown()
        { recCooldown: Settings.recCooldown() },
        err => {
            console.log("didInitializeAlarm: err: ", err);
            alarmDidInitialize(err);
        }
    );
};

AlarmTriggerEvents.addListener("onAlarmTriggered", info => {
    console.log("JS Got ALARM_TRIGGERED EVENT. evtInfo:", info);

    let alarmInfo = info.alarm;
    /* 
        1. TODO: Remove any existing notifications from Notification center.
        2. Cancel backup (non-silent) LocalNotifications (and reschedule all except the imminent one). - OR - just cancel the imminent one if possible.
        3. Present a SILENT LocalNotification immediately (native AlarmService will be starting to play audio now)
        4. Present an in-app alert for the Alarm, in case this occurrs in the Foreground.
    */

    // TODO: Remove any existing notifications from Notification center.

    let dbAlarm;
    if (alarmInfo.id) {
        // ID is NOT null, look up the alarm directly by primary key
        dbAlarm = realm.objectForPrimaryKey("Alarm", alarmInfo.id);
    } else {
        // Id is NULL. Lookup the alarm by finding the alarm that is currently SET, or SNOOZED. There should only be 1.
        /* NOTE: This occurs if native service exited (eg. app terminated), and user does not re-enter the app until after the alarm rings.
                 This happens because JS calls checkForImplicitSnooze() -> native-snoozeAlarm(), which sets the alarm timer (passing the current native Alarm dictionary).
                 At this point the dictionary is empty (since app was terminated), and resumeAlarm()-->native-initializeAlarm(), which populates the native Alarm dict,
                 is only called after checkfForImplicitSnooze. There is definately a better way to fix this, but I think this will cause the least breaking changes */
        let alrms = realm
            .objects("Alarm")
            .filtered("status > $0", ALARM_STATES.OFF);
        if (alrms.length > 0) {
            dbAlarm = alrms[0];
        } else {
            console.error(
                "No active alarms found. Should never happen in this callback"
            );
            return;
        }
    }

    alarmInfo.time = moment(alarmInfo.time).toDate();

    console.log("Canceling all local notifications");
    NotificationsIOS.cancelAllLocalNotifications();
    _scheduleBackupNotifications(alarmInfo, alarmInfo.notifSound);
    // console.log("alarm after modification", alarm);

    NotificationsIOS.localNotification({
        alertBody: alarmInfo.label,
        alertTitle: "Clockulate",
        alertAction: "Click here to open",
        soundName: alarmInfo.sound,
        category: "ALARM_CATEGORY",
        userInfo: { alarmId: alarmInfo.id },
        silent: true
        // NOTE: no fireDate means fire immediately
    });

    realm.write(() => {
        dbAlarm.status = ALARM_STATES.RINGING;
    });

    console.log(
        "\n\n--------------------------------------------------------------------------------"
    );
    console.log("Reloading alarms list");

    reloadAlarmsList();

    // setAlarmInstEnd();

    // Only present the alert if Alarm triggered in the foreground
    if (alarmInfo.appState == "active") {
        presentAlert(dbAlarm);
    }
});

let alertPresent = false;
let presentAlert = alarm => {
    // Only present alert if there isn't one showing
    if (!alertPresent) {
        alertPresent = true;
        Alert.alert(
            "!!!",
            alarm.label,
            [
                {
                    text: "Snooze",
                    onPress: () => {
                        alertPresent = false;
                        onInAppSnoozePressed(alarm, null);
                    }
                },
                {
                    text: "Turn Off",
                    onPress: () => {
                        alertPresent = false;
                        onInAppTurnOffPressed(alarm, null);
                    }
                }
            ],
            { cancelable: false }
        );
    }
};

AlarmTriggerEvents.addListener("onAutoSnoozed", info => {
    // Increment snoozeCount of Alarm in DB

    let alarm = realm.objectForPrimaryKey("Alarm", info.alarm);

    console.log("onAutoSnoozed -- alarm", alarm);
    realm.write(() => {
        alarm.snoozeCount += 1;
    });

    reloadAlarmsList && reloadAlarmsList();
});

NoiseDetectionEvents.addListener("onNoiseDetected", info => {
    // console.log("JS Got NOISE_DETECTED EVT. info:", info);

    // Add disturbance/recording in context of current active Alarm instance

    /* 
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

    // Update 'timeAwake' property of AlarmInstance

    let dists = currAlmInst.disturbances.sorted("time");
    let totalTimeAwake = currAlmInst.timeAwake;
    if (dists.length > 0) {
        let timeOfPrevDist = moment(dists[dists.length - 1].time);
        let mNow = moment();
        let timeSinceLastDist = mNow - timeOfPrevDist;
        console.log("before adding...");
        console.log("timeSinceLastDist", timeSinceLastDist);
        console.log("totalTimeAwake", totalTimeAwake);

        timeSinceLastDist = timeSinceLastDist / 1000 / 60; // convert to minutes

        // Add the time since the previous disturbance to 'timeAwake', if
        //  it has been less than 15 minutes since the previous one
        if (timeSinceLastDist < 15 /* DEV: Change 1 to 15 */) {
            totalTimeAwake += timeSinceLastDist; // convert to minutes before adding to total
            totalTimeAwake = Math.round(totalTimeAwake * 10) / 10; // round to 1 decimal
            console.log("after adding...");
            console.log("timeSinceLastDist", timeSinceLastDist);
            console.log("totalTimeAwake", totalTimeAwake);
        }
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
        currAlmInst.timeAwake = totalTimeAwake;
    });

    console.log("added new disturbance: ");
    // console.log(newDisturbance);
    console.log("currAlmInst (after adding dist)", currAlmInst);
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

                snoozeNative(snoozeTime);

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
                // console.log(
                //     "Canceling all local notifications (from snooze action)"
                // );
                // console.log(
                //     "then scheduling new backups with currAlarm:",
                //     currAlarm
                // );
                NotificationsIOS.cancelAllLocalNotifications();
                _scheduleBackupNotifications(
                    currAlarm,
                    currAlarm.alarmSound.sound.files[0]
                );
                // console.log("alarm: ", currAlarm);
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

        // console.log("Canceling all local notifications (from Disable action)");

        NotificationsIOS.cancelAllLocalNotifications();
        console.log("cancelled notifs");
        turnOffNative();

        try {
            let { _data } = action.notification;

            let currAlarm = realm.objectForPrimaryKey("Alarm", _data.alarmId);
            if (currAlarm) {
                realm.write(() => {
                    currAlarm.status = ALARM_STATES.OFF;
                    currAlarm.snoozeCount = 0;
                });
            }

            setAlarmInstEnd(completed);
        } catch (e) {
            console.log("Error: ", e);
            completed();
            console.log("completed disable action");
        }
        // console.log(lastNotificationIds);
        // lastNotificationIds.forEach(notifId => {
        //     NotificationsIOS.cancelLocalNotification(notifId);
        // });
    }
);

export const ALARM_CAT = new NotificationCategory({
    identifier: "ALARM_CATEGORY",
    actions: [snoozeAction, disableAction],
    context: "default"
});

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
    // console.log("shortSoundFile", shortSoundFile);
    let backupTimes = [];
    for (let i = 0; i < notiCount; i++) {
        // backupTimes.push(
        //     `${i}. ${wakeUpMoment.toDate()}, ${shortSoundFile}, snoozeCount:${
        //         alarm.snoozeCount
        //     }`
        // );

        NotificationsIOS.localNotification({
            alertBody: alarm.label, // + "(Backup)", // DEV: remove extra string
            alertTitle: "Clockulate",
            alertAction: "Click here to open",
            soundName: shortSoundFile,
            silent: shortSoundFile == "" ? true : false,
            category: "ALARM_CATEGORY",
            fireDate: wakeUpMoment.format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
            userInfo: { alarmId: alarm.id }
        });
        wakeUpMoment.add(snoozeTime, "s");
    }

    // console.log("Backup notifications", ...backupTimes);
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
export let resumeAlarm = (alarm, reload, alarmDidInitialize) => {
    console.log("resumeAlarm");
    // first cancel any in-app timer for this alarm, since we were already doing this anyway in scheduleAlarm, and it wasn't causing problems.
    // Plus, its best to cancel it right away since if the timer expired during this function there could be a race condition.

    reloadAlarmsList = reload;

    // setInAppAlarm(alarm, reloadAlarmsList);

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

    // TODO: FIXME: Its likely that this will be called with the most recent AlmInst having .end set (since alarm
    //          could have just rang, then user opened the app, and then this fn was called.)
    //          I need to grab the latest alarm even if .end already has a value.
    if (allAIs.length == 0) {
        // NOTE: Sanity check: There are no AlarmInstances. In resumeAlarm(), this should NEVER happen.
        // create new AlarmInstance with start date of now, and empty End date, and empty disturbance list
        console.warn(
            "No AlarmInstances found while running resumeAlarm. Should never happen."
        );

        realm.write(() => {
            currAlmInst = new AlarmInstance();
            realm.create("AlarmInstance", currAlmInst);
        });
    } else {
        if (allAIs[allAIs.length - 1].end == null) {
            // This will occur when the app is re-opened and alarm is in the SET state. i.e. it has
            //  not yet reached wakeUpTime.
            console.info("Most recent alarm instance has no END assigned yet.");
        } else {
            // This will occur when the app is re-opened if wakeUpTime for this alarm has already passed,
            //  and the alarm is in either RINGING, or SNOOZED state.
            console.info(
                "Most recent alarm instance has already been assigned an END"
            );
        }
        currAlmInst = allAIs[allAIs.length - 1];
    }

    initializeAlarm(
        {
            id: alarm.id,
            label: alarm.label,
            time: alarm.wakeUpTime.toISOString(),
            sound: longSoundFile.slice(0, -4),
            /* NOTE: sending notifSound purely so it can be sent back to JS with onAlarmTrigger event. This is important so that backupNotifications are scheduled with
            the same sound as the one used by native. This prevents us from having to do another realm lookup or RANDOM sound calculation */
            notifSound: shortSoundFile,
            snoozeCount: alarm.snoozeCount,
            snoozeTime: alarm.snoozeTime,
            instId: currAlmInst.id
            // source: "resumeAlarm" DEV:
        },
        alarmDidInitialize
    );

    console.log("Cancelling all localNotifications (from resumeAlarm)");
    NotificationsIOS.cancelAllLocalNotifications();
    _scheduleBackupNotifications(alarm, shortSoundFile);
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
export let scheduleAlarm = (alarm, reload, alarmDidInitialize) => {
    console.log("scheduleAlarm");

    reloadAlarmsList = reload;
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
        console.log("Creating new Alarm Instance");
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

    /***** TODO: END of Extract *****/

    initializeAlarm(
        {
            id: alarm.id,
            label: alarm.label,
            time: alarm.wakeUpTime.toISOString(),
            sound: longSoundFile.slice(0, -4),
            /* NOTE: sending notifSound purely so it can be sent back to JS with onAlarmTrigger event. This is important so that backupNotifications are scheduled with
                the same sound as the one used by native. This prevents us from having to do another realm lookup or RANDOM sound calculation */
            notifSound: shortSoundFile,
            snoozeCount: alarm.snoozeCount,
            snoozeTime: alarm.snoozeTime,
            instId: currAlmInst.id
            // source: "scheduleAlarm" // DEV:
        },
        alarmDidInitialize
    );

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

    console.log("clearAlarm (cancelling notifs");

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
    }
};

let onInAppSnoozePressed = (alarm, sound) => {
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

    // setInAppAlarm(alarm, reloadAlarmsList);

    let alarms = realm.objects("Alarm").sorted("order");
    // console.log("Alarms after updating realm: ", alarms);

    reloadAlarmsList();
};

let setAlarmInstEnd = completed => {
    console.log("setAlarmInstEnd");
    // Fetch current AlarmInstance and set its 'end' datetime to now.
    let almInsts = realm.objects("AlarmInstance").sorted("start", true);
    let currAlmInst = almInsts
        ? almInsts.length > 0
            ? almInsts[0]
            : null
        : null;

    // console.log("currAlmInst", currAlmInst);

    if (currAlmInst != null) {
        // store running averages of sleep
        // Async: totalSleepEver, totalSleepThisYear, totalSleepThisMonth, totalSleepThisWeek
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

        let mNow = moment();

        // Delete AlmInst if total length <15 mins
        if (
            mNow - moment(currAlmInst.start) <
            900 * 1000
            // 10 * 1000 /* DEV: 10 seconds for for development  */
        ) {
            console.log("Alm Inst is <15 min long. Deleting");

            let recordings = currAlmInst.disturbances.filtered(
                "recording != null AND recording != ''"
            );
            var path = RNFS.DocumentDirectoryPath + "/" + currAlmInst.id;

            RNFS.unlink(path)
                .then(() => {
                    console.log("Deleted directory: " + path);
                    completed && completed();
                })
                .catch(() => {
                    completed && completed();
                });

            if (realm.isInTransaction) {
                // Delete AlarmInstance, associated disturbances, and any recording files
                realm.delete(currAlmInst.disturbances);
                realm.delete(currAlmInst);
            } else {
                realm.write(() => {
                    // Delete AlarmInstance, associated disturbances, and any recording files
                    realm.delete(currAlmInst.disturbances);
                    realm.delete(currAlmInst);
                });
            }
        } else {
            if (realm.isInTransaction) {
                currAlmInst.end = new Date();
            } else {
                realm.write(() => {
                    currAlmInst.end = new Date();
                });
            }
            completed && completed();
        }
    } else {
        // This will happen whenever an inactive Alarm is deleted. If it happens
        //  when an Alarm is triggered or disabled, thats an issue, but I'm not
        //  sure there is anything easy to do to recover from it.
        console.info("No active alarm instance found");
        completed && completed();
    }
};

let onInAppTurnOffPressed = (alarm, sound) => {
    console.log("onInAppTurnOffPressed");

    if (sound) {
        sound.stop();
        sound.release();
    }

    clearAlarm(alarm);

    /* TODO: TEST: test that app doesn't crash here if this function is called on another screen (not AlarmsList)*/
    reloadAlarmsList();
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

    let almSnoozeTime = alarm.snoozeTime * 60; // convert snoozeTime to seconds
    console.log("almSnoozeTime", almSnoozeTime);

    let expectedSnoozeCount = Math.ceil(secondsDiff / almSnoozeTime);
    console.log("expectedSnoozeCount", expectedSnoozeCount);

    if (alarm.snoozeCount == null || alarm.snoozeCount < expectedSnoozeCount) {
        // user did not explicitly snooze for x number of notifications.
        realm.write(() => {
            alarm.snoozeCount = expectedSnoozeCount;
            alarm.status = ALARM_STATES.SNOOZED;
        });

        // Call snoozeNative to ensure that any native Audio playback stops now that the app is open.
        snoozeNative(alarm.snoozeTime);
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

// NOTE: The complexities of Snoozing
//  There are actually 4 ways that an alarm can be snoozed now..
//      1. If alarm triggers in the foreground, user can tap Snooze in the Alert that shows
//      2. If alarm triggers in the background, user can tap Snooze as the notification action
//      3. If alarm triggers in the background, the user can open the app (in several ways), which will
//          cause the Alarm to snooze.
//      4. If alarm triggers in either background/foreground, and the user does not interact with the
//          in-app Alert (foreground), and does not take a notification action or re-open the app (background),
//          the Alarm will be automatically snoozed after 90 seconds.
