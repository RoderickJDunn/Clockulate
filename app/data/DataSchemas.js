/**
 * Created by rdunn on 2017-08-08.
 */

"use strict";

import Realm from "realm";
class AlarmSchema extends Realm.Object {}
AlarmSchema.schema = {
    name: "Alarm",
    primaryKey: "id",
    properties: {
        id: "string",
        wakeUpTime: "date",
        arrivalTime: "date",
        mode: "string", // "basic" or "autocalc"
        tasks: { type: "list", objectType: "AlarmTask" },
        label: "string",
        status: "int", // enum. [OFF, SET, RINGING, SNOOZED]
        visible: "bool", // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
        preset: "bool", // if true, this Alarm is persistent (remains saved as preset, even if removed from 'Alarms' list page.
        order: "int", // used to re-arrange the Alarms list. When an alarm is added, it always gets the highest order (bottom of the list)
        alarmSound: { type: "object", objectType: "AlarmSound" },
        snoozeTime: {
            type: "int",
            default: 10
        },
        showHrsOfSleep: { type: "bool", default: true },
        notificationId: {
            type: "string", // this is used for Android only since its the only way to cancel specific notifications.
            optional: true
        },
        timeoutId: {
            type: "int", // this is used in iOS only to allow for in-app notifications
            optional: true
        },
        snoozeCount: {
            type: "int", // this is used in iOS only in order to set the correct times for snoozed in-app nofications
            optional: true
        }
    }
};

class TaskSchema extends Realm.Object {}
TaskSchema.schema = {
    name: "Task",
    primaryKey: "id",
    properties: {
        id: "string",
        name: "string",
        defaultDuration: "int"
    }
};

class AlarmTaskSchema extends Realm.Object {}
AlarmTaskSchema.schema = {
    name: "AlarmTask",
    primaryKey: "id",
    properties: {
        id: "string",
        task: { type: "Task" },
        duration: { type: "int" }, // This is no longer optional. It will now initially be set to the underlying Task's defaultDuration
        enabled: { type: "bool", default: true },
        order: "int",
        startTime: { type: "string", optional: true }
    }
};

class SoundSchema extends Realm.Object {}
SoundSchema.schema = {
    name: "Sound",
    primaryKey: "id",
    properties: {
        id: "string",
        files: "string[]",
        displayName: "string",
        category: "string",
        isPremium: { type: "bool", default: false },
        type: "int",
        order: "int"
    }
};

class AlarmSoundSchema extends Realm.Object {}
AlarmSoundSchema.schema = {
    name: "AlarmSound",
    primaryKey: "id",
    properties: {
        id: "string",
        sound: { type: "Sound" },
        type: "int"
    }
};

class SettingsSchema extends Realm.Object {}
SettingsSchema.schema = {
    name: "Setting",
    primaryKey: "id",
    properties: {
        id: "string",
        name: "string",
        enabled: { type: "bool", default: true },
        value: { type: "int", default: 0 }
    }
};

class SleepDisturbanceSchema extends Realm.Object {}
SleepDisturbanceSchema.schema = {
    name: "SleepDisturbance",
    primaryKey: "id",
    properties: {
        id: "string",
        time: "date",
        recording: "string?",
        duration: { type: "int", default: 0 }
    }
};

class AlarmInstanceSchema extends Realm.Object {}
AlarmInstanceSchema.schema = {
    name: "AlarmInstance",
    primaryKey: "id",
    properties: {
        id: "string",
        start: "date",
        end: { type: "date", optional: true },
        disturbances: { type: "list", objectType: "SleepDisturbance" },
        // NOTE: the first 15mins of every Alarm will be considered 'awake time'
        timeAwake: { type: "float", default: 15 }
    }
};

console.log("Realm path: ", Realm.defaultPath);

export default new Realm({
    schema: [
        AlarmSchema,
        TaskSchema,
        AlarmTaskSchema,
        SoundSchema,
        AlarmSoundSchema,
        SettingsSchema,
        SleepDisturbanceSchema,
        AlarmInstanceSchema
    ]
});
