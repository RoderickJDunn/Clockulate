/**
 * Created by rdunn on 2017-08-19.
 */

import realm from "./DataSchemas";
import uuid from "react-native-uuid";
import moment from "moment";
import { DefaultAlarm, ALARM_STATES, ADV_STAT_TYPES } from "./constants";
import * as DateUtils from "../util/date_utils";
import SOUND_DATA from "./sound-data";
import { AlarmModel, AlarmSound } from "./models";

// for testing
import RNFS from "react-native-fs";

console.log("dummy data file");

let prePopTasks = [
    {
        name: "Take out trash",
        defaultDuration: 600
    },
    {
        name: "Take out recyling",
        defaultDuration: 300
    },
    {
        name: "Eat breakfast",
        defaultDuration: 900
    },
    {
        name: "Eat cereal",
        defaultDuration: 600
    },
    {
        name: "Snooze Alarm",
        defaultDuration: 600
    },
    {
        name: "Walk the dog",
        defaultDuration: 900
    },
    {
        name: "Go for a run",
        defaultDuration: 1800
    },
    {
        name: "Work out",
        defaultDuration: 3600
    },
    {
        name: "Take a shower",
        defaultDuration: 600
    },
    {
        name: "Drive to Work",
        defaultDuration: 1800
    },
    {
        name: "Drive to Work (rush hour)",
        defaultDuration: 2700
    },
    {
        name: "Take the Bus to work",
        defaultDuration: 2700
    },
    {
        name: "Take the Subway to work",
        defaultDuration: 2700
    },
    {
        name: "Bike to work",
        defaultDuration: 1200
    },
    {
        name: "Walk to work",
        defaultDuration: 1200
    },
    {
        name: "Drive to appointment",
        defaultDuration: 1800
    },
    {
        name: "Feed the pets",
        defaultDuration: 300
    },
    {
        name: "Get ready for work",
        defaultDuration: 1800
    },
    {
        name: "Pack a lunch",
        defaultDuration: 300
    },
    {
        name: "Make coffee",
        defaultDuration: 300
    },
    {
        name: "Brush my teeth",
        defaultDuration: 180
    },
    {
        name: "Prepare for meeting",
        defaultDuration: 1800
    },
    {
        name: "Drop kids off at school",
        defaultDuration: 1200
    },
    {
        name: "Answer emails",
        defaultDuration: 1200
    },
    {
        name: "Put on make up",
        defaultDuration: 900
    },
    {
        name: "Meditate",
        defaultDuration: 600
    }
    // {
    //     name: "",
    //     defaultDuration:
    // },
];

let prePopSettings = [
    {
        name: "maxRecordings",
        value: 500
    },
    {
        name: "recCooldown",
        value: 5
    },
    {
        name: "chargeReminder",
        enabled: true
    },
    {
        name: "defaultShowHrsOfSleep",
        enabled: true
    }
];
let now = moment();

