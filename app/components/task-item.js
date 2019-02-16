/**
 * Created by rdunn on 2017-07-15.
 */

import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    // TouchableWithoutFeedback,
    // Slider,
    PanResponder,
    Dimensions,
    Animated,
    Platform,
    TextInput
} from "react-native";
import Interactable from "react-native-interactable";
import EntypoIcon from "react-native-vector-icons/Entypo";
import EvilIcon from "react-native-vector-icons/EvilIcons";

import DurationText from "./duration-text";
import getTheme from "../../native-base-theme/components";
import material from "../../native-base-theme/variables/material";

import Colors from "../styles/colors";

import { TaskListStyle, TaskItemStyle } from "../styles/list";
import { TextStyle } from "../styles/text";
import TouchableBackdrop from "../components/touchable-backdrop";
import { scaleByFactor } from "../util/font-scale";
import * as CONST_DIMENSIONS from "../styles/const_dimensions";
import upgrades from "../config/upgrades";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const isSmallScreen = SCREEN_HEIGHT < 650;

const DURATION_AREA_FLEX_FACTOR = isSmallScreen ? 0.3 : 0.25;
const NAME_AREA_FLEX_FACTOR = isSmallScreen ? 0.3 : 0.25;

// const MAX_SLIDER_VALUE = 7200; // this is 2 hours, in seconds

class TaskItem extends React.Component {
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
    _tempDuration = null;
    _isMoving = false;

    interactiveRef = null;

    setInteractableRef = el => (this.interactiveRef = el);

    constructor(props) {
        super(props);
        this.state = {
            // tempDuration: null,
            data: {
                enabled: props.data.enabled,
                duration: props.data.duration,
                task: props.data.task,
                startTime: props.data.startTime
            },
            isSlidingTask: false,
            isEditingTasks: false,
            closed: true,
            taskDurVisible: props.durationsVisible
        };

        // console.log("this.state", this.state);
        console.log("task-item constructor");
    }

    componentWillMount() {
        this.flipFrontToBack = this.props.startTimesAnim.interpolate({
            inputRange: [-230, 0],
            outputRange: ["180deg", "0deg"],
            extrapolate: "clamp"
        });

        this.flipBackToFront = this.props.startTimesAnim.interpolate({
            inputRange: [-230, 0],
            outputRange: ["360deg", "180deg"],
            extrapolate: "clamp"
        });
    }

    // componentWillUnmount() {
    //     // this.state.position.removeAllListeners();
    // }

    _onPress = () => {
        // console.debug("TaskItem: onPress");
        // console.debug(this.props.data);
        if (!this.props.disabled) {
            this.props.onPressItem(this.props.data);
        }
    };

    _onPressDelete = () => {
        // console.debug("TaskItem: onPressDelete");
        this.props.onPressDelete(this.props.data);
    };

    _onTapCheckBox = () => {
        // console.debug(data);
        this.props.onPressItemCheckBox(
            this.props.data,
            this.props.data.enabled
        );
    };

    _onDurationChange = () => {
        // console.debug(data);
        this.props.onChangeTaskDuration(this.props.data, this._tempDuration);
        this._tempDuration = null;
    };

    _onLongPress = initialVal => {
        // console.log("_onLongPress task");
        this._isMoving = true;
        this.props.willStartMove();
        this.props.shouldStartMove();
    };

