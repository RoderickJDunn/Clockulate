import uuid from "react-native-uuid";
import realm from "../data/DataSchemas";

let tasks = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z"
];

export function createAlarmTasks(alarm) {
    let myTasks = realm.objects("Task").reduce((accum, task) => {
        if (tasks.indexOf(task.name) >= 0) {
            accum.push(task.name);
        }
        return accum;
    }, []);

    console.log("myTasks", myTasks);

    if (myTasks.length < 26) {
        let missingTasks = tasks.filter(item => myTasks.indexOf(item) == -1);
        console.log("missingTasks", missingTasks);
        realm.write(() => {
            for (let index = 0; index < missingTasks.length; index++) {
                realm.create("Task", {
                    id: uuid.v1(),
                    name: missingTasks[index],
                    defaultDuration: 0
                });
            }
        });
    }

    let azTasks = realm.objects("Task").reduce((accum, task) => {
        if (tasks.indexOf(task.name) >= 0) {
            accum.push(task);
        }
        return accum;
    }, []);

    let alarmTasks = [];

    realm.write(() => {
        // create the AlarmTasks and add them to Alarm
        for (let i = 0; i < azTasks.length; i++) {
            alarmTasks.push(
                realm.create("AlarmTask", {
                    id: uuid.v1(),
                    task: azTasks[i],
                    order: i,
                    duration: 0
                })
            );
        }

        alarm.tasks = alarmTasks;
    });
}
