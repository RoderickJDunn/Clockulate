/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import DurationText from "./duration-text";
import CheckBox from 'react-native-check-box';

import { TaskListStyle, TaskItemStyle } from '../styles/list';

class TaskItem extends React.PureComponent {

    /*
    Receives an AlarmTask in the 'data' property:
        data: { id:"_"   // this is the AlarmTask id
          duration: #,
          enabled: bool,
          task: { id:"_", name:"Task name", defaultDuration: # }
        }
     */
    constructor(props) {
        super(props);
        let data = props.data;
    }

    _onPress = () => {
        console.debug("TaskItem: onPress");
        console.debug(this.props.data);

        this.props.onPressItem(this.props.data);
    };

    _onTapCheckBox = (data) => {
        console.debug(data);
        this.props.onPressItemCheckBox(data, data.enabled);
    };

    render() {
        console.debug("render task-item", this.props);
        let duration = this.props.data.duration ? this.props.data.duration : this.props.data.task.defaultDuration;
        return (
            <TouchableOpacity style={TaskListStyle.item} onPress={this._onPress}>
                <CheckBox onClick={() => this._onTapCheckBox(this.props.data) }
                          isChecked={this.props.data.enabled}
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