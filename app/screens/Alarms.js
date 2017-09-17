/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
} from "react-native";

import realm from "../data/DataSchemas";
import moment from "moment";

import { ListStyle } from "../styles/list";

class Alarms extends Component {
    constructor() {
        super();
        console.log("Alarm -- Constructor");
        console.log("Fetching Alarms...");
        this.state = {};
        this.state.alarms = realm.objects("Alarm"); // TODO: filter by 'visible'=true
    }

    componentWillMount() {
        console.debug("Alarms  componentWillMount");
    }

    componentDidMount() {
        console.debug("Alarms --- ComponentDidMount");

        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions
        this.props.navigation.setParams({
            handleAddAlarm: this.handleAddAlarm.bind(this)
        });
    }

    componentWillReceiveProps() {
        console.debug("Alarms  componentWillReceiveProps");
    }

    componentWillUpdate() {
        console.debug("Alarms  componentWillUpdate");
    }
    componentDidUpdate() {
        console.debug("Alarms  componentDidUpdate");
    }
    componentWillUnmount() {
        console.debug("Alarms  componentWillUnmount");
    }

    reloadAlarms = () => {
        console.debug("Reloading alarms list");
        this.setState({ alarms: realm.objects("Alarm") }); // TODO: filter by 'visible'=true
    };

    /*
    Handler for 'Add-Alarm' button press. Navigates to AlarmDetail screen sending no Alarm data.
    SIDE-NOTE: This is a NORMAL function (NOT an arrow function). Therefore, this function creates its own 'this'
                context. 'this.props' is only accessible from within this function because I 'bound' the external
                'this' context (the class's "this") within the render method. A different way of doing this is to use
                an arrow function, which uses the 'this' value of the enclosing execution context. Therefore, when
                referencing an arrow function, you don't need to bind 'this' in order for it to be access the outer
                scope 'this'.
     */
    handleAddAlarm() {
        console.log("Adding alarm");
        this.props.navigation.navigate("AlarmDetail", {
            newAlarm: true,
            reloadAlarms: this.reloadAlarms
        });
    }

    _keyExtractor = (item) => {
        return item.id;
    };

    _onPressItem = item => {
        // console.debug("_onPressItem called");
        this.props.navigation.navigate("AlarmDetail", {
            alarm: item,
            reloadAlarms: this.reloadAlarms
        });
    };

    _renderItem = ({ item }) => {
        console.debug("alarm: ", item);
        return (
            <TouchableOpacity
                style={ListStyle.item}
                id={item.id}
                label={item.label}
                onPress={this._onPressItem.bind(this, item)}
            >
                <Text>
                    {moment
                        .utc(item.wakeUpTime)
                        .local()
                        .format("h:mm A")}
                </Text>
                <Text>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    render() {
        console.debug("AlarmsList Render");
        console.debug(this.state);
        return (
            <View style={ListStyle.container}>
                <FlatList
                    data={this.state.alarms}
                    renderItem={this._renderItem}
                    keyExtractor={this._keyExtractor}
                />
            </View>
        );
    }
}

export default Alarms;
