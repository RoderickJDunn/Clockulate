/**
 * Created by rdunn on 2017-08-19.
 */

import realm from "./DataSchemas";
import uuid from "react-native-uuid";
import moment from "moment";
import { DefaultAlarm, ALARM_STATES } from "./constants";
import * as DateUtils from "../util/date_utils";
import SOUND_DATA from "./sound-data";
import { AlarmModel, AlarmSound } from "./models";

console.log("dummy data file");

let prePopTasks = [
    {
        name: "Take out trash and recycling (blue bin)",
        defaultDuration: 600
    },
    {
        name: "Take out recyling (black bin)",
        defaultDuration: 300
    },
    {
        name: "Make egg sandwhich",
        defaultDuration: 180
    },
    {
        name: "Eat cereal",
        defaultDuration: 600
    },
    {
        name: "Snooze Alarm",
        defaultDuration: 1200
    }
];

let prePopSettings = [
    {
        name: "defaultShowHrsOfSleep",
        enabled: true,
        value: 0 // unused for this setting
    }
];

// Create Realm objects and write to local storage
function insertPrepopData() {
    realm.write(() => {
        /* Insert Sounds data */
        let defaultSound = realm.create("Sound", {
            id: uuid.v1(),
            files: SOUND_DATA[0].files,
            displayName: SOUND_DATA[0].displayName,
            category: SOUND_DATA[0].category,
            order: SOUND_DATA[0].order,
            enabled: false,
            type: SOUND_DATA[0].type
        });
        for (let i = 1; i < SOUND_DATA.length; i++) {
            realm.create("Sound", {
                id: uuid.v1(),
                files: SOUND_DATA[i].files,
                displayName: SOUND_DATA[i].displayName,
                category: SOUND_DATA[i].category,
                order: SOUND_DATA[i].order,
                enabled: false,
                type: SOUND_DATA[i].type
            });
        }

        /**** Create Tasks *****/

        console.log("Adding dummy tasks");

        const task1 = realm.create("Task", {
            id: uuid.v1(),
            name: "Walk the dogs",
            defaultDuration: 600
        });
        const task2 = realm.create("Task", {
            id: uuid.v1(),
            name: "Clean kitchen",
            defaultDuration: 1200
        });
        const task3 = realm.create("Task", {
            id: uuid.v1(),
            name: "Take a shower (wash hair)",
            defaultDuration: 1200
        });
        const task4 = realm.create("Task", {
            id: uuid.v1(),
            name: "Take a shower",
            defaultDuration: 900
        });
        const task5 = realm.create("Task", {
            id: uuid.v1(),
            name: "Biking (exercise)",
            defaultDuration: 3600
        });
        const task6 = realm.create("Task", {
            id: uuid.v1(),
            name: "Strength training (exercise)",
            defaultDuration: 1800
        });
        const task7 = realm.create("Task", {
            id: uuid.v1(),
            name: "Feed the pets",
            defaultDuration: 180
        });
        const task8 = realm.create("Task", {
            id: uuid.v1(),
            name: "Travel to work",
            defaultDuration: 1800
        });
        const task9 = realm.create("Task", {
            id: uuid.v1(),
            name: "Travel to appointment",
            defaultDuration: 1200
        });

        /* Create some more tasks */
        for (let index = 0; index < prePopTasks.length; index++) {
            realm.create("Task", {
                id: uuid.v1(),
                name: prePopTasks[index].name,
                defaultDuration: prePopTasks[index].defaultDuration
            });
        }

        /* Create Settings */
        for (let index = 0; index < prePopSettings.length; index++) {
            realm.create("Setting", {
                id: uuid.v1(),
                name: prePopSettings[index].name,
                enabled: prePopSettings[index].enabled,
                value: prePopSettings[index].value
            });
        }

        /**** Create AlarmTasks *****/
        // AlarmTasks for alarm1
        const almTask1 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task1,
            order: 0,
            duration: 600
            // Since I'm not specifying 'duration' or 'enabled' values, the defaults will be used (see DataSchemas.js
            // to check the default values).
        });
        const almTask7 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task7,
            order: 1,
            duration: 180
        });
        const almTask3 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task3,
            order: 2,
            duration: 1200
        });
        const almTask8 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task8,
            order: 3,
            duration: 1800
        });

        // AlarmTasks for alarm2
        const almTask9 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task9,
            order: 3,
            duration: 1200
        });
        const almTask6 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task6,
            order: 1,
            duration: 1200
        });
        const almTask3b = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task3,
            order: 2,
            duration: 1200
        });
        const almTask1b = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: task1,
            order: 0,
            duration: 600
        });

        let aSound1 = new AlarmSound();
        let aSound2 = new AlarmSound();
        const alarmSound1 = realm.create("AlarmSound", {
            id: aSound1.id,
            sound: aSound1.sound,
            type: aSound1.type
        });
        const alarmSound2 = realm.create("AlarmSound", {
            id: aSound2.id,
            sound: aSound2.sound,
            type: aSound2.type
        });

        /**** Create Alarms *****/
        console.log("Adding dummy alarms");

        let wake1 = moment("8:35", "HH:mm").toDate();
        wake1 = DateUtils.date_to_nextTimeInstance(wake1);

        let arrive1 = moment("9:35", "HH:mm").toDate();
        arrive1 = DateUtils.date_to_nextTimeInstance(arrive1);

        const alarm1 = realm.create("Alarm", {
            id: uuid.v1(),
            wakeUpTime: wake1,
            arrivalTime: arrive1,
            mode: "autocalc", // TODO: Change back to basic for testing
            tasks: [almTask1, almTask7, almTask3, almTask8],
            label: "Wake up on work-day",
            status: ALARM_STATES.OFF, // if true, it is active, and will Ring at wakeUpTime.
            visible: true, // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
            preset: false, // if tr
            order: 0,
            alarmSound: alarmSound1,
            snoozeTime: DefaultAlarm.snoozeTime
        });

        let wake2 = moment("10:00", "HH:mm").toDate();
        wake2 = DateUtils.date_to_nextTimeInstance(wake2);

        let arrive2 = moment("11:30", "HH:mm").toDate();
        arrive2 = DateUtils.date_to_nextTimeInstance(arrive2);

        const alarm2 = realm.create("Alarm", {
            id: uuid.v1(),
            wakeUpTime: wake2,
            arrivalTime: arrive2,
            mode: "autocalc",
            tasks: [almTask6, almTask9, almTask1b, almTask3b],
            label: "Wake up for appointment",
            status: ALARM_STATES.OFF, // if true, it is active, and will Ring at wakeUpTime.
            visible: true, // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
            preset: false, // if tr
            order: 1,
            alarmSound: alarmSound2,
            snoozeTime: DefaultAlarm.snoozeTime
        });
        console.log(alarm2, alarm1, task2, task4, task5);
    });

    // const longTasks = realm.objects("Task").filtered("defaultDuration > 1000");
    // console.log(`Tasks: ${longTasks}`);
}

export function populateDummyAlarms() {
    let wake1 = moment("1:00", "HH:mm").toDate();
    wake1 = DateUtils.date_to_nextTimeInstance(wake1);
    let wake2 = moment("2:00", "HH:mm").toDate();
    wake2 = DateUtils.date_to_nextTimeInstance(wake2);
    let wake3 = moment("3:00", "HH:mm").toDate();
    wake3 = DateUtils.date_to_nextTimeInstance(wake3);
    let wake4 = moment("4:00", "HH:mm").toDate();
    wake4 = DateUtils.date_to_nextTimeInstance(wake4);
    let wake5 = moment("5:00", "HH:mm").toDate();
    wake5 = DateUtils.date_to_nextTimeInstance(wake5);

    realm.write(() => {
        realm.create("Alarm", new AlarmModel(0, wake1));
        realm.create("Alarm", new AlarmModel(1, wake2));
        realm.create("Alarm", new AlarmModel(2, wake3));
        realm.create("Alarm", new AlarmModel(3, wake4));
        realm.create("Alarm", new AlarmModel(4, wake5));
    });
}

export default insertPrepopData;
