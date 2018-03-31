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
import PushNotification from "react-native-push-notification";
import moment from "moment";

import realm from "../data/DataSchemas";

import { ListStyle } from "../styles/list";
import AlarmItem from "../components/alarm-item";

class Alarms extends Component {
    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    _didFocusListener = null;

    constructor() {
        super();
        console.log("AlarmsList -- Constructor");
        //console.log("Fetching Alarms...");
        this.state = {
            alarms: realm.objects("Alarm").sorted("order"), // TODO: filter by 'visible'=true
            activeRow: null
        };
    }

    componentWillUpdate() {
        // console.log("this.props.navigation", this.props.navigation);
        console.log("AlarmsList - componentWillUpdate");
    }

    componentDidMount() {
        console.info("AlarmsList --- ComponentDidMount");

        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions

        this.props.navigation.setParams({
            handleAddAlarm: this.handleAddAlarm.bind(this)
        });

        // this._didFocusListener = this.props.navigation.addListener(
        //     "didFocus",
        //     payload => {
        //         console.debug(
        //             "^^^^^^^^^^^^^\n^^^^^^^^^^^^^\n^^^^^^^^^^^^^\n^^^^^^^^^^^^^\n"
        //         );
        //         console.debug("didFocus", payload);
        //     }
        // );
    }

    componentWillUnmount() {
        console.info("AlarmsList --- componentWillUnmount");
    }
    handleAddAlarm() {
        console.info("Adding alarm");
        this.props.navigation.navigate("AlarmDetail", {
            newAlarm: true,
            reloadAlarms: this.reloadAlarms
        });
    }

    reloadAlarms = alarmId => {
        console.info("AlarmsList - reloading alarms list");
        // console.log("this: ", this.constructor.name); /* This is how you check a class's name (here i'm checking 'this') */
        // console.debug(this.state);
        this.setState({ alarms: realm.objects("Alarm").sorted("order") }); // TODO: filter by 'visible'=true
        // console.debug("Called set state from reloadAlarms");
        // console.debug(this.state);

        // TODO: schedule the notification for the alarmId passed in (the alarm that we were just editing)
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

    // _renderItem = ({ item, index }) => {};

    _keyExtractor = item => {
        return item.id;
    };

    _onPressItem = alarmItem => {
        console.info("AlarmsList - _onPressItem called");
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
        console.info("AlarmsList - onPressDelete: ", item);
        realm.write(() => {
            realm.delete(item);
        });
        let config = {
            duration: 1000,
            update: {
                duration: 1000,
                type: "spring",
                springDamping: 0.5,
                property: "scaleXY"
            },
            delete: {
                duration: 10,
                type: "linear",
                property: "opacity"
            }
        };
        LayoutAnimation.configureNext(config);
        this.setState(this.state);
    };

    _onAlarmToggled = alarm => {
        console.info("AlarmsList - alarm toggled: ");
        realm.write(() => {
            alarm.enabled = !alarm.enabled;
        });
        console.log(alarm);

        // create moment() by adding 'wakeup-time' (ms) and 00:00:00 today
        // let wakeUpTime = moment()
        //     .startOf("day")
        //     .add(alarm.wakeUpTime, "s");
        let wakeUpDate = moment();
        console.log("Date right now: " + wakeUpDate.toDate());
        let wakeUpTime = moment(alarm.wakeUpTime);
        console.log("Straight from DB: " + wakeUpTime.toDate());

        wakeUpDate
            .set("hour", wakeUpTime.hour())
            .set("minute", wakeUpTime.minute())
            .set("second", 0);
        console.log("Applied today's date: " + wakeUpDate.toDate());
        // Check if this moment is in the past. If so add 1 day. // TODO: Doesn't work yet.
        if (wakeUpDate.diff(moment()) < 0) {
            wakeUpDate.add(1, "days");
        }

        // console.log(wakeUpTime);
        console.log("Checked if date already passed: " + wakeUpDate.toDate());
        if (alarm.enabled) {
            console.log("Setting alarm");
            PushNotification.localNotificationSchedule({
                id: alarm.id, // FOR ANDROID
                userInfo: { id: alarm.id }, // FOR IOS
                // alertAction: "",
                message: alarm.label, // (required)
                date: wakeUpDate.toDate(),
                playSound: true,
                soundName: alarm.sound,
                foreground: true
                // repeatType: "minute",
                // actions: '["Snooze", "Turn Off"]'
            });
        }

        // //console.log("this.state", this.state);
        this.setState(this.state);
    };

    _onSnap = (row, rowState) => {
        console.info("AlarmsList - _onSnap");
        // console.log("=========== row swiped ============", row);
        // console.log("=========== rowState ============", rowState);

        if (rowState == "active") {
            this.setState({ activeRow: row.item.id });
        }
    };

    _onRowDismiss = (item, rowId, direction) => {
        console.info("AlarmsList - _onRowDismiss");
        if (
            item.id === this.state.activeRow &&
            typeof direction !== "undefined"
        ) {
            this.setState({ activeRow: null });
        }
    };

    _onPressBackground = () => {
        console.info("AlarmsList - _onPressBackground");
        this.setState({ activeRow: null });
    };

    render() {
        console.info("AlarmsList - Render");
        // console.debug(this.state);
        let { alarms } = this.state;
        // console.log("alarms", alarms);

        // alarms.forEach(a => {
        //     console.log(a.id);
        // });

        // TODO: Schedule Local notifications for active alarms
        // make sure to check whether they have already been set.
        // Figure out how to manage canceling previously set notifications, if alarm is changed.
        // TODO: Don't schedule them from render(). Only when toggled or on navigate back to this screen
        // TODO: We may need to store an additional field in database for notification ID. Or maybe we can just use the UUID

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
                                    onDelete={this._onPressDelete.bind(
                                        this,
                                        alarm.item
                                    )}
                                    onToggle={this._onAlarmToggled}
                                    onSnap={this._onSnap.bind(this, alarm)}
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
