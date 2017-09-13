/**
 * Created by rdunn on 2017-08-23.
 */

'use strict';

import {StyleSheet} from 'react-native';

export const ListStyle = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
        backgroundColor: '#e8e8e8',
        flexDirection: 'row',
    },
    item: {
        height: 80,
        padding: 10
    },
});

const AlarmListStyle = StyleSheet.create({

});

const AlarmItemStyle = StyleSheet.create({

});

export const TaskListStyle = StyleSheet.create({
    item: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        height: 55,
        alignContent: 'stretch',
        borderBottomColor: "#acacac",
        borderBottomWidth: 1,
        alignItems: 'center',
        marginLeft: -5,
        marginRight: -5,
        backgroundColor: "#dbd6dd"
    },
    allChildren: {
        marginLeft: 5,
        marginRight: 5,
        fontSize: 20,
        overflow: "hidden",
    },
});

export const TaskItemStyle = StyleSheet.create({
    checkbox: {
        flexBasis: "10%",
    },
    description: {
        flexBasis: "65%",
    },
    duration: {
        // alignSelf: 'stretch',
        textAlign: "right",
        flexBasis: "20%",
        // flexGrow: 1,
        fontSize: 15
    }
});

