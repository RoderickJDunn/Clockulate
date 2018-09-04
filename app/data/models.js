/**
 * Created by rdunn on 2017-08-30.
 */

import uuid from "react-native-uuid";
import { DefaultTask, DefaultAlarm, SOUND_TYPES } from "../data/constants";
import { isEmpty } from "../util/general_util";
import realm from "../data/DataSchemas";

export class AlarmModel {
    constructor(order, wakeUpTime = null) {
        this.id = uuid.v1();
        this.wakeUpTime = wakeUpTime ? wakeUpTime : DefaultAlarm.wakeUpTime;
        this.arrivalTime = DefaultAlarm.arrivalTime;
        this.mode = DefaultAlarm.mode;
        this.tasks = DefaultAlarm.tasks;
        this.label = DefaultAlarm.label;
        this.enabled = DefaultAlarm.enabled;
        this.visible = DefaultAlarm.visible;
        this.preset = DefaultAlarm.preset;
        this.order = order;

        this.alarmSound = realm.create("AlarmSound", new AlarmSound());
        console.log('this.sound', this.sound);
        this.snoozeTime = DefaultAlarm.snoozeTime;
        this.noticiationId = null;
    }

    static isDefault(alarm) {
        console.log("------- Checking if alarm is default -----");
        console.log(alarm);
        if (
            alarm.wakeUpTime === DefaultAlarm.wakeUpTime &&
            alarm.arrivalTime === DefaultAlarm.arrivalTime &&
            // alarm.mode === DefaultAlarm.mode &&
            alarm.tasks.length === DefaultAlarm.tasks.length &&
            alarm.label === DefaultAlarm.label &&
            alarm.enabled === DefaultAlarm.enabled &&
            alarm.visible === DefaultAlarm.visible &&
            alarm.preset === DefaultAlarm.preset
        ) {
            return true;
        } else {
            return false;
        }
    }
}

export class AlarmSound {
    constructor(sound) {
        if (!sound) {
            sound = realm.objects("Sound").filtered("order = $0", 0)[0];
        }
        this.id = uuid.v1();
        this.sound = sound;
        this.type = SOUND_TYPES.SILENT;
    }
}

export class TaskModel {
    constructor() {
        this.id = uuid.v1();
        this.name = DefaultTask.name;
        this.defaultDuration = DefaultTask.duration;
    }
}

export class AlarmTaskModel {
    /*
    Paramters --
        task: the base task entry to which this AlarmTask is linked
        order: the order of this AlarmTask within the linked Alarm's list of AlarmTasks.
     */
    constructor(task, order) {
        this.id = uuid.v1();
        this.task = task;
        this.order = order;
        this.duration = 0;
    }
}

// /*
// This function creates a new Task, and the associated AlarmTask. Then returns the AlarmTask.
//  */
// export function createNewTaskFull(alarmTask) {
//     realm.write(() => {
//         console.log("\n\n\nDATA ---- creating: \n");
//         console.log(alarmTask);
//
//         console.log("Creating task");
//         const task = realm.create("Task", {
//             id: uuid.v1(),
//             name: alarmTask.task.name,
//             defaultDuration: alarmTask.task.defaultDuration,
//         });
//         console.log(task);
//
//         console.log("Creating alarmTask");
//         const alarmTask =  realm.create("AlarmTask", {
//             id: uuid.v1(),
//             task: task,
//             duration: alarmTask.duration,
//             enabled: alarmTask.enabled
//         });
//
//         console.log(alarmTask);
//         return alarmTask;
//     });
// }
