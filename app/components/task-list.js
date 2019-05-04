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
    FlatList,
    Easing
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import TaskItem, { MOVING_ITEM_TYPES } from "./task-item";
import Colors from "../styles/colors";
import AnimatedPulse from "./anim-pulse";

const CONTAINER_HEIGHT_DEV = 400; // DEV:
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

class HandleRowHelper {
    task;
    currPos;

    constructor(task, currPos) {
        this.task = task;
        this.currPos = currPos;
    }

    incr() {
        this.currPos++;
    }

    decr() {
        this.currPos--;
    }

    setPosition(pos) {
        this.currPos = pos;
    }
}

class TaskList extends React.Component {
    movingItem = null;
    moveableAnims = [];
    filterMap = null;
    _scrollAnim = new Animated.Value(0);
    _autoscrollTimer = null;
    _canScroll = true;
    _containerHeight = 0;
    _scrollAmount = 0;
    _panAnim = new Animated.Value(0);
    // _panPosOnLastScroll = 0;
    _scrollDuringMove = 0;

    constructor() {
        super();
        this._panAnim.addListener(({ value }) => {
            console.log("transform val: ", value);
        });
    }

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
        // this._panPosOnLastScroll = 200; // TODO: MID-POINT height of container.
        this._scrollDuringMove = 0;
        this.movingItem = new HandleRowHelper(item, item.order);
        this.props.willStartMove();
    };

    setMoveableAnim = (animVal, idx) => {
        this.moveableAnims.push(new MoveableRowHelper(animVal, idx));
    };

    // TODO: Handle scrolling other direction

    /**
     * Scrolls Flatlist only if autoscrollTimer has expired.
     * Returns the number of points actually scrolled.
     * @memberof TaskList
     */
    requestAutoscroll = direction => {
        if (this._canScroll == true) {
            this._canScroll = false;
            let amount = direction * 55;
            let max;
            console.log(
                "[DEBUG] Auto-scrolling to ? ",
                this._scrollAmount + amount
            );

            // make sure we're not trying to scroll past 0 (start of list)
            if (amount + this._scrollAmount < 0) {
                amount = -this._scrollAmount;
            }
            // make sure we're not trying to scroll past the end of the list
            else if (
                amount + this._scrollAmount >
                this.props.data.length * 55 - CONTAINER_HEIGHT_DEV
            ) {
                amount =
                    this.props.data.length * 55 -
                    CONTAINER_HEIGHT_DEV -
                    this._scrollAmount;
            }

            console.log("Auto-scrolling to ", this._scrollAmount + amount);

            this._scrollView.getNode().scrollToOffset({
                offset: this._scrollAmount + amount
            });

            this._scrollDuringMove += amount; // TODO: Handle scrolling other direction

            console.log(
                "this._scrollDuringMove (after scroll)",
                this._scrollDuringMove
            );

            this._resetAutoscrollTimer();

            return amount;
        }

        return 0;
    };

    updateDraggedRowOrder = () => {
        let initialOrder = this.movingItem.task.order;
        let newPosition = this.movingItem.currPos;
        console.log("index, newPosition", initialOrder, newPosition);
        this.moveableAnims[initialOrder].order = newPosition;
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
        } else if (this.movingItem.task.id == item.id) {
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
                _scrollAnimVal={this._scrollAnim}
                panAnimVal={this._panAnim}
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

    _scrollIfNeededAndAllowed(yPos, velocity) {
        console.log("_scrollIfNeededAndAllowed");
        let { height } = this.props.containerDimensions;
        height = CONTAINER_HEIGHT_DEV; // DEV:
        // check if the dragged item is at the bottom row of the current WINDOW of the flatlist
        console.log("Container height", height);
        console.log("vs. ", yPos);
        console.log("velocity: ", velocity);
        if (yPos >= height - 100 && velocity > 0) {
            console.log("Requesting scroll DOWN!");
            let scrolledBy = this.requestAutoscroll(1);

            // if (scrolledBy != 0) {
            //     this._panPosOnLastScroll = yPos - (yPos % 55); // set to nearest lower multiple of row height
            // }
        } /* else {
            console.log("Not scrolling down... reason:");
            if (yPos < height - 100) {
                console.log(
                    "yPos is less than height-120: ",
                    yPos,
                    height - 100
                );
            } else if (yPos < this._panPosOnLastScroll) {
                console.log(
                    "yPos is less than panPos on last scroll: ",
                    yPos,
                    this._panPosOnLastScroll
                );
            }
        } */

        if (yPos <= 55 && velocity < 0) {
            console.log("Requesting scroll UP!");
            let scrolledBy = this.requestAutoscroll(-1);

            // if (scrolledBy != 0) {
            //     this._panPosOnLastScroll = yPos + (yPos % 55); // set to nearest upper multiple of row height
            // }
        } else {
            console.log("Not scrolling UP... reason:");
            if (yPos > 55) {
                console.log("yPos is more than 55: ", yPos);
            } else if (velocity > 0) {
                console.log(
                    "yPos is more than panPos on last scroll: ",
                    yPos,
                    this._panPosOnLastScroll
                );
            }
        }
    }

    _onDragItem = evt => {
        // if (this._isMoving == false) {
        //     return;
        // }

        // clearInterval(this._scrollItvlTimer);
        let { y, velocityY } = evt.nativeEvent;

        let yWithScrollOffset = y + this._scrollAmount;

        // console.log(evt.nativeEvent.translationY);
        let newPosTmp = Math.floor(yWithScrollOffset / 55);

        // make sure newPosition is not > # of rows
        newPosTmp = Math.min(this.props.data.length - 1, newPosTmp);

        // make sure newPosition is not < 0
        newPosTmp = Math.max(newPosTmp, 0);

        this._scrollIfNeededAndAllowed(y, velocityY);

        if (newPosTmp != this.movingItem.currPos) {
            clearInterval(this._scrollItvlTimer);

            let rowsTraveled = Math.abs(this.movingItem.currPos - newPosTmp);
            console.log("[DEBUG] rowsTraveled", rowsTraveled);
            let direction;

            // TODO: WHY did I add this Min check?
            let topMostRowToAnimate = Math.min(
                newPosTmp,
                this.movingItem.currPos + 1
            );
            console.log("[DEBUG] topMostRowToAnimate", topMostRowToAnimate);
            let rowsToAnimate = [];
            // console.log(
            //     "[DEBUG] relativePos",
            //     relativePos
            // );
            if (newPosTmp > this.movingItem.currPos) {
                direction = "top";

                rowsToAnimate = Array.from(
                    { length: rowsTraveled },
                    (v, k) => k + topMostRowToAnimate
                );
            } else {
                direction = "bottom";

                // Create an array of incremental digits, starting at topMostRowToAnimate, of (this.movingItem.currPos - i) elements
                rowsToAnimate = Array.from(
                    { length: rowsTraveled },
                    (v, k) => k + topMostRowToAnimate
                );
            }

            this.movingItem.setPosition(newPosTmp);

            console.log(
                "[DEBUG] New this.movingItem.currPos ",
                this.movingItem.currPos
            );

            this.animateMovables(rowsToAnimate, direction);

            this.updateDraggedRowOrder();

            // this._scrollItvlTimer = setInterval(
            //     () => {
            //         this._scrollIfNeededAndAllowed(
            //             translationY,
            //         );
            //     },
            //     1000
            // );
        }
    };

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

        let useGestureHandler = this.movingItem != null;

        // console.log('alarmTasks', alarmTasks);
        // console.log("taskList", this.props.data);
        // console.log("tasksArr in task-list", tasksArr);
        return (
            <TouchableWithoutFeedback
                /* No Styling since TouchableWithoutFeedback just ignores the style prop */
                onPressIn={this.props.closeTaskRows}
            >
                {/* This wrapper view is required for the TouchableWithoutFeedback to work within the TaskArea. */}
                <View>
                    <PanGestureHandler
                        style={[
                            {
                                flex: 1,
                                alignContent: "stretch"
                            }
                            // this.props.tlContainerStyle
                        ]}
                        // ref={el => (this.startTimesPanRef = el)}
                        minDist={useGestureHandler ? 5 : 2000}
                        failOffsetY={
                            useGestureHandler ? [-20000, 20000] : [-2, 2]
                        }
                        onHandlerStateChange={({ nativeEvent }) => {
                            // console.log("nativeEvent.state", nativeEvent.state);
                            if (nativeEvent.state == State.BEGAN) {
                                console.log(
                                    "================= PanGestureHandler - State.BEGAN ================="
                                );

                                // this._panAnim.setValue(0);
                            } else if (nativeEvent.state == State.END) {
                                console.log(
                                    "================= PanGestureHandler - State.END ================="
                                );
                                //     clearInterval(this._scrollItvlTimer);

                                let { task } = this.movingItem;
                                console.log("[DEBUG] From: ", task.order);
                                console.log(
                                    "[DEBUG] To: ",
                                    this.movingItem.currPos
                                );

                                let relativeMovement =
                                    this.movingItem.currPos - task.order;

                                console.log(
                                    "[DEBUG] relativeMovement: ",
                                    relativeMovement
                                );
                                console.log(
                                    "[DEBUG] _scrollDuringMove",
                                    this._scrollDuringMove
                                );

                                Animated.timing(this._panAnim, {
                                    toValue:
                                        relativeMovement * 55 -
                                        this._scrollDuringMove,
                                    duration: 350,
                                    easing: Easing.ease,
                                    useNativeDriver: true
                                }).start(() => {
                                    this._panAnim.setValue(0);
                                    this.onMoveEnded({
                                        data: task,
                                        from: task.order,
                                        to: this.movingItem.currPos
                                    });
                                });
                                // this._isMoving = false;
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
                                        translationY: this._panAnim
                                    }
                                }
                            ],
                            {
                                useNativeDriver: true,
                                listener: this._onDragItem
                            }
                        )}
                        // enabled={useGestureHandler}
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
                                            contentOffset: {
                                                y: this._scrollAnim
                                            }
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
                            scrollEnabled={this.movingItem == null}
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
                    </PanGestureHandler>

                    {this.movingItem != null && (
                        <Animated.View
                            style={[
                                {
                                    top:
                                        this.movingItem.task.order * 55 -
                                        this._scrollAmount,
                                    position: "absolute",
                                    transform: [
                                        {
                                            translateY: this._panAnim
                                            // translateY: Animated.subtract(
                                            //     this._panAnim,
                                            //     this._scrollAnim
                                            // )
                                        }
                                    ]
                                }
                            ]}
                            pointerEvents={"none"}
                        >
                            <TaskItem
                                // other includes 'willStartMove' cb, 'onPressItem' callback, onPressItemCheckBox callback
                                {...other}
                                willStartMove={this._onWillStartMove}
                                isMoving={true}
                                data={this.movingItem.task}
                                id={this.movingItem.task.id}
                                onSnapTask={this._onSnapTask.bind(
                                    this,
                                    this.movingItem,
                                    0
                                )} // FIXME: 0 should be index of row...
                                closed={true}
                                scrollAnimVal={this._scrollAnim}
                                panAnimVal={this._panAnim}
                                moveItemType={MOVING_ITEM_TYPES.COPY}
                            />
                        </Animated.View>
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
