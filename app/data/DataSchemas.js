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
            type: "int", // TODO: not settable by user yet. For now it will default to 10 minutes
            default: 10
        },
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
        order: "int"
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
        type: "int",
        order: "int",
        enabled: "bool" // this property will never be changed in the DB. It is just here to more easily create a functional array from this DB table
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

console.log("Realm path: ", Realm.defaultPath);

export default new Realm({
    schema: [
        AlarmSchema,
        TaskSchema,
        AlarmTaskSchema,
        SoundSchema,
        AlarmSoundSchema
    ]
});
