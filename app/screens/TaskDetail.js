/**
 * Created by rdunn on 2017-08-23.
 */

import React, { Component } from "react";
import {
    View,
    TextInput,
    StatusBar,
    TouchableOpacity,
    Text,
    StyleSheet
} from "react-native";
import { NavigationActions } from "react-navigation";

import realm from "../data/DataSchemas";
import LabeledInput from "../components/labeled-input";
import LabeledDurationInput from "../components/labeled-duration-input";
import { TaskModel, AlarmTaskModel } from "../data/models";
import ScreenStyles from "../styles/screens";
import Colors from "../styles/colors";
/*
This screen allows user to edit details about a Task: Specifically, its Name, Duration, and Enabled
 */
class TaskDetail extends Component {
    static navigationOptions = ({ navigation }) => ({
        title: "Edit Task"
    });

    nameChanged = false;
    initialName = "";
    /*
    Receives data about the Task that was tapped on the previous screen
     */
    constructor(props) {
        super(props);
        // console.log("TaskDetail -- Props: ", props);
        const { params } = props.navigation.state; // same as: " const params = props.navigation.state.params "
        if (!params || !params.hasOwnProperty("alarmTaskId")) {
            // We are creating a brand new task. Create a stub TaskAlarm object with default Task values

            let task = new TaskModel();
            this.state = {
                alarmTask: new AlarmTaskModel(task, params.order),
                onSaveState: params.onSaveState, // called when a task is Saved or Deleted
                newTask: true
            };
            // console.log(this.state.alarmTask);
        } else {
            let alarmTask = realm.objectForPrimaryKey(
                "AlarmTask",
                params.alarmTaskId
            );
            this.state = {
                // NOTE: We need to construct a new object from the Realm result here, otherwise any modifications to
                // the AlarmTask (duration change, name change, etc) will immediately result in saving to DB. So instead
                // of using the realm object directly, we create an alarmTask model for use within this screen.

                alarmTask: {
                    task: {
                        id: alarmTask.task.id,
                        name: alarmTask.task.name,
                        defaultDuration: alarmTask.task.defaultDuration
                    },
                    id: alarmTask.id,
                    duration: alarmTask.duration,
                    enabled: alarmTask.enabled,
                    order: alarmTask.order
                },
                onSaveState: params.onSaveState // called when a task is Saved or Deleted
            };
        }

        this.initialName = this.state.alarmTask.task.name;
    }

    componentDidMount() {
        // console.debug("TaskDetail --- ComponentDidMount");
        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions
        this.props.navigation.setParams({
            handleSave: this.handleSave.bind(this)
        });
    }

    handleSave() {
        // There are several things to think about:
        // 1. Is this a newly created Task being saved for the first time? Or it a task that's been edited?
        // 2. Do we need to edit/create a new Task, or just a new AlarmTask? Depends on whether Task name was changed

        // console.log("TaskDetail:handleSave: this.state", this.state);

        // Check if newTask
        let alarmTask;
        let prevAlarmTask = this.state.alarmTask;

        if (this.state.newTask) {
            // Create new Task and associated AlarmTask
            // console.log(this.state);
            prevAlarmTask = this.state.alarmTask;
            realm.write(() => {
                // NOTE: even though we need both a new Task and AlarmTask, we just need to create the AlarmTask,
                //        and the Task is automatically created. In fact, creating the Task then trying to create the
                //        corresponding AlarmTask afterward gives an error (duplicate primary key).
                alarmTask = realm.create("AlarmTask", prevAlarmTask);
            });
        } else {
            // We are editing a task. Check if name was modified
            let { navigation } = this.props;
            if (this.nameChanged) {
                // create a new Task and associated AlarmTask.
                // alert("Name was changed, saving as new Task and AlarmTask");
                realm.write(() => {
                    let idToDelete = prevAlarmTask.id; // get Id of AlarmTask to delete
                    let orderOfAlmTask = prevAlarmTask.order; // store the Order of AlarmTask to be deleted, to apply to the new one
                    realm.delete(
                        realm.objectForPrimaryKey("AlarmTask", idToDelete)
                    ); // delete the AlarmTask by ID

                    // Create new AlarmTask for the new task
                    const newTask = new TaskModel();
                    newTask.name = prevAlarmTask.task.name;
                    newTask.defaultDuration = prevAlarmTask.duration
                        ? prevAlarmTask.duration
                        : prevAlarmTask.task.defaultDuration
                          ? prevAlarmTask.task.defaultDuration
                          : 600;

                    alarmTask = new AlarmTaskModel(newTask, orderOfAlmTask);

                    alarmTask = realm.create("AlarmTask", alarmTask);
                });
            } else {
                // create/update the AlarmTask with the new duration
                // console.log("Name NOT changed, updating existing AlarmTask");
                realm.write(() => {
                    // NOTE: Here we are updating the AlarmTask in the DB by passing 'true' as the 3rd param of create()
                    //        This param specifies that it should be an update operation, rather than a creation.
                    // console.log('alarmTask', this.state.alarmTask);
                    realm.create("AlarmTask", prevAlarmTask, true);
                });
            }
        }

        this.state.onSaveState(alarmTask);
        this.props.navigation.dispatch(NavigationActions.back());
    }

    _onDeleteTask() {
        let alarmTaskRlmObject = realm.objectForPrimaryKey(
            "AlarmTask",
            this.state.alarmTask.id
        );
        if (alarmTaskRlmObject) {
            realm.write(() => {
                realm.delete(alarmTaskRlmObject);
            });
        }
        this.state.onSaveState();
        this.props.navigation.dispatch(NavigationActions.back());
    }

    _onTaskNameChange(text) {
        const updatedAlmTask = this.state.alarmTask;
        updatedAlmTask.task.name = text;
        this.setState({ alarmTask: updatedAlmTask });
        if (this.initialName !== text) {
            this.nameChanged = true;
        }
    }

    _onTaskDurationChanged(duration) {
        // console.debug("Task duration changed: ", duration);
        const updatedAlmTask = this.state.alarmTask;
        updatedAlmTask.duration = duration;
        this.setState({ alarmTask: updatedAlmTask });
    }

    render() {
        // console.log("this.state", this.state);
        return (
            <View style={ScreenStyles.TaskScreen}>
                <LabeledInput
                    labelText="TASK NAME"
                    placeholder="Enter a task name"
                    fieldText={this.state.alarmTask.task.name}
                    handleTextInput={this._onTaskNameChange.bind(this)}
                />
                <LabeledDurationInput
                    labelText="DURATION"
                    time={
                        this.state.alarmTask.duration
                            ? this.state.alarmTask.duration
                            : this.state.alarmTask.task.defaultDuration
                    }
                    onChange={this._onTaskDurationChanged.bind(this)}
                />
                <TouchableOpacity
                    style={Styles.DeleteButton}
                    onPress={this._onDeleteTask.bind(this)}
                >
                    <Text style={{ color: "white", fontSize: 18 }}>Delete</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

export default TaskDetail;

const Styles = StyleSheet.create({
    DeleteButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: Colors.deleteBtnRed,
        alignSelf: "stretch",
        height: 50,
        alignItems: "center",
        justifyContent: "center"
    }
});
