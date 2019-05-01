/**
 * Created by rdunn on 2017-07-15.
 */

import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TouchableHighlight,
    // TouchableWithoutFeedback,
    Dimensions,
    Animated,
    Platform,
    TextInput,
    Easing
} from "react-native";
import Interactable from "react-native-interactable";
import EntypoIcon from "react-native-vector-icons/Entypo";
import EvilIcon from "react-native-vector-icons/EvilIcons";
import { PanGestureHandler, State } from "react-native-gesture-handler";

import DurationText from "./duration-text";

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

let _movingTransform = new Animated.Value(0);

export const MOVING_ITEM_TYPES = {
    NONE: 0,
    HANDLE: 1,
    COPY: 2,
    MOVEABLE: 3
};

// _movingTransform.addListener(({ value }) => {
//     console.log("transform val: ", value);
// });

class TaskItem extends React.Component {
    /*
    Props: Receives an AlarmTask in the 'data' property:
        data: { id:"_"   // this is the AlarmTask id
          duration: #,
          enabled: bool,
          task: { id:"_", name:"Task name", defaultDuration: # }
        }
     */

    interactiveRef = null;

    _moveableAnim = new Animated.Value(0);
    _alertAreas = [];

    currArea;

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
            isEditingTasks: false,
            closed: true,
            taskDurVisible: props.durationsVisible,
            moveItemType: MOVING_ITEM_TYPES.NONE
        };

        this.currArea = props.data.order;

        // console.log("this.state", this.state);
        // console.log("task-item constructor");
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

        this.frontFlipAnimStyle = {
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
        this.backFlipAnimStyle = {
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
    }

    // componentWillUnmount() {
    //     // this.state.position.removeAllListeners();
    // }
    _isMoving = false;

    _onPress = () => {
        // console.debug("TaskItem: onPress");
        // console.debug(this.props.data);
        if (this._isMoving == true) {
            this._isMoving = false;
            let { task } = this.props.data;
            // if the move has already started, don't navigate. Instead just end the move
            this.props.moveEnded({
                data: task,
                from: task.order,
                to: this.currArea
            });
        } else if (!this.props.disabled) {
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

    _dragStartTimer = null;

    _onLongPress = initialVal => {
        console.log("_onLongPress task");
        this.props.willStartMove(this.props.data);
        this._isMoving = true;

        // NOTE: This is a workaround to prevent movingItem from remaining visible, when drag failed to initialize
        //       Sometimes after longPress, the row does not respond to the drag. This is a borderline adequate
        //       workaround that simply cancels the move in 2 seconds if we don't receive the onDrag-start event.
        //       A better, but probably much more difficult solution would be to use the rn-gesture-handler lib
        //       instead, but this could cause a performance hit, since I still want to use rn-interactable for
        //       horizontal dragging to show Delete button.
        // if (!this._dragStartTimer) {
        //     this._dragStartTimer = setTimeout(() => {
        //         this.props.moveEnded({
        //             data: this.props.data,
        //             from: this.props.data.order,
        //             to: this.props.data.order
        //         });
        //     }, 2000);
        // }
    };

    onAlert = event => {
        let { key, value } = event.nativeEvent;
        // NOTE: Very strange event structuring for this callback of Interactable.View
        //  the event looks like this:
        /* 
            {
                event_properties,
                ...
                nativeEvent: {
                    nativeEvt_properties,
                    ...
                    <"alertAreaId">: <"enter"|"leave">,
                    "row0": <"enter"|"leave">       -- example
                }
            }
        */

        console.log("onAlert");
        let areas = this._alertAreas.map(area => area.id);
        // Determine which area this alert occurred for (I think we only need to care about "enter" events)
        for (let i = 0; i < areas.length; i++) {
            console.log("areas[i]", areas[i]);
            console.log(
                "event.nativeEvent[areas[i]]",
                event.nativeEvent[areas[i]]
            );
            if (event.nativeEvent[areas[i]] == "enter") {
                console.log(`Entering Area ${i}`);
                console.log("this.currArea", this.currArea);
                if (i == this.currArea) {
                    console.log(
                        "We're already in this area, not doing anything ",
                        i
                    );
                    break;
                } else {
                    let direction;
                    let rowsToAnimate = [];
                    if (this.currArea > i) {
                        // new area is less (we've moved towards the top of the list, meaning the
                        //  moveable view must move towards the bottom)
                        direction = "bottom";
                        let topMostRowToAnimate = i;

                        // Create an array of incremental digits, starting at topMostRowToAnimate, of (this.currArea - i) elements
                        rowsToAnimate = Array.from(
                            { length: this.currArea - i },
                            (v, k) => k + topMostRowToAnimate
                        );
                    } else if (this.currArea < i) {
                        // new area is more (we've moved towards the bottom of the list, so the
                        //  moveable view must move towards the top)
                        direction = "top";
                        let topMostRowToAnimate = this.currArea + 1;

                        rowsToAnimate = Array.from(
                            { length: i - this.currArea },
                            (v, k) => k + topMostRowToAnimate
                        );
                    }
                    this.currArea = i;
                    // Animate the corresponding row 55 points in the correct direction
                    this.props.animateMovables(rowsToAnimate, direction);
                    this.props.updateDraggedRowOrder(this.props.data.order, i);
                    break;
                }
            }
        }
    };

    buildAlertAreas(initOrder, taskCount) {
        let areas = [];
        // areas.push({ id: "row0", influenceArea: { top: 0, bottom: 28 } });

        const offset = 28; // pixel offset to make animation start half-way between items

        // calculate the top-most position in the task list, relative to the position of initOrder (which is 0)
        let relativePos = -55 * initOrder;

        for (let i = 0; i < taskCount; i++) {
            let posWithOffset = relativePos - 28;
            areas.push({
                id: "row" + i,
                influenceArea: {
                    top: posWithOffset,
                    bottom: posWithOffset + 55
                }
            });
            relativePos += 55;
        }

        return areas;
    }

    buildSnapPoints(initOrder, taskCount) {
        let areas = [];
        // areas.push({ id: "row0", influenceArea: { top: 0, bottom: 28 } });

        // calculate the top-most position in the task list, relative to the position of initOrder (which is 0)
        let relativePos = -55 * initOrder;

        for (let i = 0; i < taskCount; i++) {
            areas.push({ y: relativePos, id: i + "" });
            relativePos += 55;
        }

        return areas;
    }

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

        this.currArea = nextProps.data.order; // NOTE: this is vital

        this.setState({
            data: {
                duration: nextProps.data.duration,
                enabled: nextProps.data.enabled,
                task: nextProps.data.task,
                startTime: nextProps.data.startTime
                // order: nextProps.data.order // NOTE: Not used, but leaving in for convenience in case I want to display order for debugging
            },
            isEditingTasks: nextProps.isEditingTasks,
            closed: nextProps.closed,
            taskDurVisible: nextProps.durationsVisible,
            moveItemType: nextProps.moveItemType
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.log("shouldComponentUpdate");
        // console.log("nextState", nextState);
        // console.log("this.state", this.state);
        // console.log("nextProps", nextProps);

        // if we are sliding, return true right away. We need to re-render
        let { enabled, task, duration /* startTime */ } = this.state.data;
        let {
            isEditingTasks,
            closed,
            taskDurVisible,
            moveItemType
            // order // // NOTE: Not used, but leaving in for convenience in case I want to display order for debugging
        } = this.state;

        let {
            enabled: nEnabled,
            task: nTask,
            duration: nDuration
            // startTime: nStartTime
            // order: nOrder // NOTE: Not used, but leaving in for convenience in case I want to display order for debugging
        } = nextProps.data;
        let {
            isEditingTasks: nIsEditingTasks,
            closed: nClosed,
            durationsVisible,
            moveItemType: nMoveItemType
        } = nextProps;

        if (
            nEnabled == enabled &&
            nTask.name == task.name &&
            // nStartTime == startTime &&
            nDuration == duration &&
            nIsEditingTasks == isEditingTasks &&
            nClosed == closed &&
            durationsVisible == taskDurVisible &&
            nMoveItemType == moveItemType
            // nOrder == order // NOTE: Not used, but leaving in for convenience in case I want to display order for debugging
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
        // console.log("nClosed | closed", nClosed, closed);
        // console.log(
        //     "durationsVisible | taskDurVisible",
        //     durationsVisible,
        //     taskDurVisible
        // );

        return true;
    }

    _renderTaskItemCore = (duration, extraStyles) => {
        return (
            <View
                style={[
                    TaskItemStyle.taskInfoWrap,
                    extraStyles,
                    {
                        borderBottomColor: "transparent"
                        // backgroundColor: "blue"
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        TaskItemStyle.taskInfoTouchable
                        // extraStyles
                        // { backgroundColor: "blue" }
                    ]}
                    ref={touchable => (this._touchable = touchable)}
                    onPress={this._onPress}
                    onPressIn={() => {
                        this.pressInTimer = setTimeout(() => {
                            console.log("Long enough press!");
                            this._onLongPress();
                        }, 650);
                    }}
                    onPressOut={() => {
                        clearTimeout(this.pressInTimer);
                    }}
                    // onLongPress={this._onLongPress.bind(this)}
                    // onPressOut={() => {
                    //     console.log("onPressOut");
                    // }}
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
                            TaskItemStyle.description,
                            {
                                color: this.props.data.enabled
                                    ? Colors.brandLightGrey
                                    : Colors.disabledGrey
                            }
                        ]}
                        numberOfLines={1}
                        // ellipsizeMode="tail"
                        selectable={false}
                    >
                        {"(" +
                            this.props.data.order +
                            ") " +
                            this.props.data.task.name}
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
                                    ? this.frontFlipAnimStyle
                                    : this.backFlipAnimStyle
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
                                        color: this.props.data.enabled
                                            ? Colors.brandLightGrey
                                            : Colors.disabledGrey,
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
                                    ? this.backFlipAnimStyle
                                    : this.frontFlipAnimStyle
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
                                        this.props.movingItemType ==
                                            MOVING_ITEM_TYPES.NONE
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
                            {upgrades.pro != true && (
                                <TouchableHighlight
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
                                    onPress={this.props.onPressTaskST}
                                >
                                    <EvilIcon
                                        name="lock"
                                        size={31}
                                        color={Colors.brandLightOpp}
                                    />
                                </TouchableHighlight>
                            )}
                        </Animated.View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    _renderCopyItem = (duration, animVal, scrollOffset) => {
        let style = styles.movingStyle;
        return (
            <Animated.View
                style={[
                    TaskListStyle.taskRow,
                    this.props.style,
                    {
                        alignContent: "flex-start",
                        transform: [
                            {
                                translateY: Animated.subtract(
                                    animVal,
                                    scrollOffset
                                )
                            }
                        ]
                    }
                ]}
                pointerEvents={"none"}
            >
                {this._renderTaskItemCore(duration, style)}
                <TouchableOpacity
                    style={[TaskItemStyle.deleteBtn]}
                    onPress={this._onPressDelete}
                >
                    <Text style={TaskItemStyle.deleteBtnText}>DELETE</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    _renderMovingItem = (duration, animVal) => {
        return (
            <Animated.View
                style={[
                    TaskListStyle.taskRow,
                    this.props.style,
                    {
                        alignContent: "flex-start",
                        transform: [
                            {
                                translateY: animVal
                            }
                        ]
                    }
                ]}
            >
                {this._renderTaskItemCore(duration)}
                <TouchableOpacity
                    style={[TaskItemStyle.deleteBtn]}
                    onPress={this._onPressDelete}
                >
                    <Text style={TaskItemStyle.deleteBtnText}>DELETE</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    _renderGestureHandler(duration, animValue) {
        return (
            <PanGestureHandler
                style={TaskListStyle.taskRow}
                // ref={el => (this.startTimesPanRef = el)}
                onGestureEvent={Animated.event(
                    [
                        {
                            nativeEvent: {
                                translationY: animValue
                            }
                        }
                    ],
                    {
                        useNativeDriver: true,
                        listener: evt => {
                            let { translationY } = evt.nativeEvent;
                            console.log(evt.nativeEvent.translationY);
                            if (translationY % 55 != this.currArea) {
                                this.currArea = translationY % 55;

                                this.props.animateMovables(
                                    rowsToAnimate,
                                    direction
                                );
                                this.props.updateDraggedRowOrder(
                                    this.props.data.order,
                                    i
                                );
                            }
                        }
                    }
                )}
            >
                <Animated.View
                    style={{
                        transform: [{ translateY: animValue }]
                    }}
                >
                    {this._renderTaskItemCore(duration)}
                </Animated.View>
            </PanGestureHandler>
        );
    }

    render() {
        // console.debug("render task-item");
        // console.debug("render task-item props", this.props);
        // console.debug(
        //     "render task-item durationsVisible",
        //     this.props.durationsVisible
        // );
        // console.debug("render task-item state", this.state);
        // console.log("\n");
        // console.log("this.state.tempDuration", this.state.tempDuration);

        /* Statement Explanation:
            - Use tempDuration if not null (this means the slider is showing)
            - Otherwise, check if there is a user-set duration for this AlarmTask, if there is, use it
            - Otherwise, use the default duration for this Task
        */
        let duration =
            this.props.data.duration != null
                ? this.props.data.duration
                : this.props.data.task.defaultDuration;

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

        // let sortHandlers = this.props.sortHandlers;

        /* During a move, there are 3 new components used, rather than the regular one. The names may need work.
            1. Placeholder:   This is a transparent Interactable.View and is therefore the view that the user directly
                              drags. It's motion is set to verticalOnly={true}
            2. Moving Item:   This is an absolutely positioned Animated.View (relative to the entire TaskList), so
                              that it renders above all other TaskItems. Its position animated toi match that of the
                              placeholder view as it is moved. In other words, this is a copy of the actual view
                              being moved, and follows the movement of that view.
            3. Moveable Item: These are all other TaskItems. They are Animated.Views that remain still unless the
                              Placeholder animatedValue crosses a positional threshold for that particular row.
                              If that threshold is passed, the view snaps to the last row-aligned position of the
                              Placeholder view.
        */
        let extraStyle = { opacity: 1 };
        let borderBottomColor = Colors.disabledGrey;
        let { moveItemType } = this.props;
        let snapPoints;
        let useGestureHandler = false;

        if (moveItemType == MOVING_ITEM_TYPES.HANDLE) {
            // DEV: remove forceHandleType
            console.log("Rendering transparent handle item");
            borderBottomColor = "transparent";
            this.props.setMoveableAnim(null, this.props.data.order); // unused, but needed to fill the moveable array.

            this._alertAreas = this.buildAlertAreas(
                this.props.data.order,
                this.props.taskCount
            );

            snapPoints = this.buildSnapPoints(
                this.props.data.order,
                this.props.taskCount
            );

            extraStyle = { opacity: 0 };
            // extraStyle = { borderColor: "red", borderWidth: 2 }; // DEV:
            useGestureHandler = true;

            // return this._renderGestureHandler(duration, _movingTransform);
        } else if (moveItemType == MOVING_ITEM_TYPES.COPY) {
            console.log("rendering overlying copy");
            return this._renderCopyItem(
                duration,
                _movingTransform,
                this.props.scrollOffset
            );
        } else if (moveItemType == MOVING_ITEM_TYPES.MOVEABLE) {
            console.log("rendering move-able item");
            this.props.setMoveableAnim(
                this._moveableAnim,
                this.props.data.order
            );
            return this._renderMovingItem(duration, this._moveableAnim);
        } else {
            console.debug("Rendering standard TaskItem");
            snapPoints = [{ x: 0, id: "closed" }, { x: -90, id: "active" }];
            this._alertAreas = [];
        }

        tapRef = React.createRef();

        return (
            <PanGestureHandler
                style={TaskListStyle.taskRow}
                // ref={el => (this.startTimesPanRef = el)}
                minDist={useGestureHandler ? 5 : 2000}
                failOffsetY={useGestureHandler ? [-20000, 20000] : [-2, 2]}
                onHandlerStateChange={({ nativeEvent }) => {
                    // console.log("nativeEvent.state", nativeEvent.state);
                    if (nativeEvent.state == State.BEGAN) {
                        console.log("PanGestureHandler - State.BEGAN");

                        _movingTransform.setValue(0);
                    } else if (nativeEvent.state == State.END) {
                        console.log("PanGestureHandler - State.END");

                        let task = this.props.data;
                        console.log("[DEBUG] From: ", task.order);
                        console.log("[DEBUG] To: ", this.currArea);

                        let relativeMovement = this.currArea - task.order;

                        Animated.timing(_movingTransform, {
                            toValue: relativeMovement * 55,
                            duration: 350,
                            easing: Easing.ease,
                            useNativeDriver: true
                        }).start(() => {
                            this.props.moveEnded({
                                data: task,
                                from: task.order,
                                to: this.currArea
                            });
                        });
                        // _movingTransform.setValue(0);
                        this._isMoving = false;
                    } else if (nativeEvent.state == State.FAILED) {
                        console.log("PanGestureHandler - State.FAILED");
                    } else {
                        console.log(
                            "PanGestureHandler - State: ",
                            nativeEvent.state
                        );
                    }
                }}
                onGestureEvent={Animated.event(
                    [
                        {
                            nativeEvent: {
                                translationY: _movingTransform
                            }
                        }
                    ],
                    {
                        useNativeDriver: true,
                        listener: evt => {
                            if (this._isMoving == false) {
                                return;
                            }

                            let { translationY } = evt.nativeEvent;
                            console.log(evt.nativeEvent.translationY);
                            let relativePos = Math.floor(translationY / 55);
                            let newPosTmp = Math.min(
                                this.props.taskCount - 1,
                                this.props.data.order + relativePos
                            );
                            newPosTmp = Math.max(newPosTmp, 0);

                            // relativePos = newPosTmp >= this.props.taskCount ? newPosTmp - this.props.taskCount : relativePos;
                            // relativePos = newPosTmp < 0 ?
                            // TODO: We don't care if we've moved above the top of the list, only that we are at the top,
                            //        same with the bottom. Right now we end up calculating negative newPositions, and also
                            //        newPositions larger than the total # of list items. Bare in mind that this moveBy variable
                            //        is relative to the original position of the item that was moved, so in this calculation
                            //        I must account for this fact.

                            if (newPosTmp != this.currArea) {
                                // if (
                                //     this.props.data.order + relativePos >
                                //         this.props.taskCount - 1 ||
                                //     this.props.data.order + relativePos < 0
                                // ) {
                                //     return;
                                // }
                                let rowsTraveled = Math.abs(
                                    this.currArea - newPosTmp
                                );
                                console.log(
                                    "[DEBUG] rowsTraveled",
                                    rowsTraveled
                                );
                                let direction;
                                let topMostRowToAnimate = Math.min(
                                    newPosTmp,
                                    this.currArea + 1
                                );
                                console.log(
                                    "[DEBUG] topMostRowToAnimate",
                                    topMostRowToAnimate
                                );
                                let rowsToAnimate = [];
                                console.log("[DEBUG] relativePos", relativePos);
                                if (newPosTmp > this.currArea) {
                                    direction = "top";

                                    rowsToAnimate = Array.from(
                                        { length: rowsTraveled },
                                        (v, k) => k + topMostRowToAnimate
                                    );
                                } else {
                                    direction = "bottom";

                                    // Create an array of incremental digits, starting at topMostRowToAnimate, of (this.currArea - i) elements
                                    rowsToAnimate = Array.from(
                                        { length: rowsTraveled },
                                        (v, k) => k + topMostRowToAnimate
                                    );
                                }

                                this.currArea = newPosTmp;

                                console.log(
                                    "[DEBUG] New this.currArea ",
                                    this.currArea
                                );

                                this.props.animateMovables(
                                    rowsToAnimate,
                                    direction
                                );
                                this.props.updateDraggedRowOrder(
                                    this.props.data.order,
                                    this.currArea
                                );
                            }
                        }
                    }
                )}
                // enabled={useGestureHandler}
            >
                <Animated.View>
                    <Interactable.View
                        style={[
                            TaskListStyle.taskRow,
                            {
                                alignContent: "flex-start"
                            }
                        ]}
                        ref={this.setInteractableRef}
                        horizontalOnly={true}
                        // animatedValueY={_movingTransform}
                        alertAreas={this._alertAreas}
                        onAlert={this.onAlert}
                        snapPoints={snapPoints}
                        dragWithSpring={{ tension: 500, damping: 0.5 }}
                        animatedNativeDriver={true}
                        dragEnabled={true}
                        onDrag={event => {
                            // console.log("Snapping");
                            let {
                                state,
                                y,
                                targetSnapPointId
                            } = event.nativeEvent;
                            if (state == "end") {
                                console.log("OnDrag end.");

                                // if (!horizontal) {
                                //     let task = this.props.data;
                                //     console.log("From: ", task.order);
                                //     console.log("To: ", this.currArea);

                                //     _movingTransform.setValue(0);
                                //     // _movingTransform = new Animated.Value(0);

                                //     this.interactiveRef.changePosition({ y: 0 });

                                //     this.props.moveEnded({
                                //         data: task,
                                //         from: task.order,
                                //         to: this.currArea
                                //     });
                                // } else if (horizontal) {
                                this.props.onSnapTask(targetSnapPointId);
                                // }
                            } else if (state == "start") {
                                console.log("OnDrag start.");
                                clearTimeout(this._dragStartTimer);
                                this._dragStartTimer = null;
                            }
                        }}
                    >
                        {this._renderTaskItemCore(duration, extraStyle)}
                        <TouchableOpacity
                            style={[TaskItemStyle.deleteBtn]}
                            onPress={this._onPressDelete}
                        >
                            <Text style={TaskItemStyle.deleteBtnText}>
                                DELETE
                            </Text>
                        </TouchableOpacity>
                    </Interactable.View>
                </Animated.View>
            </PanGestureHandler>
        );
    }
}

const styles = StyleSheet.create({
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
