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
import { CheckBox } from "native-base";
import Colors from "../styles/colors";

import { TaskListStyle, TaskItemStyle } from "../styles/list";
import { TextStyle } from "../styles/text";
import TouchableBackdrop from "../components/touchable-backdrop";
import { scaleByFactor } from "../util/font-scale";
import * as CONST_DIMENSIONS from "../styles/const_dimensions";

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

    /* This flag is required to indicate that a user has actually started sliding (ie. onMoveShouldSetPanResponder 
        has been called and returned true, and the PanResponder has been granted.) This is to distinguish from
        the case where the user has longPressed a task and the slider is showing, but since they have not slided 
        their finger yet, the panResponder has not been granted. Without this flag, the user could release from
        the longPress without sliding at all, and there would be no functionality to remove the slider (since
        this was previously all done in panResponder callbacks). Now, the 'onPressOut' callback of the 
        TouchableOpacity will remove the slider from the view if the _isSliding flag is set to false (indicating
        that the user never actually slid their finger).    
    */
    _isSliding = false;

    constructor() {
        super();
        this.state = {
            tempDuration: null
        };
    }

    componentWillMount() {
        this._panResponder = PanResponder.create({
            // Ask to be the responder:
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // console.log("onMoveShouldSetPanResponder");
                // console.log("Returning: ", this.state.tempDuration != null);

                /* If tempDuration is null, the slider is not showing, so return false
                    Otherwise, if tempDuration is not null, the slider is showing, so we need to follow gestures. Return true
                */
                return this.state.tempDuration != null;
            },
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                // console.log("onMoveShouldSetPanResponderCapture");
                // console.log("Returning: ", this.state.tempDuration != null);

                /* If tempDuration is null, the slider is not showing, so return false
                    Otherwise, if tempDuration is not null, the slider is showing, so we need to follow gestures. Return true
                */
                return this.state.tempDuration != null;
            },
            // At each drag start
            onPanResponderGrant: (evt, gestureState) => {
                console.log("onPanResponderGrant");

                this._touchable.setOpacityTo(0.5, 100);
                console.log("evt", evt.nativeEvent.locationX);
                console.log("evt", evt.nativeEvent.pageX);
                this._isSliding = true;
                // let tempDuration =
                //     (evt.nativeEvent.pageX /
                //         (SCREEN_WIDTH - scaleByFactor(10, 0.4))) *
                //     MAX_SLIDER_VALUE;
            },

            onPanResponderMove: (event, gesture) => {
                console.log("onPanResponderMove", event.nativeEvent.pageX);

                // If user drags more that 3px around
                if (
                    gesture.dx > 3 ||
                    gesture.dy > 3 ||
                    gesture.dy < -3 ||
                    gesture.dx < -3
                ) {
                    let tempDuration =
                        (event.nativeEvent.pageX /
                            (SCREEN_WIDTH -
                                CONST_DIMENSIONS.TASK_DELETE_BTN_WIDTH -
                                scaleByFactor(10, 0.4))) *
                        MAX_SLIDER_VALUE;

                    /* this line converts the value (currently in seconds with a decimal), to an seconds integer
                     that is a multiple of 60 (so that it can be converted to minutes with no remainder)*/
                    tempDuration = Math.trunc(tempDuration / 60) * 60;
                    this.setState({ tempDuration: tempDuration });
                }
            },
            // When the user releases touch
            onPanResponderRelease: (event, gesture) => {
                console.log("onPanResponderRelease");

                // If the user didn't move more than 3px around, I consider it as a press on the button
                if (
                    gesture.dx < 3 &&
                    gesture.dx > -3 &&
                    gesture.dy < 3 &&
                    gesture.dy > -3 &&
                    this.state.tempDuration == null
                ) {
                    // Launch button on click
                    this._touchable.touchableHandlePress();
                    // Reset button opacity
                } else {
                    this.setState({ tempDuration: null });
                    this._onDurationChange();
                }
                this._touchable.setOpacityTo(1, 100);

                this._isSliding = false;
            },
            onPanResponderTerminationRequest: (evt, gestureState) => {
                // console.log("onPanResponderTerminationRequest");
                return true;
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // console.log("onPanResponderTerminate");
                // Another component has become the responder, so this gesture
                // should be cancelled
                this.setState({ tempDuration: null });
                this._onDurationChange();

                this._isSliding = false;
            }
        });
    }

    // componentWillUnmount() {
    //     // this.state.position.removeAllListeners();
    // }

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

    _onDurationChange = () => {
        // console.debug(data);
        this.props.onChangeTaskDuration(
            this.props.data,
            this.state.tempDuration
        );
    };

    _onLongPress = initialVal => {
        console.log("_onLongPress task");

        /* first inform parent views that we are going to show the slider, so that they disable dragging functionality
            1) AlarmDetail main Interactable-View dragging will be disabled
            2) TaskList sortable-listview scrolling will be disabled
            3) Disabling of TaskItem Interactable-View (show delete btn) is managed in render()
        */
        this.props.onShowDurationSlider();

        let initialDuration = this.props.data.duration
            ? this.props.data.duration
            : this.props.data.task.defaultDuration;

        this.setState({ tempDuration: initialDuration });
    };

    render() {
        console.debug("render task-item");
        // console.debug("render task-item", this.props);

        // console.log("this.state.tempDuration", this.state.tempDuration);

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

        let interactableRef = el => (this.interactiveRef = el);
        // console.log("duration", duration);

        // console.log(
        //     "Checking whether to setTimeout. close : " + this.props.closed
        // );

        let touchableBackdrop = null;
        if (this.props.closed == true) {
            setTimeout(() => {
                // console.log("Timeout closing task delete view...");
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

        let leftBtn,
            sortHandlers = null;
        if (this.props.isEditingTasks) {
            leftBtn = (
                <EntypoIcon
                    name="dots-three-horizontal"
                    size={scaleByFactor(17, 0.3)}
                    color="#7a7677"
                />
            );

            sortHandlers = this.props.sortHandlers;
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
            <Interactable.View
                style={[
                    TaskListStyle.taskRow,
                    {
                        alignContent: "flex-start"
                    }
                ]}
                ref={interactableRef}
                horizontalOnly={true}
                snapPoints={[{ x: 0, id: "closed" }, { x: -90, id: "active" }]}
                dragWithSpring={{ tension: 500, damping: 0.5 }}
                animatedNativeDriver={true}
                onSnap={e => {
                    // console.log("Snapping");
                    this.props.onSnapTask(e.nativeEvent.id);
                }}
                /* Disable "Swipe-to-show DELETE" if slider is showing. Otherwise we get
                    premature panResonder termination, especially on iOS */
                dragEnabled={this.state.tempDuration == null}
            >
                <View
                    style={TaskItemStyle.taskInfoWrap}
                    {...this._panResponder.panHandlers}
                >
                    <TouchableOpacity
                        style={[TaskItemStyle.taskInfoWrap]}
                        ref={touchable => (this._touchable = touchable)}
                        onPress={this._onPress.bind(this)}
                        onLongPress={this._onLongPress.bind(this)}
                        onPressOut={() => {
                            if (this.state.tempDuration != null && this._isSliding == false) {
                                this.setState({ tempDuration: null });
                            }
                        }}
                        // disabled={this.props.isEditingTasks}
                        {...sortHandlers}
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
            </Interactable.View>
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
        backgroundColor: Colors.backgroundGrey,
        top: 0,
        left: 0,
        right: 70,
        bottom: 0,
        flex: 1
    }
});

export default TaskItem;
