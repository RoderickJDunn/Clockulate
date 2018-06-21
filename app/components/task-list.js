/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import SortableListView from "react-native-sortable-listview";

import TaskItem from "./task-item";
import TouchableBackdrop from "../components/touchable-backdrop";

class TaskList extends React.Component {
    // TODO: Comment the structure of Props passed in (we don't need a constructor since we are not keeping state in this component)

    // componentWillReceiveProps(e) {
    //     // console.log("\ncomponentWillReceiveProps", e);
    // }

    _keyExtractor = (item, index) => item.id;

    _renderItem = (item, sectionId, rowID) => {
        let { onSnapTask, sortHandlers, ...other } = this.props;
        // console.log("onSnapTask prop", onSnapTask);
        // console.log("other props", other);
        // console.log("sectionId", sectionId);
        // console.log("rowID", rowID);
        // console.log("item", item);
        onSnapTask.bind(item);
        let closed = true;
        if (this.props.activeTask == rowID) {
            closed = false;
        }
        return (
            <TaskItem
                {...other} // the props expanded here include 'onPressItem' callback, and the onPressItemCheckBox callback
                data={item}
                id={item.id}
                onSnapTask={this._onSnapTask.bind(this, item, rowID)}
                closed={closed}
                disabled={this.props.isEditingTasks}
                {...sortHandlers}
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
        console.debug("Render TaskList");
        console.debug("props: ", this.props);
        let tasksArr = [];
        for (let id in this.props.data) {
            tasksArr.push(this.props.data[id]);
        }
        let touchableBackdrop = null;
        if (this.props.activeTask != null) {
            touchableBackdrop = (
                <TouchableBackdrop
                    style={{
                        top: 0,
                        width: this.width,
                        height: this.height
                    }}
                    onPress={() => {
                        console.log(
                            "-----Pressed touchable backdrop of TaskList --------------------"
                        );
                        this._closeTaskRows();
                    }}
                />
            );
        }
        // console.log("tasksArr in task-list", tasksArr);
        return (
            <View style={listStyle.container}>
                <SortableListView
                    data={tasksArr}
                    renderRow={(item, sectionId, rowID) =>
                        this._renderItem(item, sectionId, rowID)
                    }
                    keyExtractor={this._keyExtractor}
                    disableAnimatedScrolling={true}
                    disableSorting={!this.props.isEditingTasks}
                    moveOnPressIn={this.props.isEditingTasks}
                    onRowMoved={moveInfo => {
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
                            moveInfo.row.data.id,
                            moveInfo.from,
                            moveInfo.to
                        );
                    }}
                />
                {touchableBackdrop}
            </View>
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
