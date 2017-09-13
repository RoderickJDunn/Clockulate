/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import TaskItem from './task-item';

class TaskList extends React.PureComponent {

    // TODO: Comment the structure of Props passed in (we don't need a constructor since we are not keeping state in this component)

    componentWillReceiveProps(e){
        // console.log("\ncomponentWillReceiveProps", e);
    }

    _keyExtractor = (item, index) => item.id;

    _renderItem = ({item}) => (
        <TaskItem
            {...this.props}  // the props expanded here include 'onPressItem' callback, and the onPressItemCheckBox callback
            data={item}
            id={item.id}
        />
    );

    render() {
        // console.debug("Render TaskList: props: ", this.props);
        let tasksArr = [];
        for (let id in this.props.data) {
            tasksArr.push(this.props.data[id]);
        }
        console.log("taskArr", tasksArr);
        return (
            <View style={listStyle.container}>
                <FlatList
                    data={tasksArr}
                    renderItem={this._renderItem}
                    keyExtractor={this._keyExtractor}
                />
            </View>
        );
    }
}


const listStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#dbd6dd',
        flexDirection: 'row',
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
});

export default TaskList;
