/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';

class TaskList extends Component {

    render() {
        return (
            <View style={listStyle.container}>
                <FlatList
                    data={[
                        {key: 'Devin'},
                        {key: 'Jackson'},
                        {key: 'James'},
                        {key: 'Joel'},
                        {key: 'John'},
                        {key: 'Jillian'},
                        {key: 'Jimmy'},
                        {key: 'Julie'},
                        {key: 'Zevin'},
                        {key: 'Zackson'},
                        {key: 'Zames'},
                        {key: 'Zoel'},
                        {key: 'Zohn'},
                        {key: 'Zillian'},
                        {key: 'Zimmy'},
                        {key: 'Zulie'},
                    ]}
                    renderItem={({item}) => <Text style={listStyle.item}>{item.key}</Text>}
                />
            </View>
        );
    }
}


const listStyle = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 22,
        backgroundColor: 'green',
        flexDirection: 'row',
    },
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
});

export default TaskList;
