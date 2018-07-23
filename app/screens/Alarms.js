/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    FlatList,
    TouchableWithoutFeedback,
    Dimensions,
    LayoutAnimation,
    Platform
} from "react-native";
import { ALARM_CAT } from "../alarmservice/PushController";
import NotificationsIOS from "react-native-notifications";
import moment from "moment";
import realm from "../data/DataSchemas";

import { ListStyle } from "../styles/list";
import AlarmItem from "../components/alarm-item";
import RNSound from "react-native-sound";

var loadedSound = null;

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
            activeRow: null,
            menuVisible: false
        };

        console.log("Setting up notifications");

        // setup notifications
        // NotificationsIOS.addEventListener(
        //     "remoteNotificationsRegistered",
        //     this.onPushRegistered.bind(this)
        // );
        if (Platform.OS === "ios") {
            NotificationsIOS.requestPermissions([ALARM_CAT]);

            NotificationsIOS.consumeBackgroundQueue();

            // NotificationsIOS.addEventListener(
            //     "pushKitRegistered",
            //     this.onPushKitRegistered.bind(this)
            // );
            // NotificationsIOS.registerPushKit();

            NotificationsIOS.addEventListener(
                "notificationReceivedForeground",
                this.onNotificationReceivedForeground.bind(this)
            );
            NotificationsIOS.addEventListener(
                "notificationReceivedBackground",
                this.onNotificationReceivedBackground.bind(this)
            );
            NotificationsIOS.addEventListener(
                "notificationOpened",
                this.onNotificationOpened.bind(this)
            );
        }
    }

    onPushRegistered(deviceToken) {
        console.log("Device Token Received: " + deviceToken);
    }

    onPushKitRegistered(deviceToken) {
        console.log("PushKit Token Received: " + deviceToken);
    }

    onNotificationReceivedForeground(notification) {
        console.log(
            "Notification Received Foreground: " + JSON.stringify(notification)
        );
    }

    onNotificationReceivedBackground(notification) {
        NotificationsIOS.log(
            "Notification Received Background: " + JSON.stringify(notification)
        );
        console.log("Got background notification");

        // this.playRingtone("super_ringtone.mp3");
        // this.playLoadedRintone();
        // logs.push(notification.getCategory());
        // logs.push(notification.getData());
        // logs.push(notification.getType());
        // let localNotification = NotificationsIOS.localNotification({
        //     alertBody: "Received background notificiation!",
        //     alertTitle: "Local Notification Title",
        //     alertAction: "Click here to open",
        //     soundName: "chime.aiff",
        //     category: "ALARM_CATEGORY",
        //     userInfo: notification.getData()
        // });

        // if you want to fire the local notification 10 seconds later,
        // add the following line to the notification payload:
        //      fireDate: new Date(Date.now() + (10 * 1000)).toISOString()

        // NotificationsIOS.backgroundTimeRemaining(time => NotificationsIOS.log("remaining background time: " + time));

        // NotificationsIOS.cancelLocalNotification(localNotification);
    }

    playRingtone(soundFile) {
        RNSound.setCategory("Playback");

        var ringtone = new RNSound(soundFile, RNSound.MAIN_BUNDLE, error => {
            if (error) {
                console.log("failed to load the sound", error);
                return;
            }
            // loaded successfully
            console.log(
                "duration in seconds: " +
                    ringtone.getDuration() +
                    "number of channels: " +
                    ringtone.getNumberOfChannels()
            );

            // Play the sound with an onEnd callback
            ringtone.play(success => {
                if (success) {
                    console.log("successfully finished playing");
                } else {
                    console.log("playback failed due to audio decoding errors");
                    // reset the player to its uninitialized state (android only)
                    // this is the only option to recover after an error occured and use the player again
                    ringtone.reset();
                }

                ringtone.release();
            });

            ringtone.setVolume(0.5);
        });
    }

    playLoadedRintone() {
        RNSound.setCategory("Playback");
        if (loadedSound) {
            // Play the sound with an onEnd callback
            loadedSound.play(success => {
                if (success) {
                    console.log("successfully finished playing");
                } else {
                    console.log("playback failed due to audio decoding errors");
                    // reset the player to its uninitialized state (android only)
                    // this is the only option to recover after an error occured and use the player again
                    loadedSound.reset();
                }

                loadedSound.release();
            });
        }
        // ringtone.setVolume(0.5);
    }

    scheduleNotification(alarm, wakeUpDate) {
        let localNotification;
        let wakeMoment = moment(wakeUpDate);
        if (Platform.OS === "ios") {
            // schedule notifications for this Alarm, staggering them by the "SNOOZE Time"
            // NOTE: "Snooze Time" will likely be changable option for users per Alarm.
            //         TODO: Add "snoozePeriod" as a property to Alarm entity in database
            //         TODO: Add UI and functionality to set a Snooze time from AlarmDetail screen (menu maybe?)

            // For now, use a constant 1 minute as a Snooze Time
            let snoozeTime = 60;
            let notiCount = 10;
            for (let i = 0; i < notiCount; i++) {
                NotificationsIOS.localNotification({
                    alertBody: alarm.label,
                    alertTitle: "Clockulate",
                    alertAction: "Click here to open",
                    soundName: alarm.sound,
                    // silent: true,
                    category: "ALARM_CATEGORY",
                    fireDate: wakeMoment.toDate(),
                    // fireDate: new Date(Date.now() + 10 * 1000).toISOString(),
                    userInfo: { alarmId: alarm.id }
                });
                wakeMoment.add(snoozeTime, "s");
            }
        }

        // lastNotificationIds.push(
        //     NotificationsIOS.localNotification({
        //         alertBody: alarm.label,
        //         alertTitle: "Clockulate",
        //         alertAction: "Click here to open",
        //         soundName: alarm.sound,
        //         // silent: true,
        //         category: "ALARM_CATEGORY",
        //         // fireDate: wakeUpDate.toDate()
        //         fireDate: new Date(Date.now() + 60 * 1000).toISOString()
        //     })
        // );
        //     id: alarm.id, // FOR ANDROID
        //     userInfo: { id: alarm.id }, // FOR IOS
        //     // alertAction: "",
        //     message: alarm.label, // (required)
        //     date: wakeUpDate.toDate(),
        //     playSound: true,
        //     soundName: alarm.sound,
        //     foreground: true
        //     // repeatType: "minute",
        //     // actions: '["Snooze", "Turn Off"]'

        console.log("notification IDs: ", localNotification);
    }

    onNotificationOpened(notification) {
        console.log("Notification Opened: " + JSON.stringify(notification));
    }

    _onNotification(notification) {
        AlertIOS.alert(
            "Notification Received",
            "Alert message: " + notification.getMessage(),
            [
                {
                    text: "Dismiss",
                    onPress: null
                }
            ]
        );
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
        console.info("adding show menu");

        this.props.navigation.setParams({
            handleAddAlarm: this.handleAddAlarm.bind(this),
            showMenu: () => this.props.navigation.navigate("DrawerRoot")
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
        if (Platform.OS === "ios") {
            NotificationsIOS.removeEventListener(
                "notificationReceivedForeground",
                this.onNotificationReceivedForeground.bind(this)
            );
            NotificationsIOS.removeEventListener(
                "notificationReceivedBackground",
                this.onNotificationReceivedBackground.bind(this)
            );
            NotificationsIOS.removeEventListener(
                "notificationOpened",
                this.onNotificationOpened.bind(this)
            );
        }
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

        /* TODO: TEST WITHOUT THE FOLLOWING : Trying without this code here, since this functionality should be 
        performed in AlarmDetail now (whenever ArrivalTime or WakeupTime are set)
        */
        // let wakeUpDate = moment();
        // console.log("Date right now: " + wakeUpDate.toDate());
        // let wakeUpTime = moment(alarm.wakeUpTime);
        // console.log("Straight from DB: " + wakeUpTime.toDate());

        // wakeUpDate
        //     .set("hour", wakeUpTime.hour())
        //     .set("minute", wakeUpTime.minute())
        //     .set("second", 0);
        // console.log("Applied today's date: " + wakeUpDate.toDate());
        // // Check if this moment is in the past. If so add 1 day.
        // if (wakeUpDate.diff(moment()) < 0) {
        //     wakeUpDate.add(1, "days");
        // }
        /* END TEST */

        // console.log(wakeUpTime);
        console.log("WakeUpTime: " + alarm.wakeUpTime);
        if (alarm.enabled) {
            console.log("Setting alarm");
            // this.playRingtone(alarm.sound);
            // this.playRingtone("super_ringtone.mp3");
            // this.playRingtoneAsVid("super_ringtone.mp3");
            this.scheduleNotification(alarm, alarm.wakeUpTime);
            // PushNotification.localNotificationSchedule({
            //     id: alarm.id, // FOR ANDROID
            //     userInfo: { id: alarm.id }, // FOR IOS
            //     // alertAction: "",
            //     message: alarm.label, // (required)
            //     date: wakeUpDate.toDate(),
            //     playSound: true,
            //     soundName: alarm.sound,
            //     foreground: true
            //     // repeatType: "minute",
            //     // actions: '["Snooze", "Turn Off"]'
            // });
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

        return (
            <TouchableWithoutFeedback
                style={ListStyle.container}
                onPressIn={this._onPressBackground}
            >
                <View style={{ flex: 1 }}>
                    {/* <PushController /> */}
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
