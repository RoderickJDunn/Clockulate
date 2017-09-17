/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity
} from "react-native";
import moment from "moment";

import realm from "../data/DataSchemas";
import TaskList from "../components/task-list";
import LabeledInput from "../components/labeled-input";
import LabeledTimeInput from "../components/labeled-time-input";
import Colors from "../styles/colors";
import { AlarmModel } from "../data/models";

class AlarmDetail extends Component {
    static navigationOptions = () => ({
        title: "Edit Alarm"
    });

    _calculatedWakeUpTime;

    constructor(props) {
        super(props);
        console.log("AlarmDetail -- Constructor");
        const { params } = props.navigation.state; // same as: " const params = props.navigation.state.params "
        if (params.newAlarm) {
            console.log("This is a new alarm");
            realm.write(() => {
                this.setState(realm.create("Alarm", new AlarmModel()));
            });
        } else {
            console.log("We are editing an existing alarm: ", params);
            this.state = params.alarm;
        }
    }

    // componentDidMount() {
    //     // setTimeout(() => {  // Temporarily disabled to save resources. (set back to setInterval).
    //     //     // console.log("Updating time and date");
    //     //     this.setState({
    //     //         time: moment().format("LT"),
    //     //         date: moment().format("LL"),
    //     //     });
    //     // }, 1000);
    // }

    componentWillMount() {
        console.debug("AlarmDetail componentWillMount");
    }

    componentDidMount() {
        console.debug("AlarmDetail --- ComponentDidMount");
        this.props.navigation.setParams({
            handleBackBtn: this.handleBackPress.bind(this)
        });
    }

    componentWillReceiveProps() {
        console.debug("AlarmDetail componentWillReceiveProps");
    }

    shouldComponentUpdate() {
        console.debug("AlarmDetail shouldComponentUpdate");
        return true;
    }

    componentWillUpdate() {
        console.debug("AlarmDetail componentWillUpdate");
    }

    componentDidUpdate() {
        console.debug("AlarmDetail componentDidUpdate");
    }

    /*
    NOTE: This method DOES get called when you push 'Back' do go back to parent screen. However, no lifecycle
          methods are called in the previous screen (not even Render()), so any work that you want to do in the
          parent screen on navigating back must be done by sending a callback fx upon initial navigation to this screen.
          The callback can be executed from 1) componentWillUnmount (in which case you might see the parent screen update
          after navigation back is complete), or 2) from a custom 'Back' function. This seems to work better, but
          requires you to define a custom back button in navigation options, then bind the onPress function of the
          back button to a function in the child screen (ie: this screen). See handleBackPress() -- I've done option 2.
     */
    // componentWillUnmount() {
    //     console.debug("AlarmDetail componentWillUnmount");
    // }

    handleBackPress() {
        console.debug("Going back to Alarms List");
        realm.write(() => {
            // TODO: This should work, but it seems that due to a bug, the Tasks list gets unlinked from the parent Alarm object. It should be fixed soon
            // https://github.com/realm/realm-js/issues/1124
            //realm.create('Alarm', this.state, true);
            // TODO: end

            // For Now, use this workaround //
            let alarm = realm
                .objects("Alarm")
                .filtered(`id = "${this.state.id}"`);
            if (alarm && alarm.length === 1) {
                alarm[0].label = this.state.label;
                alarm[0].arrivalTime = this.state.arrivalTime;
                if (this.state.mode ==='autocalc' && this._calculatedWakeUpTime) {
                    alarm[0].wakeUpTime = this._calculatedWakeUpTime;
                } 
                else {
                    alarm[0].wakeUpTime = this.state.wakeUpTime;
                }
            }
            //////////////////////////////////

            this.props.navigation.state.params.reloadAlarms();
            this.props.navigation.goBack();
        });
    }

    onPressAddTask() {
        let nextTaskPosition = this.state.tasks.length;
        this.props.navigation.navigate("TaskDetail", {
            onSaveTask: this.onTaskListChanged.bind(this),
            order: nextTaskPosition
        });
    }

    onTaskListChanged(newTask) {
        console.log("Task modified", newTask);
        // Check if Task is defined. This callback contains the newly created alarmTask, 
        // or nothing if an existing alarmTask was updated.
        if (newTask) {
            realm.write(() => {
                this.state.tasks.push(newTask);
            });
        }
        this.setState(this.state);
    }

    /*
    Called by a 'bubble-up' type functionality, since a reference to this function was passed as a prop to 'TaskList',
    which in turn passes the fx reference to each 'TaskItem' in that list.
    IMPORTANT: It is vital to either use an arrow function here (which uses the outer-scope 'this'), or if it is a
        regular function, bind the fx to 'this' in the outer scope (the screen) so that it has access to this.props.navigation.
     */
    _onPressTask = task => {
        console.debug("AlarmDetail: onPressTask -- task: ", task);

        // Need to use a workaround to delete the object, otherwise app will crash due to Realm bug when navigating after deleting passed Object:
        // Pass TaskAlarm ID instead of TaskAlarm object.
        const params = {
            alarmTaskId: task.id,
            onSaveTask: this.onTaskListChanged.bind(this)
        };

        this.props.navigation.navigate("TaskDetail", params);
    };

