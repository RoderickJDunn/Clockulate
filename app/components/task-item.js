/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback
} from "react-native";
import Interactable from "react-native-interactable";

import DurationText from "./duration-text";
// import CheckBox from "react-native-check-box";
import { CheckBox } from "native-base";
import Colors from "../styles/colors";

import { TaskListStyle, TaskItemStyle } from "../styles/list";
import { TextStyle } from "../styles/text";
import TouchableBackdrop from "../components/touchable-backdrop";

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
        console.debug("TaskItem: onPress");
        // console.debug(this.props.data);

        this.props.onPressItem(this.props.data);
    };

    _onPressDelete = () => {
        console.debug("TaskItem: onPressDelete");
        this.props.onPressDelete(this.props.data);
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

        let interactableRef = el => (this.interactiveRef = el);

        console.log(
            "Checking whether to setTimeout. close : " + this.props.closed
        );

        let touchableBackdrop = null;
        if (this.props.closed == true) {
            setTimeout(() => {
                console.log("Timeout closing task delete view...");
                this.interactiveRef.snapTo({ index: 0 });
            }, 0);
        }
        if (this.props.activeTask != null) {
            touchableBackdrop = (
                <TouchableBackdrop
                    style={[
                        TaskItemStyle.taskInfoWrap,
                        { backgroundColor: "transparent" }
                    ]}
                    onPress={() => {
                        this.props.closeTaskRows();
                    }}
                />
            );
        }
        return (
            <Interactable.View
                ref={interactableRef}
                style={[TaskListStyle.taskRow]}
                horizontalOnly={true}
                snapPoints={[{ x: 0, id: "closed" }, { x: -85, id: "active" }]}
                dragWithSpring={{ tension: 500, damping: 0.5 }}
                animatedNativeDriver={true}
                onSnap={e => {
                    console.log("Snapping");
                    this.props.onSnapTask(e.nativeEvent.id);
                }}
            >
                <TouchableOpacity
                    style={TaskItemStyle.taskInfoWrap}
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
                            hitSlop={{
                                top: 15,
                                bottom: 15,
                                left: 5,
                                right: 15
                            }}
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
                {touchableBackdrop}
                <TouchableOpacity
                    style={[TaskItemStyle.deleteBtn]}
                    onPress={this._onPressDelete}
                >
                    <Text style={TaskItemStyle.deleteBtnText}>DELETE</Text>
                </TouchableOpacity>
            </Interactable.View>
        );
    }
}

export default TaskItem;
