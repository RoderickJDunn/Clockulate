/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import DurationText from "./duration-text";
// import CheckBox from "react-native-check-box";
import { CheckBox } from "native-base";
import Colors from "../styles/colors";

import { TaskListStyle, TaskItemStyle } from "../styles/list";
import { TextStyle } from "../styles/text";

class TaskItem extends React.PureComponent {
    /*
    Props: Receives an AlarmTask in the 'data' property:
        data: { id:"_"   // this is the AlarmTask id
          duration: #,
          enabled: bool,
          task: { id:"_", name:"Task name", defaultDuration: # }
        }
     */

    _onPress = () => {
        console.debug("TaskItem: onPress");
        // console.debug(this.props.data);

        this.props.onPressItem(this.props.data);
    };

    _onTapCheckBox = data => {
        // console.debug(data);
        this.props.onPressItemCheckBox(data, data.enabled);
    };

    render() {
        // console.debug("render task-item", this.props);
        let duration = this.props.data.duration
            ? this.props.data.duration
            : this.props.data.task.defaultDuration;
        return (
            <TouchableOpacity
                style={TaskListStyle.item}
                onPress={this._onPress}
            >
                <View style={TaskItemStyle.checkbox}>
                    <CheckBox
                        onPress={() => this._onTapCheckBox(this.props.data)}
                        checked={this.props.data.enabled}
                        style={{
                            marginLeft: -7,
                            paddingTop: 1,
                            backgroundColor: Colors.brandLightPurple,
                            borderColor: "transparent"
                        }}
                        hitSlop={{ top: 15, bottom: 15, left: 5, right: 15 }}
                    />
                </View>
                <Text
                    style={[
                        TaskListStyle.allChildren,
                        TaskItemStyle.description
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    {...this.props} // the '...' is JavaScript way to expand variable # of args
                >
                    {this.props.data.task.name}
                </Text>
                <DurationText
                    duration={duration}
                    style={[
                        TaskListStyle.allChildren,
                        TaskItemStyle.duration,
                        TextStyle.timeText
                    ]}
                />
            </TouchableOpacity>
        );
    }
}

export default TaskItem;
