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
    initOrder;

    constructor(task, currPos) {
        this.task = task;
        this.initOrder = currPos;
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
    _scrollLimitTimer = null;
    _autoscrollTimer = null;
    _canScroll = true;
    _containerHeight = 0;
    _scrollAmount = 0;
    _panAnim = new Animated.Value(0);
    // _panPosOnLastScroll = 0;
    _scrollDuringMove = 0;
    _taskCountTotal = 0; // all tasks, including hidden ones
    _taskCount = 0; // excludes currently hidden tasks
    filteredAlarmTasks = null;
    hideDisabledTasks = false;

    constructor(props) {
        super(props);
        this._panAnim.addListener(({ value }) => {
            console.log("transform val: ", value);
        });

        this._taskCount = props.data.length;
        this._taskCountTotal = props.data.length;
        this.hideDisabledTasks = props.hideDisabledTasks;
    }

    onLayout = e => {
        console.log("onLayout");
    };

    _resetScrollLimiter = () => {
        if (this._scrollLimitTimer) {
            clearTimeout(this._scrollLimitTimer);
        }

        this._scrollLimitTimer = setTimeout(() => {
            console.log("Now allowed to scroll!");
            this._canScroll = true;
        }, 350);
    };

    _onWillStartMove = (item, index) => {
        // this._panPosOnLastScroll = 200; // TODO: MID-POINT height of container.
        this._scrollDuringMove = 0;
        this.movingItem = new HandleRowHelper(item, index);
        this.props.willStartMove();
    };

    setMoveableAnim = (animVal, idx) => {
        this.moveableAnims.push(new MoveableRowHelper(animVal, idx));
    };

    /**
     * Scrolls Flatlist only if autoscrollTimer has expired.
     * Returns the number of points actually scrolled.
     * @memberof TaskList
     */
    requestAutoscroll = direction => {
        if (this._canScroll == true) {
            console.log("Scroll direction", direction);
            console.log("this._scrollAmount", this._scrollAmount);

            this._canScroll = false;
            let contHeight = this.props.containerDimensions.height;
            let amount = direction * 55;
            let max;

            console.log("Initial amount", amount);
            // console.log(
            //     "[DEBUG] Auto-scrolling to ? ",
            //     this._scrollAmount + amount
            // );
            console.log(
                "this._taskCount * 55 - contHeight",
                this._taskCount * 55 - contHeight
            );

            console.log(
                "amount + this._scrollAmount",
                amount + this._scrollAmount
            );

            // make sure we're not trying to scroll past 0 (start of list)
            if (amount + this._scrollAmount < 0) {
                amount = -this._scrollAmount;
                console.log("[DEBUG] Trying to scroll past top (0).");
                console.log(
                    "[DEBUG] Setting amount to -this.scrollAmount: ",
                    this._scrollAmount
                );
            }
            // make sure we're not trying to scroll past the end of the list
            else if (
                amount + this._scrollAmount >
                this._taskCount * 55 - contHeight
            ) {
                console.log(
                    "[DEBUG] Trying to scroll past bottom (this._taskCount * 55 - contHeight)."
                );
                console.log(
                    "[DEBUG] Bottom: ",
                    this._taskCount * 55 - contHeight
                );

                amount = this._taskCount * 55 - contHeight - this._scrollAmount;
                //
            }

            console.log(
                `Auto-scrolling by to ${amount} to`,
                this._scrollAmount + amount
            );

            this._scrollView.getNode().scrollToOffset({
                offset: this._scrollAmount + amount
            });

            console.log("Initial amount", amount);

            this._scrollDuringMove += amount; // TODO: Handle scrolling other direction

            console.log(
                "this._scrollDuringMove (after scroll)",
                this._scrollDuringMove
            );

            this._resetScrollLimiter();

            if (Math.abs(amount) > 1) {
                this._autoscrollTimer = setTimeout(() => {
                    console.log("CALLBACK: Autoscroll direction: ", direction);
                    let newPosTmp = this.movingItem.currPos + direction;

                    if (
                        this.requestAutoscroll(direction) != 0 &&
                        newPosTmp >= 0 &&
                        newPosTmp < this._taskCount
                    ) {
                        this._refreshAndAnimate(newPosTmp);
                    }
                }, 500);
            }
            return amount;
        } else {
            console.log("ERROR: Can't scroll yet ... ");
        }

        return 0;
    };

    updateDraggedRowOrder = () => {
        let initialOrder = this.movingItem.initOrder;
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

    _renderItem = ({ item, index }) => {
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
                moveEnded={this.onMoveEnded}
                moveItemType={moveType}
                updateDraggedRowOrder={this.updateDraggedRowOrder}
                panAnimVal={this._panAnim}
                index={index} // required, since (order != index) if any items are being hidden
                // containerDimensions={this.props.containerDimensions}
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
        console.log("\n\n");
        console.log("---------- _scrollIfNeededAndAllowed ----------");

        if (this._canScroll != true) {
            console.log("Can't scroll yet");
            return 0;
        }

        let { height } = this.props.containerDimensions;
        // check if the dragged item is at the bottom row of the current WINDOW of the flatlist
        // console.log("Container height", height);
        // console.log("vs. ", yPos);
        // console.log("velocity: ", velocity);

        clearInterval(this._autoscrollTimer);

        if (yPos >= height - 55 && velocity > 0) {
            console.log("Requesting scroll DOWN!");
            return this.requestAutoscroll(1);

            // if (scrolledBy != 0) {
            //     this._panPosOnLastScroll = yPos - (yPos % 55); // set to nearest lower multiple of row height
            // }
        } else {
            console.log("xxx - Not scrolling down... reason:");
            if (yPos < height - 100) {
                console.log(
                    "   yPos is less than height-120: ",
                    yPos,
                    height - 100
                );
            } else if (velocity < 0) {
                console.log("   velocity less than 0: ", velocity);
            }
        }

        if (yPos <= 55 && velocity < 0) {
            console.log("Requesting scroll UP!");
            return this.requestAutoscroll(-1);
            // if (scrolledBy != 0) {
            //     this._panPosOnLastScroll = yPos + (yPos % 55); // set to nearest upper multiple of row height
            // }
        } else {
            console.log("xxx - Not scrolling UP... reason:");
            if (yPos > 55) {
                console.log("   yPos is more than 55: ", yPos);
            } else if (velocity > 0) {
                console.log("   velocity more than 0: ", velocity);
            }
        }
        return 0;
    }

    _refreshAndAnimate(newPosTmp) {
        if (newPosTmp != this.movingItem.currPos) {
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
        newPosTmp = Math.min(this._taskCount - 1, newPosTmp);

        // make sure newPosition is not < 0
        newPosTmp = Math.max(newPosTmp, 0);

        if (this._scrollIfNeededAndAllowed(y, velocityY) == 0) {
            this._refreshAndAnimate(newPosTmp);
        }
    };

    updateFilteredTasks = nextProps => {
        let alarmTasks = nextProps.data;
        this.filteredAlarmTasks = nextProps.hideDisabledTasks
            ? nextProps.data.filtered("enabled == true")
            : null;

        if (this.filteredAlarmTasks) {
            this.filterMap = this.filteredAlarmTasks.map(aTask => {
                return aTask.order;
            });
        } else {
            this.filterMap = null;
        }
    };

    componentWillReceiveProps(nextProps) {
        let prevVisibleTasksCount = this.hideDisabledTasks
            ? this.filteredAlarmTasks.length
            : nextProps.data.length;

        this.updateFilteredTasks(nextProps);

        let nextVisibleTasksCount = nextProps.hideDisabledTasks
            ? this.filteredAlarmTasks.length
            : nextProps.data.length;

        if (
            this.hideDisabledTasks == false &&
            nextProps.hideDisabledTasks == true
        ) {
            // user has just pressed hideDisabledTasks (we are now hiding disabled tasks)
            // we need to call scroll since it seems Native does not handle the change in content size gracefully
            //  ie) otherwise there will be a gap at the bottom of the list until user manually scrolls.
            // NOTE: Again, this delay is necessary because Native doesn't know yet that there is about to be
            //          fewer items on the list.
            setTimeout(() => {
                this._scrollView.getNode().scrollToOffset({
                    offset: this._scrollAmount
                });
            }, 200);

            // this._scrollView.getNode().scrollToOffset({
            //     offset:
            //         this._scrollAmount -
            //         (prevVisibleTasksCount - nextVisibleTasksCount) * 55
            // });
        }

        if (this._taskCountTotal > nextProps.data.length) {
            // taskItem was deleted
            console.log("A taskItem was deleted");
            this._scrollView.getNode().scrollToOffset({
                offset: this._scrollAmount - 55
            });
        } else if (this._taskCountTotal < nextProps.data.length) {
            // taskItem was added
            console.log("A taskItem was added");
            this._fScrollToEnd = true;
        } else {
            console.log("No taskItems were added or deleted");
        }
        this._taskCount = nextVisibleTasksCount;
        this._taskCountTotal = nextProps.data.length;
        this._hideDisabledTasks = nextProps.hideDisabledTasks;
    }

    componentDidUpdate() {
        if (this._fScrollToEnd) {
            this._fScrollToEnd = false;

            /* NOTE: For some reason delay is required in order for the newly added item to be included in the native 
                calculation of what 'end' is equal to. In other words, give Native a few moments to register that there 
                is a new item at the bottom, before calling scrollToEnd.
            */
            setTimeout(() => {
                this._scrollView.getNode().scrollToEnd();
            }, 300);
        }
    }

    render() {
        console.debug("Render TaskList");
        console.debug("taskCount (excluding hidden rows): ", this._taskCount);
        let contContainerStyle = styles.contContainerStyleNotEmpty;

        let alarmTasks = this.props.data;

        if (this.filteredAlarmTasks) {
            if (this.filteredAlarmTasks.length == 0) {
                contContainerStyle = styles.contContainerStyleEmpty;
            }
        } else {
            if (alarmTasks.length == 0) {
                contContainerStyle = styles.contContainerStyleEmpty;
            }
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
                {/* This wrapper view is required for the TouchableWithoutFeedback to work within the TaskArea, and to give bottom SafeArea space */}
                <View style={{ flex: 1 }}>
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

                                console.log(
                                    "[DEBUG] From: ",
                                    this.movingItem.initOrder
                                );
                                console.log(
                                    "[DEBUG] To: ",
                                    this.movingItem.currPos
                                );

                                let relativeMovement =
                                    this.movingItem.currPos -
                                    this.movingItem.initOrder;

                                console.log(
                                    "[DEBUG] relativeMovement: ",
                                    relativeMovement
                                );
                                console.log(
                                    "[DEBUG] _scrollDuringMove",
                                    this._scrollDuringMove
                                );

                                clearInterval(this._autoscrollTimer);

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
                                        data: this.movingItem.task,
                                        from: this.movingItem.initOrder,
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
                            data={this.filteredAlarmTasks || alarmTasks}
                            renderItem={this._renderItem.bind(this)} // pass in # of tasks showing to renderItem
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
                                        this.movingItem.initOrder * 55 -
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
                                index={this.movingItem.initOrder}
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