    onChangeLabel = text => {
        // console.log("Label text changed: ", text);
        this.setState({ label: text });
    };

    onLabelInputBlur = () => {
        console.debug("AlarmLabelInput blurred: ");
        // console.debug("this.state (Alarm): ", this.state);
        // TODO: Figure out if this method is needed. It can probably be removed.
    };

    onChangeTaskEnabled = (taskToUpdate, enabled) => {
        let tasks = this.state.tasks;
        let taskToChange = tasks.find(task => task.id === taskToUpdate.id);
        if (!taskToChange) {
            console.error(
                "Could not find task to update with new 'enabled' value. Searching for AlarmTask id: ",
                taskToChange.id
            );
            return;
        }
        realm.write(() => {
            taskToChange.enabled = !enabled;
        });
        this.setState({ tasks: tasks });
    };

    _calcWakeUpTime = () => {
        let totalTaskDurations = this.state.tasks
            .map(alarmTask => {
                if (alarmTask.enabled) {
                    return alarmTask.duration
                    ? alarmTask.duration
                    : alarmTask.task.defaultDuration;
                }
                else {
                    return 0;
                }
                
            })
            .reduce((a, b) => a + b, 0);
        totalTaskDurations *= 1000;
        console.log(totalTaskDurations);

        // save calculated wakeUpTime to use for saving to DB when user presses back
        this._calculatedWakeUpTime = this.state.arrivalTime - totalTaskDurations;

        return this._calculatedWakeUpTime;
    };

    render() {
        console.debug("AlarmDetail render - ");
        console.debug("AlarmDetail render - this.state: ", this.state);

        // Assign tasks to 'sortedTasks', first ordering them if there are >1
        let sortedTasks =
            this.state.tasks.length > 1
                ? this.state.tasks.sorted("order")
                : this.state.tasks;
        // console.debug(sortedTasks);

        let wakeUpTime;
        if (this.state.mode == "autocalc") {
            wakeUpTime = this._calcWakeUpTime();
        } else {
            wakeUpTime = this.state.wakeUpTime;
        }

        console.log("Wake up time: ", wakeUpTime);
        console.log("Arrival time: ", this.state.arrivalTime);

        return (
            <View style={styles.screenContainer}>
                <StatusBar style={{ backgroundColor: Colors.brandDarkGrey }} />
                <View style={styles.clockContainer}>
                    <Text style={styles.timeText}>
                        {moment
                            .utc(wakeUpTime)
                            .local()
                            .format("h:mm A")}
                    </Text>

                    <Text style={{ alignSelf: "flex-end" }}>My profile</Text>
                </View>

                <View style={styles.fieldsContainer}>
                    <LabeledTimeInput
                        labelText="Arrival Time"
                        fieldText={moment
                            .utc(this.state.arrivalTime)
                            .local()
                            .format("h:mm A")}
                        time={moment
                            .utc(this.state.arrivalTime)
                            .local()
                            .toDate()}
                        handleArrivalChange={time => {
                            console.log("Arrival Time textInput changed: ", time);
                            console.log("Arrival Time textInput changed: ", moment(time).unix());
                            this.setState({ arrivalTime: moment(time).unix() * 1000 });
                        }}
                        timePickerPrompt="What time do you need to arrive?"
                    />
                    <LabeledInput
                        labelText="Label"
                        placeholder="Enter a label"
                        fieldText={this.state.label}
                        handleTextInput={this.onChangeLabel}
                        onTextInputBlur={this.onLabelInputBlur}
                    />
                </View>
                <View style={styles.taskListContainer}>
                    <View style={styles.taskListHeader}>
                        <Text style={{ alignSelf: "flex-start" }}>Tasks</Text>
                        <TouchableOpacity
                            style={{ alignSelf: "flex-start" }}
                            onPress={this.onPressAddTask.bind(this)}
                        >
                            <Text numberOfLines={1}>Add Task</Text>
                        </TouchableOpacity>
                    </View>
                    <TaskList
                        onPressItem={this._onPressTask.bind(this)}
                        onPressItemCheckBox={this.onChangeTaskEnabled}
                        data={sortedTasks}
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    clockContainer: {
        backgroundColor: "#594483",
        flex: 4,
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
        padding: 10
    },
    fieldsContainer: {
        flex: 3,
        alignSelf: "stretch",
        alignItems: "flex-start",
        backgroundColor: "#dbd6dd",
        padding: 10,
        paddingBottom: 10
    },
    taskListContainer: {
        flex: 9,
        padding: 10,
        paddingTop: 0,
        alignSelf: "stretch",
        backgroundColor: "#dbd6dd"
    },
    taskListHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    timeText: {
        color: "#999999",
        fontSize: 80
    },
    dateText: {
        color: "#999999",
        fontSize: 40
    }
});

export default AlarmDetail;
