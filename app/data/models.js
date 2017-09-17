/**
 * Created by rdunn on 2017-08-30.
 */

import uuid from 'react-native-uuid';
import {DefaultTask, DefaultAlarm} from '../data/constants';

export class AlarmModel {
    constructor() {
        this.id = uuid.v1();
        this.wakeUpTime = DefaultAlarm.wakeUpTime;
        this.arrivalTime = DefaultAlarm.arrivalTime;
        this.mode = DefaultAlarm.mode;
        this.tasks = DefaultAlarm.tasks;
        this.label = DefaultAlarm.label;
        this.enabled = DefaultAlarm.enabled;
        this.visible = DefaultAlarm.visible;
        this.preset = DefaultAlarm.preset;
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
        Task: the base task entry to which this AlarmTask is linked
        alarmTasksList: the list of AlarmTasks to which this AlarmTask will be added. This is used to determine the "order"
     */
    constructor(task, order) {
        this.id = uuid.v1();
        this.task = task;
        this.order = order;
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