    componentWillReceiveProps(nextProps) {
        // console.log("componentWillReceiveProps: nextProps", nextProps);
        // console.log("componentWillReceiveProps: currState", this.state);

        if (this.props.closed == false && nextProps.closed == true) {
            setTimeout(() => {
                // console.log("Timeout closing task delete view...");
                if (this.interactiveRef) {
                    this.interactiveRef.snapTo({ index: 0 });
                }
            }, 0);
        }

        this.setState({
            data: {
                duration: nextProps.data.duration,
                enabled: nextProps.data.enabled,
                task: nextProps.data.task,
                startTime: nextProps.data.startTime
            },
            isSlidingTask:
                this._tempDuration != null && nextProps.isSlidingTask,
            isEditingTasks: nextProps.isEditingTasks,
            closed: nextProps.closed,
            taskDurVisible: nextProps.durationsVisible
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.log("shouldComponentUpdate");
        // console.log("nextState", nextState);
        // console.log("this.state", this.state);
        // console.log("nextProps", nextProps);

        // if we are sliding, return true right away. We need to re-render
        // if (nextState.isSlidingTask) {
        //     return true;
        // }

        let { enabled, task, duration /* startTime */ } = this.state.data;
        let {
            isEditingTasks,
            isSlidingTask,
            closed,
            taskDurVisible
        } = this.state;

        let {
            enabled: nEnabled,
            task: nTask,
            duration: nDuration
            // startTime: nStartTime
        } = nextProps.data;
        let {
            isEditingTasks: nIsEditingTasks,
            closed: nClosed,
            durationsVisible
        } = nextProps;

        let { isSlidingTask: nIsSlidingTask } = nextState;

        if (
            nEnabled == enabled &&
            nTask.name == task.name &&
            // nStartTime == startTime &&
            nDuration == duration &&
            nIsEditingTasks == isEditingTasks &&
            nIsSlidingTask == isSlidingTask &&
            nClosed == closed &&
            durationsVisible == taskDurVisible
        ) {
            // console.log("Not rendering task-item");
            return false;
        }

        // console.log("Will Render task-item");
        // console.log("why?");
        // console.log("enabled", enabled);
        // console.log("nEnabled", nEnabled);
        // console.log("nStartTime | startTime", nStartTime, startTime);
        // console.log("nDuration | duration", nDuration, duration);
        // console.log(
        //     "nIsSlidingTask | isSlidingTask",
        //     nIsSlidingTask,
        //     isSlidingTask
        // );
        // console.log("nClosed | closed", nClosed, closed);
        // console.log(
        //     "durationsVisible | taskDurVisible",
        //     durationsVisible,
        //     taskDurVisible
        // );

        return true;
    }

    render() {
        console.debug("render task-item");
        // console.debug("render task-item props", this.props);
        // console.debug(
        //     "render task-item durationsVisible",
        //     this.props.durationsVisible
        // );
        // console.debug("render task-item state", this.state);
        // console.log("\n");
        // console.log("this.state.tempDuration", this.state.tempDuration);

        const frontFlipAnimStyle = {
            transform: [
                { rotateY: this.flipFrontToBack },
                { perspective: 1000 }
            ],
            opacity:
                Platform.OS == "android"
                    ? this.props.startTimesAnim.interpolate({
                          inputRange: [-230, -125, -90, 0],
                          outputRange: [0, 0, 0.5, 1],
                          extrapolate: "clamp"
                      })
                    : 1
        };
        const backFlipAnimStyle = {
            transform: [
                { rotateY: this.flipBackToFront },
                { perspective: 1000 }
            ],
            // opacity: this.props.startTimesAnim.interpolate({
            //     inputRange: [-230, -115, 0],
            //     outputRange: [1, 0, 1]
            // }),
            opacity:
                Platform.OS == "android"
                    ? this.props.startTimesAnim.interpolate({
                          inputRange: [-230, -125, -90, 0],
                          outputRange: [1, 0.5, 0, 0],
                          extrapolate: "clamp"
                      })
                    : 1
        };

        /* Statement Explanation: 
            - Use tempDuration if not null (this means the slider is showing)
            - Otherwise, check if there is a user-set duration for this AlarmTask, if there is, use it
            - Otherwise, use the default duration for this Task
        */
        let duration =
            this._tempDuration ||
            (this.props.data.duration != null
                ? this.props.data.duration
                : this.props.data.task.defaultDuration);

        // console.log("duration", duration);

        // console.log(
        //     "Checking whether to setTimeout. close : " + this.props.closed
        // );

        let touchableBackdrop = null;

        if (this.props.activeTask != null) {
            touchableBackdrop = (
                <TouchableBackdrop
                    style={[
                        // TaskItemStyle.taskInfoWrap,
                        { backgroundColor: "transparent" }
                    ]}
                    onPress={() => {
                        this.props.closeTaskRows();
                    }}
                />
            );
        }

        let sortHandlers = this.props.sortHandlers;

        let movingStyle;
        let borderBottomColor = Colors.disabledGrey;
        if (this.props.isMoving) {
            movingStyle = styles.movingStyle;
            borderBottomColor = "transparent";
        }

        // console.debug("... actual render");
        return (
            <Interactable.View
                style={[
                    TaskListStyle.taskRow,
                    {
                        alignContent: "flex-start"
                    }
                ]}
                ref={this.setInteractableRef}
                horizontalOnly={true}
                snapPoints={[{ x: 0, id: "closed" }, { x: -90, id: "active" }]}
                dragWithSpring={{ tension: 500, damping: 0.5 }}
                animatedNativeDriver={true}
                // onSnap={e => {
                //     // console.log("Snapping");
                //     this.props.onSnapTask(e.nativeEvent.id);
                // }}
                onDrag={event => {
                    // console.log("Snapping");
                    let { state, y, targetSnapPointId } = event.nativeEvent;
                    if (state == "end") {
                        this.props.onSnapTask(targetSnapPointId);
                    }
                }}
                /* Disable "Swipe-to-show DELETE" if slider is showing. Otherwise we get
                    premature panResonder termination, especially on iOS */
                dragEnabled={this._tempDuration == null}
            >
                <View
                    style={[
                        TaskItemStyle.taskInfoWrap,
                        {
                            borderBottomColor: borderBottomColor
                            // backgroundColor: "blue"
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            TaskItemStyle.taskInfoTouchable,
                            movingStyle
                            // { backgroundColor: "blue" }
                        ]}
                        ref={touchable => (this._touchable = touchable)}
                        onPress={this._onPress.bind(this)}
                        onLongPress={this._onLongPress.bind(this)}
                        onPressOut={e => {
                            // console.log("----------- onPressOut ----------");

                            // console.log("event", e.nativeEvent);

                            /* Example of event.nativeEvent when user has started to slide */
                            // 'event', { target: 287,
                            //     pageX: 94.33332824707031,
                            //     timestamp: 1694309947.8481343,
                            //     locationX: 47.999994913736984,
                            //     pageY: 525,
                            //     force: 0,
                            //     locationY: 22.3333333333332,
                            //     identifier: 1,
                            //     changedTouches: [ [Circular] ],
                            //     touches: [ [Circular] ] }  ********

                            /* Example of event.nativeEvent when releasing touch if user did NOT slide */
                            // 'event', { target: 178,
                            //     pageX: 122.66665649414062,
                            //     timestamp: 1694283005.7050912,
                            //     locationX: 76.3333231608073,
                            //     pageY: 507.3333282470703,
                            //     force: 0,
                            //     locationY: 4.666661580403513,
                            //     identifier: 1,
                            //     changedTouches: [ [Circular] ],
                            //     touches: [] }  ********

                            /* The only different between the events is the 'touches' array. */
                            if (
                                e.nativeEvent.touches &&
                                e.nativeEvent.touches.length == 0 &&
                                this._isMoving == true
                            ) {
                                // console.log(
                                //     "Touches arr is empty. Released without sliding!"
                                // );
                                this._tempDuration = null;
                                // this.setState({ isSlidingTask: false });
                                this.props.shouldEndMove();
                                this.props.didEndMove();
                            }
                            this._isMoving = false;
                        }}
                        {...sortHandlers}
                    >
                        <TouchableOpacity
                            style={TaskItemStyle.checkbox}
                            onPress={this._onTapCheckBox}
                        >
                            <View
                                style={{
                                    backgroundColor: Colors.brandLightPurple,
                                    borderColor: "transparent",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    left: 0,
                                    borderRadius: 4,
                                    width: 25,
                                    height: 25
                                }}
                            >
                                {this.props.data.enabled && (
                                    <EntypoIcon
                                        name="check"
                                        size={18}
                                        color={Colors.brandLightOpp}
                                        style={{ marginTop: 2 }}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                        <Text
                            style={[
                                TaskListStyle.allChildren,
                                TaskItemStyle.description
                                // {
                                //     backgroundColor: "blue"
                                // }
                            ]}
                            numberOfLines={1}
                            // ellipsizeMode="tail"
                            selectable={false}
                        >
                            {this.props.data.task.name}
                        </Text>
                        <View
                            style={[
                                {
                                    flex: DURATION_AREA_FLEX_FACTOR,
                                    alignSelf: "stretch",
                                    alignItems: "center"
                                }
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.flipCard,
                                    this.state.taskDurVisible
                                        ? frontFlipAnimStyle
                                        : backFlipAnimStyle
                                    // frontFlipAnimStyle
                                ]}
                            >
                                <DurationText
                                    duration={duration}
                                    short={true}
                                    style={[
                                        TaskItemStyle.duration,
                                        TaskListStyle.allChildren,
                                        TextStyle.timeText,
                                        {
                                            alignSelf: "stretch",
                                            // textAlign: "right",
                                            // backgroundColor: "red",
                                            fontSize: 24
                                        }
                                    ]}
                                />
                            </Animated.View>
                            <Animated.View
                                style={[
                                    styles.flipCard,
                                    styles.flipCardBack,
                                    this.state.taskDurVisible
                                        ? backFlipAnimStyle
                                        : frontFlipAnimStyle
                                    // backFlipAnimStyle
                                ]}
                            >
                                <TextInput
                                    editable={false}
                                    defaultValue={this.props.data.startTime}
                                    numberOfLines={1}
                                    ref={elem => {
                                        // console.log("Sending data for ref");
                                        // console.log(
                                        //     "this.props.data",
                                        //     this.props.data
                                        // );
                                        if (
                                            this.props.data &&
                                            !this.props.isMoving
                                        ) {
                                            // console.log("ok sending ref");
                                            try {
                                                this.props.setStartTimeRef(
                                                    elem,
                                                    this.props.data.order
                                                );
                                            } catch (e) {
                                                // console.warn(
                                                //     "Failed to set ref for nonexistent realm object"
                                                // );
                                            }
                                        }
                                    }}
                                    style={[
                                        TaskItemStyle.duration,
                                        TaskListStyle.allChildren,
                                        TextStyle.timeText,
                                        {
                                            // backgroundColor: "blue",
                                            alignSelf: "stretch",
                                            textAlign: "right",
                                            fontSize: 24,
                                            height: 30,
                                            marginTop: 8
                                        }
                                    ]}
                                />
                                {/* NOTE: 3. IAP-locked Feature - Task Start Times */}
                                {!upgrades.pro && (
                                    <View
                                        style={[
                                            StyleSheet.absoluteFill,
                                            {
                                                margin: 1,
                                                position: "absolute",
                                                backgroundColor:
                                                    Colors.brandMidGrey,
                                                alignContent: "center",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }
                                        ]}
                                    >
                                        <EvilIcon
                                            name="lock"
                                            size={31}
                                            color={Colors.brandLightOpp}
                                        />
                                        {/* Lock Icon*/}
                                    </View>
                                )}
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
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
        // backgroundColor: "red",
        top: 8,
        left: 0,
        right: 70,
        bottom: 0
        // flex: 1
    },
    flipCard: {
        // height: "auto",
        // width: "auto",
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        paddingRight: 12,
        // width: 80,
        // height: 80,
        alignItems: "flex-end",
        alignContent: "flex-end",
        justifyContent: "center",
        backfaceVisibility: "hidden"
    },
    flipCardBack: {
        // backgroundColor: "red",
        // backgroundColor: Colors.backgroundGrey,
        position: "absolute"
    },
    movingStyle: {
        flex: undefined,
        left: -1,
        backgroundColor: Colors.brandLightPurple,
        shadowOpacity: 1,
        shadowRadius: 10,
        shadowColor: "black",
        width: SCREEN_WIDTH - scaleByFactor(20, 0.4)
        // elevation: 10 TODO: Why is this commented out
    }
});

export default TaskItem;
