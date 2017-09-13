/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import DurationText from "./duration-text";
import CheckBox from 'react-native-check-box';

import { TaskListStyle, TaskItemStyle } from '../styles/list';

class TaskItem extends React.PureComponent {

    static count = 0;

    /*
    Receives an AlarmTask with the structure:
        { id:"_"   // this is the AlarmTask id
          duration: #,
          enabled: bool,
          task: { id:"_", name:"Task name", defaultDuration: # }
        }
     */
    constructor(props) {
        super(props);
        let data = props.data;
        this.state = {
            name: data.task.name,
            duration: data.duration ? data.duration : data.task.defaultDuration,
            enabled: data.enabled
        };
    }

    _onPress = () => {
        console.debug("TaskItem: onPress");
        console.debug(this.props.data);

        this.props.onPressItem(this.props.data);
    };

    onTapCheckBox(data) {
        console.debug(data);
        this.setState({'enabled': !data.enabled});
        console.debug("Clicked checkbox: now " + !data.enabled);

        // TODO: Save to database
    }

    render() {
        console.debug("render task-item", this.props);
        let duration = this.props.data.duration ? this.props.data.duration : this.props.data.task.defaultDuration;
        return (
            <TouchableOpacity style={TaskListStyle.item} onPress={this._onPress}>
                <CheckBox onClick={() => this.onTapCheckBox(this.state) }
                          isChecked={this.state.enabled}
                          style={TaskItemStyle.checkbox}
                />
                <Text style={[TaskListStyle.allChildren, TaskItemStyle.description]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      {...this.props} // the '...' is JavaScript way to expand variable # of args
                >
                    {this.props.data.task.name}
                </Text>
                <DurationText duration={duration} style={[TaskListStyle.allChildren, TaskItemStyle.duration]}/>
            </TouchableOpacity>
        );
    }
}




export default TaskItem;