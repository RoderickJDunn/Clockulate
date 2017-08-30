/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import TaskItem from './task-item';

class TaskList extends React.PureComponent {

    // state = {selected: (new Map(): Map<string, boolean>)};
    tasksArr = [];

    constructor(props) {
        super(props);
        console.log("\n\n\n\nProps passed to task-list ----------: \n");

        // create array from tasksList object
        for (let id in props.data) {
            this.tasksArr.push(props.data[id]);
        }

    }

    _keyExtractor = (item, index) => item.id;

    // _onPressItem = (id: string) => {
    //     console.debug("TaskList: onPressItem");
    //     // updater functions are preferred for transactional updates
    //     // console.debug("Pressed item");
    //     this.setState((state) => {
    //         // copy the map rather than modifying state.
    //         const selected = new Map(state.selected);
    //         selected.set(id, !selected.get(id)); // toggle
    //         return {selected};
    //     });
    // };

    _renderItem = ({item}) => (
        <TaskItem
            {...this.props}
            // selected={!!this.state.selected.get(item.id)}
            data={item}
            id={item.id}
        />
    );

    render() {
        return (
            <View style={listStyle.container}>
                <FlatList
                    data={this.tasksArr}
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
        backgroundColor: '#e8e8e8',
        flexDirection: 'row',
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
});

export default TaskList;
