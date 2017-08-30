/**
 * Created by rdunn on 2017-08-23.
 */

import React, {Component} from 'react';
import {
    View,
    TextInput,
    StatusBar
} from 'react-native';
import moment from 'moment';

import LabeledInput from '../components/labeled-input'
import LabeledTimeInput from "../components/labeled-time-input";
import { DefaultTask } from '../data/constants';

/*
This screen allows user to edit details about a Task: Specifically, its Name, Duration, and Enabled
 */
class TaskDetail extends Component {

    static navigationOptions = ({navigation}) => ({
        title: "Edit Task"
    });


    /*
    Receives data about the Task that was tapped on the previous screen
     */
    constructor(props) {
        super(props);
        console.log("TaskDetail -- Props: ");
        console.log(props);
        const {params} = props.navigation.state; // same as: " const params = props.navigation.state.params "
        if (params.newTask) {
            this.state = {
                task: {
                    name: DefaultTask.name,
                    defaultDuration: DefaultTask.duration,
                },
            };
        }
        else {
            this.state = {
                name: params.name,
                duration: params.duration,

            };
        }
    }

    render() {
        console.log(this.state);
        return (
            <View style={{backgroundColor: 'transparent', flexDirection: 'column'}}>
                <StatusBar style={{backgroundColor: 'transparent'}}/>
                <View>
                    <LabeledInput
                        labelText="Task Description"
                        fieldText={this.state.task.name}>
                    </LabeledInput>
                    <LabeledTimeInput
                      labelText="Duration"
                      fieldText={this.state.duration ? this.state.duration : this.state.task.defaultDuration}>
                    </LabeledTimeInput>
                </View>
            </View>
        );
    }

}

export default TaskDetail;
