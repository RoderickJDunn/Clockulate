/**
 * Created by rdunn on 2017-08-30.
 */

import uuid from "react-native-uuid";
import { DefaultTask, DefaultAlarm, SOUND_TYPES } from "../data/constants";
import { isEmpty } from "../util/general_util";
import realm from "../data/DataSchemas";
import moment from "moment";

export class AlarmModel {
    constructor(order, wakeUpTime = null, defaultShowHrsOfSleep = null) {
        let defAlm = DefaultAlarm();

        this.id = uuid.v1();
        this.wakeUpTime = wakeUpTime ? wakeUpTime : defAlm.wakeUpTime;
        this.arrivalTime = defAlm.arrivalTime;
        this.mode = defAlm.mode;
        this.tasks = defAlm.tasks;
        this.label = defAlm.label;
        this.status = defAlm.status;
        this.visible = defAlm.visible;
        this.preset = defAlm.preset;
        this.order = order;
        this.showHrsOfSleep = defAlm.defaultShowHrsOfSleep;

        this.alarmSound = new AlarmSound();
        console.log("this.sound", this.sound);
        this.snoozeTime = defAlm.snoozeTime;
        this.noticiationId = null;
    }

    static isDefault(alarm) {
        console.log("------- Checking if alarm is default -----");
        console.log(alarm);
        let defAlm = DefaultAlarm();
        if (
            alarm.wakeUpTime === defAlm.wakeUpTime &&
            alarm.arrivalTime === defAlm.arrivalTime &&
            // alarm.mode === defAlm.mode &&
            alarm.tasks.length === defAlm.tasks.length &&
            alarm.label === defAlm.label &&
            alarm.status === defAlm.status &&
            alarm.visible === defAlm.visible &&
            alarm.preset === defAlm.preset
        ) {
            return true;
        } else {
            return false;
        }
    }
}

export class AlarmInstance {
    constructor() {
        this.id = uuid.v1();
        this.start = moment().toDate();
        this.disturbances = [];
        this.timeAwake = 0;
    }
}

export class AlarmSound {
    constructor(sound) {
        if (!sound) {
            sound = realm.objects("Sound").filtered("order = $0", 4)[0];
        }
        this.id = uuid.v1();
        this.sound = sound;
        this.type = SOUND_TYPES.NORMAL;

        // DEV: Defaut sound is silent for dev. But for releases it should be Digital4 (uncomment the block above)
        // if (!sound) {
        //     sound = realm.objects("Sound").filtered("order = $0", 0)[0];
        // }
        // this.id = uuid.v1();
        // this.sound = sound;
        // this.type = SOUND_TYPES.SILENT;
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

export class DisturbanceModel {
    constructor() {
        this.id = uuid.v1();
        this.time = new Date();
        this.recording = null;
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
