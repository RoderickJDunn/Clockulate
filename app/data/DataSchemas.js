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
        enabled: "bool", // if true, it is active, and will Ring at wakeUpTime.
        visible: "bool", // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
        preset: "bool", // if true, this Alarm is persistent (remains saved as preset, even if removed from 'Alarms' list page.
        order: "int", // used to re-arrange the Alarms list. When an alarm is added, it always gets the highest order (bottom of the list)
        sound: "string"
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
        duration: { type: "int", optional: true }, // if this is set, use this duration instead of the defaultDuration provided by 'Task'
        enabled: { type: "bool", default: true },
        order: "int"
    }
};

console.log("Realm path: ", Realm.defaultPath);

export default new Realm({
    schema: [AlarmSchema, TaskSchema, AlarmTaskSchema]
});