// Create Realm objects and write to local storage
function insertPrepopData() {
    realm.write(() => {
        /* Insert Sounds data */
        console.log("Insert Sounds");
        let defaultSound = realm.create("Sound", {
            id: uuid.v1(),
            files: SOUND_DATA[0].files,
            displayName: SOUND_DATA[0].displayName,
            category: SOUND_DATA[0].category,
            order: 0,
            type: SOUND_DATA[0].type,
            source: ""
        });
        for (let i = 1; i < SOUND_DATA.length; i++) {
            realm.create("Sound", {
                id: uuid.v1(),
                files: SOUND_DATA[i].files,
                displayName: SOUND_DATA[i].displayName,
                category: SOUND_DATA[i].category,
                order: i, // SOUND_DATA[i].order, // NOTE: Ignoring order property of SoundData, and just assinging by list order
                isPremium: SOUND_DATA[i].isPremium || false,
                type: SOUND_DATA[i].type,
                source: SOUND_DATA[i].source || ""
            });
        }

        /**** Create Tasks *****/
        let tasks = [];
        for (let index = 0; index < prePopTasks.length; index++) {
            tasks.push(
                realm.create("Task", {
                    id: uuid.v1(),
                    name: prePopTasks[index].name,
                    defaultDuration: prePopTasks[index].defaultDuration
                })
            );
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

        /* Create Fake Sleep Disturbances, and LogDates to group them by day */
        // console.log("dummy disturbances");
        // let distForAlarmInst = [];
        // let currTime = moment();
        // for (let index = 0; index < 10; index++) {
        //     let almEnd = moment(currTime.subtract(1, "hour"));
        //     almEnd.subtract(Math.random() * 60, "minutes");
        //     let almStart = moment(
        //         currTime.subtract(Math.floor(Math.random() * 12) + 6, "hour")
        //     );

        //     let distTime = moment(currTime);

        //     let timeSinceLastDist = 0;
        //     let timeAwakeAcum = 0;

        //     let almInstId = uuid.v1();
        //     let almInstPath = RNFS.DocumentDirectoryPath + "/" + almInstId;

        //     // create some disturbances for time range of alarm
        //     for (let i = 0; i < index % 3 == 0 ? 25 : index % 3; i++) {
        //         distTime.add(2 * i, "minutes");
        //         if (distTime.isAfter(almEnd)) {
        //             console.log("Exit early. distTime isAfter almEnd:");
        //             console.log("timeAwakeAcum", timeAwakeAcum);
        //             console.log("timeSinceLastDist", timeSinceLastDist);
        //             // timeAwakeAcum -= timeSinceLastDist;
        //             console.log("distTime", distTime.toDate());
        //             console.log("almEnd", almEnd.toDate());
        //             break;
        //         }

        //         let rec = i % 3 != 0 ? null : uuid.v1();

        //         let dist = realm.create("SleepDisturbance", {
        //             id: uuid.v1(),
        //             time: distTime.toDate(),
        //             recording: rec
        //         });

        //         if (rec) {
        //             // create 'fake' recording (real file, but not an actual recording')
        //             RNFS.mkdir(almInstPath)
        //                 .then(success => {
        //                     console.log("Dir created!");
        //                     RNFS.writeFile(
        //                         almInstPath + "/" + rec,
        //                         "test",
        //                         "utf8"
        //                     )
        //                         .then(success => {
        //                             console.log("FILE WRITTEN!");
        //                         })
        //                         .catch(err => {
        //                             console.log(err.message);
        //                         });
        //                 })
        //                 .catch(err => {
        //                     console.log(err.message);
        //                 });
        //         }

        //         distForAlarmInst.push(dist);

        //         timeSinceLastDist = 2 * (i + 1); // minutes till next disturbance

        //         if (timeSinceLastDist < 15) {
        //             timeAwakeAcum += timeSinceLastDist;
        //             console.log("timeSinceLastDist", timeSinceLastDist);
        //             console.log("timeAwakeAcum", timeAwakeAcum);
        //         }
        //     }
        //     realm.create("AlarmInstance", {
        //         id: almInstId,
        //         start: almStart.toDate(),
        //         end: almEnd.toDate(),
        //         disturbances: distForAlarmInst,
        //         timeAwake: timeAwakeAcum
        //     });
        //     currTime.subtract(1, "day");
        //     distForAlarmInst = [];
        // }

        /**** Create AlarmTasks *****/
        // AlarmTasks for alarm1
        const almTask1 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: tasks[2],
            order: 0,
            duration: 900
            // Since I'm not specifying 'duration' or 'enabled' values, the defaults will be used (see DataSchemas.js
            // to check the default values).
        });
        const almTask2 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: tasks[6],
            order: 1,
            duration: 1800
        });
        const almTask3 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: tasks[8],
            order: 2,
            duration: 600
        });
        const almTask4 = realm.create("AlarmTask", {
            id: uuid.v1(),
            task: tasks[9],
            order: 3,
            duration: 1800
        });

        // AlarmTasks for alarm2
        // const almTask9 = realm.create("AlarmTask", {
        //     id: uuid.v1(),
        //     task: task9,
        //     order: 3,
        //     duration: 1200
        // });
        // const almTask6 = realm.create("AlarmTask", {
        //     id: uuid.v1(),
        //     task: task6,
        //     order: 1,
        //     duration: 1200
        // });
        // const almTask3b = realm.create("AlarmTask", {
        //     id: uuid.v1(),
        //     task: task3,
        //     order: 2,
        //     duration: 1200
        // });
        // const almTask1b = realm.create("AlarmTask", {
        //     id: uuid.v1(),
        //     task: task1,
        //     order: 0,
        //     duration: 600
        // });

        let aSound1 = new AlarmSound();
        // let aSound2 = new AlarmSound();
        const alarmSound1 = realm.create("AlarmSound", {
            id: aSound1.id,
            sound: aSound1.sound,
            type: aSound1.type
        });

        /**** Create Alarms *****/
        console.log("Adding dummy alarms");

        let wake1 = moment("7:50", "HH:mm").toDate();
        wake1 = DateUtils.date_to_nextTimeInstance(wake1);

        let arrive1 = moment("9:15", "HH:mm").toDate();
        arrive1 = DateUtils.date_to_nextTimeInstance(arrive1);

        const alarm1 = realm.create("Alarm", {
            id: uuid.v1(),
            wakeUpTime: wake1, // NOTE: (TODO:) This time MUST match that calculated based on the alarmTasks and arrival time.
            //              Otherwise, it will be incorrect, until the first re-render.
            arrivalTime: arrive1,
            mode: "autocalc",
            tasks: [almTask1, almTask2, almTask3, almTask4],
            label: "Normal week day",
            status: ALARM_STATES.OFF, // if true, it is active, and will Ring at wakeUpTime.
            visible: true, // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
            preset: false, // if tr
            order: 0,
            alarmSound: alarmSound1,
            snoozeTime: DefaultAlarm().snoozeTime
        });

        // let wake2 = moment("10:00", "HH:mm").toDate();
        // wake2 = DateUtils.date_to_nextTimeInstance(wake2);

        // let arrive2 = moment("11:30", "HH:mm").toDate();
        // arrive2 = DateUtils.date_to_nextTimeInstance(arrive2);

        // const alarm2 = realm.create("Alarm", {
        //     id: uuid.v1(),
        //     wakeUpTime: wake2,
        //     arrivalTime: arrive2,
        //     mode: "autocalc",
        //     tasks: [almTask6, almTask9, almTask1b, almTask3b],
        //     label: "Wake up for appointment",
        //     status: ALARM_STATES.OFF, // if true, it is active, and will Ring at wakeUpTime.
        //     visible: true, // if true, this Alarm will appear in 'Alarms list' page. If false it won't appear, and if preset also false, will be entirely deleted.
        //     preset: false, // if tr
        //     order: 1,
        //     alarmSound: alarmSound2,
        //     snoozeTime: DefaultAlarm().snoozeTime
        // });
        // console.log(alarm2, alarm1, task2, task4, task5);
        console.log("Inserted pre-pop data");
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
