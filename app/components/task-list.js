/**
 * Created by rdunn on 2017-07-15.
 */

import React from "react";
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    Text,
    Animated,
    FlatList
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import TaskItem, { MOVING_ITEM_TYPES } from "./task-item";
import Colors from "../styles/colors";
import AnimatedPulse from "./anim-pulse";

class MoveableRowHelper {
    animatedValue;
    order;
    position;
    initOrder;
    constructor(animVal, ord) {
        this.initOrder = ord;

        this.animatedValue = animVal;
        this.order = ord;
        this.position = 0;
    }

    runAnimation(direction) {
        if (this.animatedValue == null) {
            console.warn("Attempted to animate non-animatable row: ");
            this.toString();
        } else {
            console.info("Running animation for animatable row: ");
            this.toString();
            this.position = this.position + 55 * direction;
            this.order += direction;
            Animated.timing(this.animatedValue, {
                toValue: this.position,
                duration: 350,
                useNativeDriver: true
            }).start();
        }
    }

    toString() {
        console.log(
            `Initial Order: ${this.initOrder}  |  CurrOrder: ${
                this.order
            }  |  CurrPos: ${this.position}`
        );
    }
}

class TaskList extends React.Component {
    movingItem = null;
    moveableAnims = [];
    filterMap = null;
    scrollAnim = new Animated.Value(0);
    _autoscrollTimer = null;
    _canScroll = true;
    _containerHeight = 0;
    _scrollAmount = 0;

    // componentDidMount() {
    //     console.log("Mounted!");

    //     this._flContainer.measure((x, y, width, height) => {
    //         console.log("x, y, width, height", x, y, width, height);
    //         console.log("measured");
    //         this._containerHeight = height;
    //         console.log("this._containerHeight", height);
    //     });
    // }
    // onLayout = ({ nativeEvent }) => {
    //     let {
    //         layout: { height }
    //     } = nativeEvent;

    //     this._listHeight = height;
    //     console.log("List Height: ", this._listHeight);
    // };

    onLayout = e => {
        console.log("onLayout");
    };

    _resetAutoscrollTimer = () => {
        if (this._autoscrollTimer) {
            clearTimeout(this._autoscrollTimer);
        }

        this._autoscrollTimer = setTimeout(() => {
            this._canScroll = true;
        }, 1000);
    };

    _onWillStartMove = item => {
        this.movingItem = item;
        this.props.willStartMove();
    };

    setMoveableAnim = (animVal, idx) => {
        this.moveableAnims.push(new MoveableRowHelper(animVal, idx));
    };

    updateDraggedRowOrder = (index, newPosition) => {
        console.log("index, newPosition", index, newPosition);
        this.moveableAnims[index].order = newPosition;

        // If we are at the bottom scroll the Flatlist by 1 item
        // get height of Flatlist window (depends on which view we are in)
        // let { height } = this.props.containerDimensions;
        // height -= 55; // DEV: extra offset for testing
        // // check if the dragged item is at the bottom row of the current WINDOW of the flatlist

        // if (this._canScroll == false) {
        //     console.log(
        //         "Waiting for autoScrollTimer to expire. Can't scroll yet"
        //     );
        // } else if (newPosition * 55 >= height - this.scrollAnim._value) {
        //     console.log("Auto-scrolling!");
        //     this._canScroll = false;
        //     this._scrollView.getNode().scrollToIndex({
        //         index: newPosition + 1,
        //         viewOffset: 0,
        //         viewPosition: 1
        //     });

        //     this._resetAutoscrollTimer();

        //     return true;
        // } else {
        //     console.log("container height", height);
        //     console.log("scrollAnim._value", this.scrollAnim._value);
        // }
    };

    requestAutoscroll = newPosition => {
        if (this._canScroll == true) {
            this._canScroll = false;
            this._scrollAmount += 55;
            console.log("Auto-scrolling to ", this._scrollAmount);

            this._scrollView.getNode().scrollToOffset({
                offset: this._scrollAmount
            });

            this._resetAutoscrollTimer();

            return true;
        }

        return false;
    };

