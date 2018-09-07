/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import SortableListView from "react-native-sortable-listview";
import DraggableFlatList from "react-native-draggable-flatlist";

import TaskItem from "./task-item";
import TouchableBackdrop from "../components/touchable-backdrop";

class TaskList extends React.Component {
    // TODO: Comment the structure of Props passed in (we don't need a constructor since we are not keeping state in this component)

    constructor() {
        super();
        this._renderItem = this._renderItem.bind(this);
    }
    // componentWillReceiveProps(e) {
    //     // console.log("\ncomponentWillReceiveProps", e);
    // }

    _keyExtractor = (item, index) => item.id;

    _renderItem = ({ item, index, move, moveEnd, isActive: isMoving }) => {
        let { onSnapTask, sortHandlers, ...other } = this.props;
        // console.log("onSnapTask prop", onSnapTask);
        // console.log("other props", other);
        // console.log("sectionId", sectionId);
        // console.log("rowID", rowID);
        // console.log("item", item);
        onSnapTask.bind(item);
        let closed = true;
        if (this.props.activeTask == index) {
            closed = false;
        }
        console.log("\n");
        // console.log("index: ", index);
        // console.log("closed: ", closed);
        return (
            <TaskItem
                // other includes 'willStartMove' cb, 'onPressItem' callback, onPressItemCheckBox callback
                {...other}
                isMoving={isMoving}
                data={item}
                id={item.id}
                onSnapTask={this._onSnapTask.bind(this, item, index)}
                closed={closed}
                disabled={this.props.isEditingTasks}
                shouldStartMove={move}
                shouldEndMove={moveEnd}
                // {...sortHandlers}
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

    // shouldComponentUpdate(nState, nProps) {
    //     return false;
    // }

    render() {
        // console.debug("Render TaskList");
        // console.debug("props: ", this.props);
        let tasksArr = [];
        for (let id in this.props.data) {
            tasksArr.push(this.props.data[id]);
        }
        // console.log("tasksArr in task-list", tasksArr);
        return (
            // <View style={[listStyle.container]}>
            <TouchableWithoutFeedback
                /* No Styling since TouchableWithoutFeedback just ignores the style prop */
                onPressIn={this.props.closeTaskRows}
            >
                {/* This wrapper view is required for the TouchableWithoutFeedback to work within the TaskArea. */}
                <View style={{ flex: 1 /*  backgroundColor: "red" */ }}>
                    <DraggableFlatList
                        data={tasksArr}
                        renderItem={this._renderItem}
                        keyExtractor={this._keyExtractor}
                        // scrollPercent={5}
                        onMoveEnd={moveInfo => {
                            // console.log("'this' now: " + this.constructor.name);
                            // console.log("moveInfo.from", moveInfo.from);
                            // console.log("moveInfo.to", moveInfo.to);
                            // console.log("row", moveInfo.row);
                            // console.log(
                            //     "tasksArr in onRowMoved callback in task-list",
                            //     tasksArr
                            // );
                            this.props.onReorderTasks(
                                tasksArr,
                                moveInfo.data.id,
                                moveInfo.from,
                                moveInfo.to
                            );
                        }}
                        scrollEnabled={!this.props.isSlidingTask}
                        onResponderRelease={() => {
                            console.log("onResponderRelease (task-list)");
                        }}
                    />
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const listStyle = StyleSheet.create({
    container: {
        flex: 0.9,
        backgroundColor: "transparent",
        flexDirection: "row"
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44
    }
});

export default TaskList;
