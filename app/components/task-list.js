/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import TaskItem from './task-item';

class TaskList extends React.PureComponent {

    // state = {selected: (new Map(): Map<string, boolean>)};

    constructor(props) {
        super(props);
        console.log("\n\n\n\nProps passed to task-list ----------: \n");
        console.log(props);

    }


    componentWillReceiveProps(e){
        console.log("\ncomponentWillReceiveProps", e);
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
        let tasksArr = [];
        for (let id in this.props.data) {
            tasksArr.push(this.props.data[id]);
        }
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