    animateMovables = (indices, direction) => {
        console.log("animateMovables: ", indices);
        console.log("[DEBUG] this.moveableAnims", this.moveableAnims.length);

        let movRows = [];
        // find MoveableRow with the specified order
        for (let i = 0; i < this.moveableAnims.length; i++) {
            for (let j = 0; j < indices.length; j++) {
                if (this.moveableAnims[i].order == indices[j]) {
                    movRows.push(this.moveableAnims[i]);
                    this.moveableAnims[i].runAnimation(
                        direction == "top" ? -1 : 1
                    );
                    break;
                }
            }

            if (movRows.length == indices.length) {
                break;
            }
        }

        if (movRows.length != indices.length) {
            console.log("Dumping moveableRow objects");
            for (let i = 0; i < this.moveableAnims.length; i++) {
                this.moveableAnims[i].toString();
            }
            console.warn(
                "Failed to find all moveable rows with indices: ",
                indices
            );
            return;
        }
    };

    onMoveEnded = moveInfo => {
        this.movingItem = null;
        this.moveableAnims = [];

        this.props.onReorderTasks(
            this.props.data, // all alarmTasks
            this.filterMap,
            moveInfo.data.id,
            moveInfo.from,
            moveInfo.to
        );
    };

    _keyExtractor = (item, index) => item.id;

    _renderItem = (taskCount, { item, index }) => {
        // console.log("index", index);
        // console.log("taskCount", taskCount);
        // console.log("item", item);
        let { onSnapTask, ...other } = this.props;
        // console.log("onSnapTask prop", onSnapTask);
        // console.log("other props", other);
        // console.log("sectionId", sectionId);
        // console.log("rowID", rowID);
        // console.log("task item", item);
        onSnapTask.bind(item);
        let closed = true;
        if (this.props.activeTask == index) {
            closed = false;
        }

        let moveType;
        if (this.movingItem == null) {
            moveType = MOVING_ITEM_TYPES.NONE;
        } else if (this.movingItem.id == item.id) {
            moveType = MOVING_ITEM_TYPES.HANDLE;
        } else {
            moveType = MOVING_ITEM_TYPES.MOVEABLE;
        }

        return (
            <TaskItem
                // other includes 'willStartMove' cb, 'onPressItem' callback, onPressItemCheckBox callback
                {...other}
                willStartMove={this._onWillStartMove}
                data={item}
                id={item.id}
                onSnapTask={this._onSnapTask.bind(this, item, index)}
                closed={closed}
                disabled={this.props.isEditingTasks}
                setMoveableAnim={this.setMoveableAnim}
                animateMovables={this.animateMovables}
                taskCount={taskCount}
                moveEnded={this.onMoveEnded}
                moveItemType={moveType}
                updateDraggedRowOrder={this.updateDraggedRowOrder}
                scrollOffset={this.scrollAnim}
                containerDimensions={this.props.containerDimensions}
                requestAutoscroll={this.requestAutoscroll}
                // shouldStartMove={move}
                // shouldEndMove={moveEnd}
            />
        );
    };

    _onSnapTask(item, index, rowState) {
        // console.log("onSnapTask in TaskList");
        // console.log("item", item);
        // console.log("index", index);
        // console.log("rowState", rowState);
        this.props.onSnapTask(item, index, rowState);
    }

