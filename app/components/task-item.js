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
        // console.log(`props for ${TaskItem.count++}`);
        // console.log(props);
        let data = props.data;
        this.state = {
            data: {
                name: data.task.name,
                duration: data.duration ? data.duration : data.task.defaultDuration,
                enabled: data.enabled
            }
        };
    }

    _onPress = () => {
        console.debug("TaskItem: onPress");
        console.debug(this.props.data);

        this.props.onPressItem(this.props.data);
    };

    onTapCheckBox(data) {
        data.enabled = !data.enabled;
        // console.debug("Clicked checkbox: now " + data.isChecked);
    }

    render() {
        return (
            <TouchableOpacity style={TaskListStyle.item} onPress={this._onPress}>
                <CheckBox onClick={() => this.onTapCheckBox(this.state.data) }
                          isChecked={this.state.data.enabled}
                />
                <Text style={[TaskListStyle.allChildren, TaskItemStyle.description]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      {...this.props} // the '...' is JavaScript way to expand variable # of args
                >
                    {this.state.data.name}
                </Text>
                <DurationText duration={this.state.data.duration} style={[TaskListStyle.allChildren, {flexGrow: 1}]}/>
            </TouchableOpacity>
        );
    }
}




export default TaskItem;