/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TextInput,
    TouchableOpacity
} from 'react-native';
import moment from 'moment';

import realm from '../data/DataSchemas';
import TaskList from '../components/task-list';
import LabeledInput from '../components/labeled-input'
import Colors from '../styles/colors'
import { DefaultAlarm } from '../data/constants'
import { AlarmModel } from '../data/models'


class AlarmDetail extends Component {

    static navigationOptions = ({ navigation }) => ({
        title: "Edit Alarm",
    });

    constructor(props) {
        super(props);
        console.log("AlarmDetail -- Props: ", props);
        const { params } = props.navigation.state; // same as: " const params = props.navigation.state.params "
        if (params.newAlarm) {
            console.log("This is a new alarm");
            this.state = new AlarmModel();
        }
        else {
            this.state = params;
        }

    }

    componentDidMount() {
        // setTimeout(() => {  // Temporarily disabled to save resources. (set back to setInterval).
        //     // console.log("Updating time and date");
        //     this.setState({
        //         time: moment().format("LT"),
        //         date: moment().format("LL"),
        //     });
        // }, 1000);
    }

    onPressAddTask() {
        let nextTaskPosition = this.state.tasks.length;
        this.props.navigation.navigate('TaskDetail',
            {onSaveTask: this.onTaskListChanged.bind(this),
             order: nextTaskPosition});
    }


    onTaskListChanged(newTask) {
        console.log("Task modified", newTask);
        // Check if Task is defined. This callback contains the newly created task, or nothing if an existing task was updated.
        if (newTask) {
            // Task is defined
            realm.write(() => {
                let updatedTasks = this.state.tasks;
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
    _onPressTask = (task) => {
        console.debug("AlarmDetail: onPressTask -- task: ", task);

        // Need to use a workaround to delete the object, otherwise app will crash due to Realm bug when navigating after deleting passed Object:
        // Pass TaskAlarm ID instead of TaskAlarm object.
        const params = {alarmTaskId: task.id, onSaveTask: this.onTaskListChanged.bind(this)};

        this.props.navigation.navigate('TaskDetail', params);
    };

    onChangeLabel = (text) => {
        // console.log("Label text changed: ", text);
        this.setState({label: text});
    };

    onChangeTaskEnabled = (taskToUpdate, enabled) => {
        let tasks = this.state.tasks;
        let taskToChange = tasks.find(task => task.id === taskToUpdate.id);
        if (!taskToChange) {
            console.error("Could not find task to update with new 'enabled' value. Searching for AlarmTask id: ", modifiedTask.id);
            return;
        }
        realm.write(() => {
            taskToChange.enabled = !enabled;
        });
        this.setState({tasks: tasks});
    };

    render() {
        // console.debug("AlarmDetail render - this.state: ", this.state);

        // Assign tasks to 'sortedTasks', first ordering them if there are >1
        let sortedTasks = this.state.tasks.length > 1 ? this.state.tasks.sorted('order') : this.state.tasks;
        // console.debug(sortedTasks);

        return (
            <View style={styles.screenContainer}>
                <StatusBar style={{backgroundColor: Colors.brandDarkGrey}}/>
                <View style={styles.clockContainer}>
                        <Text style={styles.timeText}>
                            {moment.unix(this.state.wakeUpTime).utc().format("h:mm A")}
                        </Text>

                        <Text style={{alignSelf: "flex-end"}}>My profile</Text>
                </View>

                <View style={styles.fieldsContainer}>
                    <LabeledInput
                          labelText="Arrival Time"
                          fieldText={moment.unix(this.state.arrivalTime).utc().format("h:mm A")}
                          handleTextInput={() => console.log("Arrival Time textInput changed")}>
                    </LabeledInput>
                    <LabeledInput
                          labelText="Label"
                          placeholder="Enter a label"
                          fieldText={this.state.label}
                          handleTextInput={this.onChangeLabel}  >
                    </LabeledInput>
                </View>
                <View style={styles.taskListContainer}>
                    <View style={styles.taskListHeader}>
                        <Text style={{alignSelf: 'flex-start'}}>Tasks</Text>
                        <TouchableOpacity style={{alignSelf: "flex-start"}} onPress={this.onPressAddTask.bind(this)}>
                            <Text numberOfLines={1}>
                                Add Task
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TaskList
                        onPressItem={this._onPressTask.bind(this)}
                        onPressItemCheckBox={this.onChangeTaskEnabled}
                        data={sortedTasks}/>
            </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockContainer: {
        backgroundColor: '#594483',
        flex: 4,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    fieldsContainer: {
        flex: 3,
        alignSelf: 'stretch',
        alignItems: 'center',
        backgroundColor: "#dbd6dd",
        padding: 10,
        paddingBottom: 10,
    },
    taskListContainer: {
        flex: 9,
        padding: 10,
        paddingTop: 0,
        alignSelf: 'stretch',
        backgroundColor: "#dbd6dd"
    },
    taskListHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    timeText: {
        color: '#999999',
        fontSize: 80,
    },
    dateText: {
        color: '#999999',
        fontSize: 40,
    },
});

export default AlarmDetail;