    render() {
        // console.debug("Render TaskList");
        // console.debug("props: ", this.props);
        let contContainerStyle = styles.contContainerStyleNotEmpty;

        let alarmTasks = this.props.data;
        let taskCount;
        let filteredAlarmTasks = this.props.hideDisabledTasks
            ? this.props.data.filtered("enabled == true")
            : null;

        this.filterMap = null;
        if (filteredAlarmTasks) {
            this.filterMap = filteredAlarmTasks.map(aTask => {
                return aTask.order;
            });
            if (filteredAlarmTasks.length == 0) {
                contContainerStyle = styles.contContainerStyleEmpty;
            }
            taskCount = filteredAlarmTasks.length;
        } else {
            if (alarmTasks.length == 0) {
                contContainerStyle = styles.contContainerStyleEmpty;
            }
            taskCount = alarmTasks.length;
        }
        console.log("this.movingItem", this.movingItem);

        let { onSnapTask, ...other } = this.props;

        // console.log('alarmTasks', alarmTasks);
        // console.log("taskList", this.props.data);
        // console.log("tasksArr in task-list", tasksArr);
        return (
            <TouchableWithoutFeedback
                /* No Styling since TouchableWithoutFeedback just ignores the style prop */
                onPressIn={this.props.closeTaskRows}
            >
                {/* This wrapper view is required for the TouchableWithoutFeedback to work within the TaskArea. */}
                <View
                    style={[
                        {
                            flex: 1,
                            alignContent: "stretch"
                        },
                        this.props.tlContainerStyle
                    ]}
                    ref={elm => (this._flContainer = elm)}
                    collapsable={false}
                    onLayout={e => this.onLayout(e)}
                >
                    <Animated.FlatList
                        ref={elm => (this._scrollView = elm)}
                        data={filteredAlarmTasks || alarmTasks}
                        renderItem={this._renderItem.bind(this, taskCount)} // pass in # of tasks showing to renderItem
                        keyExtractor={this._keyExtractor}
                        // scrollPercent={5}
                        // onMoveEnd={moveInfo => {
                        //     // console.log("'this' now: " + this.constructor.name);
                        //     // console.log("moveInfo.from", moveInfo.from);
                        //     // console.log("moveInfo.to", moveInfo.to);
                        //     // console.log("row", moveInfo.row);
                        //     // console.log(
                        //     //     "tasksArr in onRowMoved callback in task-list",
                        //     //     tasksArr
                        //     // );
                        //     this.props.onReorderTasks(
                        //         alarmTasks,
                        //         filterMap,
                        //         moveInfo.data.id,
                        //         moveInfo.from,
                        //         moveInfo.to
                        //     );
                        // }}
                        bounces={false}
                        onScroll={Animated.event(
                            [
                                {
                                    nativeEvent: {
                                        contentOffset: { y: this.scrollAnim }
                                    }
                                }
                            ],
                            {
                                useNativeDriver: true,
                                listener: ({ nativeEvent }) =>
                                    (this._scrollAmount =
                                        nativeEvent.contentOffset.y)
                            }
                        )}
                        scrollEventThrottle={16}
                        // scrollEnabled={!this.props.isSlidingTask}
                        // scrollEnabled={true}
                        contentContainerStyle={contContainerStyle}
                        ListEmptyComponent={
                            <View
                                style={{
                                    alignSelf: "stretch",
                                    alignContent: "stretch",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flex: 1
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: Colors.backgroundBright,
                                        fontFamily: "Gurmukhi MN",
                                        letterSpacing: 0.5
                                    }}
                                >
                                    No tasks yet...
                                </Text>
                            </View>
                        }
                        getItemLayout={(data, index) => {
                            return {
                                length: 55,
                                offset: 55 * index,
                                index
                            };
                        }}
                    />
                    {this.movingItem != null && (
                        <TaskItem
                            // other includes 'willStartMove' cb, 'onPressItem' callback, onPressItemCheckBox callback
                            {...other}
                            willStartMove={this._onWillStartMove}
                            isMoving={true}
                            data={this.movingItem}
                            id={this.movingItem.id}
                            onSnapTask={this._onSnapTask.bind(
                                this,
                                this.movingItem,
                                0
                            )} // FIXME: 0 should be index of row...
                            closed={true}
                            style={{
                                position: "absolute",
                                top: this.movingItem.order * 55
                            }}
                            scrollOffset={this.scrollAnim}
                            moveItemType={MOVING_ITEM_TYPES.COPY}
                        />
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
    contContainerStyleEmpty: {
        flexGrow: 1,
        justifyContent: "center"
    },
    contContainerStyleNotEmpty: {
        flexGrow: 1
    }
});

export default TaskList;
