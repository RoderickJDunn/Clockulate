/**
 * Created by rdunn on 2017-08-19.
 */

import realm from "./DataSchemas";
import uuid from "react-native-uuid";
import moment from "moment";
import { DefaultAlarm } from "./constants";
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

// Create Realm objects and write to local storage
function insertDummyData() {
    realm.write(() => {
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
            defaultDuration: 800
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

        /**** Create Alarms *****/
        console.log("Adding dummy alarms");
        const alarm1 = realm.create("Alarm", {
            id: uuid.v1(),
            wakeUpTime: moment("8:35", "HH:mm").toDate(),
            arrivalTime: moment("9:35", "HH:mm").toDate(),
            mode: "autocalc", // TODO: Change back to basic for testing
            tasks: [almTask1, almTask7, almTask3, almTask8],
            label: "Wake up on work-day",
            enabled: true, // if true, it is active, and will Ring at wakeUpTime.
            visible: true, // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
            preset: false, // if tr
            order: 0,
            sound: "",
            snoozeTime: DefaultAlarm.snoozeTime
        });

        const alarm2 = realm.create("Alarm", {
            id: uuid.v1(),
            wakeUpTime: moment("10:00", "HH:mm").toDate(),
            arrivalTime: moment("11:30", "HH:mm").toDate(),
            mode: "autocalc",
            tasks: [almTask6, almTask9, almTask1b, almTask3b],
            label: "Wake up for appointment",
            enabled: true, // if true, it is active, and will Ring at wakeUpTime.
            visible: true, // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
            preset: false, // if tr
            order: 1,
            sound: "super_ringtone.mp3",
            snoozeTime: DefaultAlarm.snoozeTime
        });
        console.log(alarm2, alarm1, task2, task4, task5);
    });

    // const longTasks = realm.objects("Task").filtered("defaultDuration > 1000");
    // console.log(`Tasks: ${longTasks}`);
}

export default insertDummyData;
