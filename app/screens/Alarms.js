/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    FlatList,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
    Animated,
    Easing,
    LayoutAnimation
} from "react-native";
import PushController from "../alarmservice/PushController";
import realm from "../data/DataSchemas";

import { ListStyle } from "../styles/list";
import AlarmItem from "../components/alarm-item";

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
            alarms: realm.objects("Alarm"), // TODO: filter by 'visible'=true
            activeRow: null
        };
    }

    componentWillUpdate() {
        // console.log("this.props.navigation", this.props.navigation);
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
        LayoutAnimation.easeInEaseOut();
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

    overlay(top, height) {
        return (
            <TouchableOpacity
                style={{
                    position: "absolute",
                    height: height,
                    width: this.width,
                    backgroundColor: "green",
                    left: 0,
                    top: top,
                    alignSelf: "center",
                    justifyContent: "center"
                }}
                onPress={() => {
                    console.log("Clicked overlay");
                    delete this.state.deleteShowing;
                    this.setState({ collapseAll: true });
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
        if (this.state.activeRow == null) {
            this.props.navigation.navigate("AlarmDetail", {
                alarm: alarmItem,
                reloadAlarms: this.reloadAlarms
            });
        } else {
            this.setState({ activeRow: null });
        }
    };

    _onPressDelete = (item, event) => {
        // console.log("onPressDelete: ", item);
        realm.write(() => {
            realm.delete(item);
        });
        LayoutAnimation.spring();
        this.setState(this.state);

        // const { onRemove } = this.props;
        // if (onRemove) {
        //     Animated.timing(this._animated, {
        //         toValue: 0,
        //         duration: 1000
        //     }).start(() => {
        //         let tempState = this.state;
        //         delete tempState.deleteShowing;
        //         this.setState(tempState);
        //     });
        // }
    };

    _onAlarmToggled = alarm => {
        // console.log("alarm toggled: ", alarm);
        realm.write(() => {
            alarm.enabled = !alarm.enabled;
        });
        // console.log("alarm toggled: ", alarm);
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

    _onRowSwipe = (item, rowId, direction) => {
        console.log("=========== row swiped ============", item);
        this.setState({ activeRow: item.id });
    };

    _onRowDismiss = (item, rowId, direction) => {
        console.log("*********** row dismissed **********", item);
        if (
            item.id === this.state.activeRow &&
            typeof direction !== "undefined"
        ) {
            this.setState({ activeRow: null });
        }
    };

    _onPressBackground = () => {
        console.log("Pressed background");
        this.setState({ activeRow: null });
    };

    render() {
        console.debug("AlarmsList Render");
        // console.debug(this.state);
        let close;
        let overlayTop, overlayBottom;
        let { alarms } = this.state;
        // console.log("iterating alarms");

        // for (let i = 0; i < alarms.length; i++) {
        //     // console.log("iterating...");
        //     // console.log("alarm", alarms[i]);
        //     if (alarms[i].deleteShowing === true) {
        //         console.log("creating overlays");
        //         // Based on the index of the row showing the delete button, create overlay(s) above and below if necessary
        //         overlayBottom = this.overlay((i + 1) * 120, this.height);
        //         if (i > 0) {
        //             overlayTop = this.overlay(0, i * 120);
        //         }
        //         break;
        //     }
        // }

        return (
            <TouchableWithoutFeedback
                style={ListStyle.container}
                onPressIn={this._onPressBackground}
            >
                <View style={{ flex: 1 }}>
                    <PushController />
                    <FlatList
                        data={this.state.alarms}
                        renderItem={alarm => {
                            return (
                                <AlarmItem
                                    alarm={alarm.item}
                                    onPress={this._onPressItem}
                                    onDelete={this._onPressDelete}
                                    onToggle={this._onAlarmToggled}
                                    onSwipe={this._onRowSwipe}
                                    onClose={this._onRowDismiss}
                                    close={
                                        alarm.item.id !== this.state.activeRow
                                    }
                                />
                            );
                        }}
                        keyExtractor={this._keyExtractor}
                        extraData={this.state}
                    />
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

export default Alarms;
