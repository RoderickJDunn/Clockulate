/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import TaskItem from './task-item';

class TaskList extends React.PureComponent {

    state = {selected: (new Map(): Map<string, boolean>)};

    _keyExtractor = (item, index) => item.title;

    _onPressItem = (id: string) => {
        // updater functions are preferred for transactional updates
        console.debug("Pressed item");
        this.setState((state) => {
            // copy the map rather than modifying state.
            const selected = new Map(state.selected);
            selected.set(id, !selected.get(id)); // toggle
            return {selected};
        });
    };

    _renderItem = ({item}) => (
        <TaskItem
            id={item.id}
            taskName={item.title}
            onPressItem={this._onPressItem}
            selected={!!this.state.selected.get(item.id)}
            // the '!!' ensures that the item.id is not null. The first '!' converts a Truthy value to False, or a
                // Falsey value to True. The second '!' converts the False/True to their opposites (True/False).
        />
    );

    render() {
        return (
            <View style={listStyle.container}>
                <FlatList
                    data={[
                        {key: 'item1', title: 'Walk the dogs'},
                        {key: 'item2', title: 'Take the garbage outside to the back'},
                        {key: 'item3', title: 'Take a shower'},
                        {key: 'item4', title: 'Work out (cardio)'},
                        {key: 'item5', title: 'Eat breakfast'},
                        {key: 'item6', title: 'Finish doing a difficult homework assignment that I should\'ve done weeks ago'},
                        {key: 'item7', title: 'Jimmy'},
                        {key: 'item8', title: 'Julie'},
                        {key: 'item9', title: 'Zevin'},
                        {key: 'item10', title: 'Zackson'},
                        {key: 'item11', title: 'Zames'},
                        {key: 'item12', title: 'Zoel'},
                        {key: 'item13', title: 'Zohn'},
                        {key: 'item14', title: 'Zillian'},
                        {key: 'item15', title: 'Zimmy'},
                        {key: 'item16', title: 'Zulie'},
                    ]}
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
        paddingTop: 10,
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
