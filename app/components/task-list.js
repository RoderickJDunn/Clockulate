/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import TaskItem from "./task-item";
import TouchableBackdrop from "../components/touchable-backdrop";

class TaskList extends React.PureComponent {
    // TODO: Comment the structure of Props passed in (we don't need a constructor since we are not keeping state in this component)

    componentWillReceiveProps(e) {
        // console.log("\ncomponentWillReceiveProps", e);
    }

    _keyExtractor = (item, index) => item.id;

    _renderItem = ({ item, index }) => {
        let { onSnapTask, ...other } = this.props;
        console.log("other", other);
        console.log("onSnapTask", onSnapTask);
        console.log("index", index);
        onSnapTask.bind(item);
        let closed = true;
        if (this.props.activeTask == index) {
            closed = false;
        }
        return (
            <TaskItem
                {...other} // the props expanded here include 'onPressItem' callback, and the onPressItemCheckBox callback
                data={item}
                id={item.id}
                onSnapTask={this._onSnapTask.bind(this, item, index)}
                closed={closed}
            />
        );
    };

    _onSnapTask(item, index, rowState) {
        console.log("onSnapTask in TaskList");
        console.log("item", item);
        console.log("index", index);
        console.log("rowState", rowState);
        this.props.onSnapTask(item, index, rowState);
    }

    render() {
        console.debug("Render TaskList: props: ", this.props);
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
        // console.log("taskArr", tasksArr);
        return (
            <View style={listStyle.container}>
                <FlatList
                    data={tasksArr}
                    renderItem={this._renderItem.bind(this)}
                    keyExtractor={this._keyExtractor}
                />
                {touchableBackdrop}
            </View>
        );
    }
}

const listStyle = StyleSheet.create({
    container: {
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
