/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import DurationText from "./duration-text";

class TaskItem extends React.PureComponent {

    constructor(props) {
        super(props);

    }

    _onPress = () => {
        this.props.onPressItem(this.props.id);
    };

    render() {
        return (
            <TouchableOpacity style={itemStyle.item} onPress={this._onPress}>
                <Text style={[itemStyle.allChildren, itemStyle.description]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    {...this.props} // the '...' is JavaScript way to expand variable # of args
                >
                    {this.props.taskName}
                </Text>
                <DurationText hours="1" minutes="10" style={[itemStyle.allChildren, {flexGrow: 1}]}/>
            </TouchableOpacity>
        );
    }
}


const itemStyle = StyleSheet.create({
    item: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        height: 65,
        borderBottomColor: "#000",
        borderBottomWidth: 1,
        alignItems: 'center',
        marginLeft: -5,
        marginRight: -5,
    },
    allChildren: {
        marginLeft: 5,
        marginRight: 5,
        fontSize: 20,
        overflow: "hidden",

    },
    description: {
        flexBasis: "82%",
    },
    duration: {
        flexBasis: "18%",
    }
});


export default TaskItem;