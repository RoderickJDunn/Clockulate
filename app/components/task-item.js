/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Slider,
    PanResponder,
    Dimensions,
    Animated
} from "react-native";
import Interactable from "react-native-interactable";
import EntypoIcon from "react-native-vector-icons/Entypo";

import DurationText from "./duration-text";
// import CheckBox from "react-native-check-box";
import { CheckBox } from "native-base";
import Colors from "../styles/colors";

import { TaskListStyle, TaskItemStyle } from "../styles/list";
import { TextStyle } from "../styles/text";
import TouchableBackdrop from "../components/touchable-backdrop";
import { scaleByFactor } from "../util/font-scale";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MAX_SLIDER_VALUE = 7200; // this is 2 hours, in seconds
class TaskItem extends React.PureComponent {
    /*
    Props: Receives an AlarmTask in the 'data' property:
        data: { id:"_"   // this is the AlarmTask id
          duration: #,
          enabled: bool,
          task: { id:"_", name:"Task name", defaultDuration: # }
        }
     */

    constructor() {
        super();
        this.state = {
            tempDuration: null,
            position: new Animated.Value(0)
        };
    }

    componentWillMount() {
        this._animatedValue = 0;
        this.state.position.addListener(
            value => (this._animatedValue = value.value)
        );

        let longPressFired = false;
        let longPressTmo = null;
        let touchStartTime = null;
        this._panResponder = PanResponder.create({
            // Ask to be the responder:
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                console.log("onMoveShouldSetPanResponder");
                // return touchStartTime == null ? true : longPressFired;
                return true;
            },
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                console.log("onMoveShouldSetPanResponderCapture");
                // return longPressFired;
                return true;
            },
            // onStartShouldSetPanResponder: () => true,
            // onStartShouldSetPanResponderCapture: (evt, gestureState) => {
            //     // Set opacity of button to half
            //     // PanResponder always capturing
            //     return true;
            // },
            // At each drag start
            onPanResponderGrant: (evt, gestureState) => {
                console.log("onPanResponderGrant");
                // Add offset of last position
                // position.setOffset(position.__getValue());
                // // Resets to x:0 and y:0
                // position.setValue({ x: 0, y: 0 });

                this.state.position.setOffset(this._animatedValue);
                this.state.position.setValue(0); //Initial value

                this._touchable.setOpacityTo(0.5, 100);
                touchStartTime = new Date();
                console.log("evt", evt.nativeEvent.locationX);
                console.log("evt", evt.nativeEvent.pageX);
                console.log("test log");
                let tempDuration =
                    (evt.nativeEvent.pageX /
                        (SCREEN_WIDTH - scaleByFactor(10, 0.4))) *
                    MAX_SLIDER_VALUE;
                longPressTmo = setTimeout(() => {
                    longPressFired = true;
                    this._onLongPress(tempDuration);
                }, 500);
            },
            // onPanResponderMove: Animated.event([
            //     null, // ignore the native event
            //     // extract dx and dy from gestureState
            //     // like 'pan.x = gestureState.dx, pan.y = gestureState.dy'
            //     { dx: this.state.position }
            // ]),
            onPanResponderMove: (event, gesture) => {
                console.log("onPanResponderMove", event.nativeEvent.pageX);

                // If user drags more that 3px around
                if (
                    gesture.dx > 3 ||
                    gesture.dy > 3 ||
                    gesture.dy < -3 ||
                    gesture.dx < -3
                ) {
                    clearTimeout(longPressTmo);
                    let now = new Date();
                    let timeDiff = now.getTime() - touchStartTime.getTime();
                    console.log("timediff", timeDiff);
                    if (timeDiff < 500) {
                        longPressFired = false;
                    }
                    if (longPressFired) {
                        // Start moving the view around
                        // position.setValue({ x: gesture.dx, y: gesture.dy });
                        // // Reset button Opacity
                        // this._touchable.setOpacityTo(1, 100);
                        let tempDuration =
                            (event.nativeEvent.pageX /
                                (SCREEN_WIDTH - scaleByFactor(10, 0.4))) *
                            MAX_SLIDER_VALUE;
                        this.setState({ tempDuration: tempDuration });
                    }
                }

                Animated.event([
                    null, // ignore the native event
                    // extract dx and dy from gestureState
                    // like 'pan.x = gestureState.dx, pan.y = gestureState.dy'
                    { dx: this.state.position }
                ])(event, gesture);
            },
            // When the user releases touch
            onPanResponderRelease: (event, gesture) => {
                console.log("onPanResponderRelease");
                this.state.position.flattenOffset();
                clearTimeout(longPressTmo);
                // If the user didn't move more than 3px around, I consider it as a press on the button
                if (
                    gesture.dx < 3 &&
                    gesture.dx > -3 &&
                    gesture.dy < 3 &&
                    gesture.dy > -3 &&
                    longPressFired == false
                ) {
                    // Launch button on click
                    this._touchable.touchableHandlePress();
                    // Reset button opacity
                } else {
                    this.setState({ tempDuration: null });
                }
                // this._touchable.setOpacityTo(1, 100);
                longPressFired = false;
            }
        });
    }

    componentWillUnmount() {
        this.state.position.removeAllListeners();
    }

    _onPress = () => {
        console.debug("TaskItem: onPress");
        // console.debug(this.props.data);
        if (!this.props.disabled) {
            this.props.onPressItem(this.props.data);
        }
    };

    _onPressDelete = () => {
        console.debug("TaskItem: onPressDelete");
        this.props.onPressDelete(this.props.data);
    };

    _onTapCheckBox = data => {
        // console.debug(data);
        this.props.onPressItemCheckBox(data, data.enabled);
    };

    _onLongPress = initialVal => {
        console.log("_onLongPress task");
        this.setState({ tempDuration: 600 });
    };

    render() {
        console.debug("render task-item");
        // console.debug("render task-item", this.props);

        /* Statement Explanation: 
            - Use tempDuration if not null (this means the slider is showing)
            - Otherwise, check if there is a user-set duration for this AlarmTask, if there is, use it
            - Otherwise, use the default duration for this Task
        */
        let duration =
            this.state.tempDuration ||
            (this.props.data.duration
                ? this.props.data.duration
                : this.props.data.task.defaultDuration);

        // let interactableRef = el => (this.interactiveRef = el);
        console.log("duration", duration);

        // console.log(
        //     "Checking whether to setTimeout. close : " + this.props.closed
        // );

        console.log("this.state.tempDuration", this.state.tempDuration);

        let touchableBackdrop = null;
        // if (this.props.closed == true) {
        //     setTimeout(() => {
        //         // console.log("Timeout closing task delete view...");
        //         this.interactiveRef.snapTo({ index: 0 });
        //     }, 0);
        // }
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

        let leftBtn;
        if (this.props.isEditingTasks) {
            leftBtn = (
                <EntypoIcon
                    name="dots-three-horizontal"
                    size={scaleByFactor(17, 0.3)}
                    color="#7a7677"
                />
            );
        } else {
            leftBtn = (
                <CheckBox
                    onPress={() => this._onTapCheckBox(this.props.data)}
                    checked={this.props.data.enabled}
                    style={{
                        marginLeft: 0,
                        paddingTop: 1,
                        paddingLeft: 0,
                        backgroundColor: Colors.brandLightPurple,
                        borderColor: "transparent",
                        alignItems: "center"
                    }}
                    hitSlop={{
                        top: 15,
                        bottom: 15,
                        left: 5,
                        right: 15
                    }}
                />
            );
        }
        return (
            <Animated.View
                style={[
                    TaskListStyle.taskRow,
                    {
                        alignContent: "flex-start",
                        transform: [{ translateX: this.state.position }]
                    }
                ]}
                // {...this.props.sortHandlers}
                {...this._panResponder.panHandlers}
                // snapPoints={[
                //     { x: 0, id: "closed" },
                //     { x: -90, id: "active" }
                // ]}
                // dragWithSpring={{ tension: 500, damping: 0.5 }}
                // animatedNativeDriver={true}
                // onSnap={e => {
                //     // console.log("Snapping");
                //     this.props.onSnapTask(e.nativeEvent.id);
                // }}
            >
                <View
                    style={TaskItemStyle.taskInfoWrap}
                    // {...this._panResponder.panHandlers}
                >
                    <TouchableOpacity
                        style={TaskItemStyle.taskInfoWrap}
                        ref={touchable => (this._touchable = touchable)}
                        onPress={this._onPress.bind(this)}
                        onLongPress={this._onLongPress.bind(this)}
                        // {...this.props.sortHandlers}
                    >
                        <View style={TaskItemStyle.checkbox}>{leftBtn}</View>
                        <Text
                            style={[
                                TaskListStyle.allChildren,
                                TaskItemStyle.description
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            selectable={false}
                        >
                            {this.props.data.task.name}
                        </Text>
                        <DurationText
                            duration={duration}
                            short={true}
                            style={[
                                TaskListStyle.allChildren,
                                TaskItemStyle.duration,
                                TextStyle.timeText,
                                { fontSize: 24 }
                            ]}
                        />
                    </TouchableOpacity>
                    {this.state.tempDuration != null && (
                        <Slider
                            ref={component => (this._sliderRef = component)}
                            style={[styles.slider]}
                            maximumValue={MAX_SLIDER_VALUE}
                            minimumValue={0}
                            step={5}
                            value={duration}
                            onStartShouldSetResponder={() => {
                                console.log("onStartShouldSetResponder");
                                return true;
                            }}
                            onMoveShouldSetResponder={() => {
                                console.log("onMoveShouldSetResponder");
                                return true;
                            }}
                            onResponderReject={() => {
                                console.log("onResponderReject");
                            }}
                            onSlidingComplete={value => {
                                console.log(
                                    "Finished sliding. Final value: " + value
                                );
                                this.setState({ tempDuration: null });
                            }}
                        />
                    )}
                </View>
                {touchableBackdrop}
                <TouchableOpacity
                    style={[TaskItemStyle.deleteBtn]}
                    onPress={this._onPressDelete}
                >
                    <Text style={TaskItemStyle.deleteBtnText}>DELETE</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.9,
        backgroundColor: "transparent",
        flexDirection: "row"
    },
    slider: {
        position: "absolute",
        backgroundColor: "blue",
        top: 0,
        left: 0,
        right: 70,
        bottom: 0,
        flex: 1
    }
});

export default TaskItem;
