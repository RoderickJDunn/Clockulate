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
    Button
} from 'react-native';
import moment from 'moment';
import TaskList from '../components/task-list';
import LabeledInput from '../components/labeled-input'
import Colors from '../styles/colors'
import { DefaultAlarm } from '../data/constants'

class AlarmDetail extends Component {

    static navigationOptions = ({ navigation }) => ({
        title: "Edit Alarm",
    });

    constructor(props) {
        super(props);
        console.log("AlarmDetail -- Props: ");
        console.log(props);
        const { params } = props.navigation.state; // same as: " const params = props.navigation.state.params "
        if (params.newAlarm) {
            console.log("This is a new alarm");
            this.state = {
                wakeUpTime: DefaultAlarm.wakeUpTime,
                arrivalTime: DefaultAlarm.arrivalTime,
                label: DefaultAlarm.label,
                mode: DefaultAlarm.mode,
                tasks: DefaultAlarm.tasks,
            };
        }
        else {
            console.log("We are editing an old alarm");
            console.log("Test params.wakeUpTime *************");
            console.log(params.wakeUpTime);
            this.state = {
                wakeUpTime: params.wakeUpTime,
                arrivalTime: params.arrivalTime,
                label: params.label,
                mode: params.mode,
                tasks: params.tasks,
            };
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

    handleAddTask() {
        this.props.navigation.navigate('TaskDetail', {newTask: true});
    }

    /*
    Called by a 'bubble-up' type functionality, since a reference to this function was passed as a prop to 'TaskList',
    which in turn passes the fx reference to each 'TaskItem' in that list.
    IMPORTANT: It is vital to bind this function to 'this' in the outer scope (the screen) so that it has access
    to props.navigation. [See the 'onPressItem' prop of 'TaskList' in the render() function.]
     */
    _onPressTask = (task) => {
        console.debug("AlarmDetail: onPressTask");
        // console.debug(this.props);
        console.debug(task);

        this.props.navigation.navigate('TaskDetail', task);
    };

    render() {
        console.debug("AlarmDetail: render2");
        // console.debug(this.props);

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
                          fieldText={moment.unix(this.state.arrivalTime).utc().format("h:mm A")} >
                    </LabeledInput>
                    <LabeledInput
                          labelText="Label"
                          placeholder="Enter a label"
                          fieldText={this.state.label}>
                    </LabeledInput>
                </View>
                <View style={styles.taskListContainer}>
                    <View style={styles.taskListHeader}>
                        <Text>Tasks</Text>
                        <Button style={{alignSelf: "flex-end"}} title="Add Task" onPress={this.handleAddTask.bind(this)}/>
                    </View>
                    <TaskList
                        onPressItem={this._onPressTask.bind(this)}
                        data={this.state.tasks}/>
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
        alignItems: 'flex-start',
        padding: 10,
    },
    taskListContainer: {
        flex: 9,
        padding: 10,
        alignSelf: 'stretch',
        backgroundColor: "#EA5"
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