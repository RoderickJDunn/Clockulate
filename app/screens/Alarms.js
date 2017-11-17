/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Animated,
    Easing,
    LayoutAnimation
} from "react-native";
import { createAnimatableComponent } from "react-native-animatable";
import PushNotification from "react-native-push-notification";
import PushController from "../alarmservice/PushController";
import realm from "../data/DataSchemas";

import Colors from "../styles/colors";
import { ListStyle, AlarmListStyle } from "../styles/list";
import AlarmItem from "../components/alarm-item";
import { TextStyle } from "../styles/text";

class Alarms extends Component {
    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    listItemAnimation = "bounceInUp";
    constructor() {
        super();
        console.log("Alarm -- Constructor");
        console.log("Fetching Alarms...");
        this.state = {};
        this.state = {
            alarms: realm.objects("Alarm") // TODO: filter by 'visible'=true
        };
    }

    componentWillUpdate() {
        LayoutAnimation.spring();
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

    handleAddAlarm() {
        // console.log("Adding alarm");
        this.props.navigation.navigate("AlarmDetail", {
            newAlarm: true,
            reloadAlarms: this.reloadAlarms
        });
    }

    reloadAlarms = () => {
        // console.debug("Reloading alarms list");
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

    _makeOverlay() {
        return (
            <TouchableOpacity
                style={{
                    position: "absolute",
                    height: this.height,
                    width: this.width,
                    backgroundColor: "transparent",
                    left: 0,
                    top: 0,
                    alignSelf: "center",
                    justifyContent: "center"
                }}
                onPress={() => {
                    let tempState = this.state;
                    delete tempState.showDelete;
                    this.setState(tempState);
                }}
            />
        );
    }

    // _renderItem = ({ item, index }) => {};

    _keyExtractor = item => {
        return item.id;
    };

    _onPressItem = alarmItem => {
        console.debug("_onPressItem called");
        console.log("item", alarmItem);

        // console.log("showDelete", this.state.showDelete);
        if (!("showDelete" in this.state) || isNaN(this.state.showDelete)) {
            this.props.navigation.navigate("AlarmDetail", {
                alarm: alarmItem,
                reloadAlarms: this.reloadAlarms
            });
        } else {
            let tempState = this.state;
            delete tempState.showDelete;
            this.setState(tempState);
        }
    };

    _onPressDelete = (item, event) => {
        console.log("onPressDelete: ", item);
        realm.write(() => {
            realm.delete(item);
        });
        this.setState(this.state);

        // const { onRemove } = this.props;
        // if (onRemove) {
        //     Animated.timing(this._animated, {
        //         toValue: 0,
        //         duration: 1000
        //     }).start(() => {
        //         let tempState = this.state;
        //         delete tempState.showDelete;
        //         this.setState(tempState);
        //     });
        // }
    };

    _onAlarmToggled = alarm => {
        console.log("alarm toggled: ", alarm);
        realm.write(() => {
            alarm.enabled = !alarm.enabled;
        });
        console.log("alarm toggled: ", alarm);
        // if (alarm.enabled) {
        //     console.log("Setting alarm");
        //     PushNotification.localNotificationSchedule({
        //         message: "wake up ho!", // (required)
        //         date: new Date(Date.now() + 30 * 1000) // in 60 secs
        //     });
        // }

        // console.log("this.state", this.state);
        this.setState(this.state);
    };

    render() {
        console.debug("AlarmsList Render");
        // console.debug(this.state);
        let overlay;
        if ("showDelete" in this.state) {
            overlay = this._makeOverlay();
        }
        return (
            <View style={ListStyle.container}>
                <PushController />
                {overlay}
                <FlatList
                    data={this.state.alarms}
                    renderItem={alarm => {
                        return (
                            <AlarmItem
                                alarm={alarm.item}
                                onPress={this._onPressItem}
                                onDelete={this._onPressDelete}
                                onToggle={this._onAlarmToggled}
                            />
                        );
                    }}
                    keyExtractor={this._keyExtractor}
                    extraData={this.state}
                />
            </View>
        );
    }
}

export default Alarms;
