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
    Platform,
    DeviceEventEmitter,
    AppState,
    NativeModules
    // TouchableOpacity
} from "react-native";

import PushNotificationAndroid from "react-native-push-notification";
import {
    ALARM_CAT,
    scheduleAlarm,
    clearAlarm,
    snoozeAlarm
} from "../alarmservice/PushController";
import NotificationsIOS from "react-native-notifications";
import realm from "../data/DataSchemas";
import DraggableFlatList from "react-native-draggable-flatlist";

import ProximityManager from "react-native-proximity-manager";

import { ListStyle } from "../styles/list";
import AlarmItem from "../components/alarm-item";
import RNSound from "react-native-sound";
import * as DateUtils from "../util/date_utils";
import { AlarmModel, AlarmTaskModel } from "../data/models";
import { scaleByFactor } from "../util/font-scale";

const { UIManager } = NativeModules;

/* Dev only */
import { populateDummyAlarms } from "../data/data-prepop";

var loadedSound = null;

class Alarms extends Component {
    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    _didFocusListener = null;
    _duplicationInfo = null;

    _activeRow = null;

    constructor() {
        super();
        console.log("AlarmsList -- Constructor");
        //console.log("Fetching Alarms...");
        this.state = {
            alarms: realm.objects("Alarm").sorted("order"), // TODO: filter by 'visible'=true
            menuVisible: false,
            appState: AppState.currentState
        };

        console.log("Setting up notifications");

        if (Platform.OS === "android") {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        } // setup notifications
        else {
            ProximityManager.enable();
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
            // console.log(
            //     "duration in seconds: " +
            //         ringtone.getDuration() +
            //         "number of channels: " +
            //         ringtone.getNumberOfChannels()
            // );

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

    onNotificationOpened(notification) {
        console.log("Notification Opened: " + JSON.stringify(notification));
    }

    // componentWillUpdate() {
    //     // console.log("this.props.navigation", this.props.navigation);
    //     console.log("AlarmsList - componentWillUpdate");
    // }

    componentDidMount() {
        console.info("AlarmsList --- ComponentDidMount");

        AppState.addEventListener("change", this._handleAppStateChange);

        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions
        console.info("adding show menu");

        this.props.navigation.setParams({
            handleAddAlarm: this.handleAddAlarm.bind(this),
            showMenu: () => this.props.navigation.navigate("DrawerRoot")
        });

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
        } else {
            // PushNotificationAndroid.cancelAllLocalNotifications();

            // DeviceEventEmitter.addListener("remoteNotificationReceived", e => {
            //     console.log("Notification event: ", e);
            // });
            // Register all the valid actions for notifications here and add the action handler for each action
            PushNotificationAndroid.registerNotificationActions([
                "Snooze",
                "Turn Off"
            ]);
            DeviceEventEmitter.addListener("notificationActionReceived", e => {
                console.log("Notification event: ", e);
                // console.log(
                //     "notificationActionReceived event received: " + e
                // );
                const info = JSON.parse(e.dataJSON);
                console.log("info", info);
                if (info.action == "Snooze") {
                    // Do work pertaining to Accept action here
                    // Nothing to do here if we have already scheduled all the snooze alarms
                    snoozeAlarm(info, this.reloadAlarms.bind(this));
                } else if (info.action == "Turn Off") {
                    // Do work pertaining to Reject action here
                    // cancel all snooze notifs for this Alarm
                    clearAlarm(
                        null,
                        info.notificationId.toString(),
                        this.reloadAlarms.bind(this)
                    );
                }
                // Add all the required actions handlers
            });
        }

        this._didBlurListener = this.props.navigation.addListener(
            "didBlur",
            payload => {
                ProximityManager.disable();
            }
        );

        this._didFocusListener = this.props.navigation.addListener(
            "didFocus",
            payload => {
                ProximityManager.enable();
            }
        );
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

        AppState.removeEventListener("change", this._handleAppStateChange);
    }

    _handleAppStateChange = nextAppState => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            console.log("App has come to the foreground!");
            // set timers for in-app alarms
            this.reloadAlarms();
        }

        this.setState({ appState: nextAppState });
    };

    handleAddAlarm() {
        console.info("Adding alarm");
        this.props.navigation.navigate("AlarmDetail", {
            newAlarm: true,
            reloadAlarms: this.reloadAlarms
        });
    }

    reloadAlarms = alarmId => {
        console.info(
            "AlarmsList - reloading alarms list. Specific alarm to schedule: " +
                alarmId
        );
        // console.log("this: ", this.constructor.name); /* This is how you check a class's name (here i'm checking 'this') */
        // console.debug(this.state);
        this.setState({ alarms: realm.objects("Alarm").sorted("order") }); // TODO: filter by 'visible'=true
        // console.debug("Called set state from reloadAlarms");
        // console.debug(this.state);

        if (alarmId) {
            let changedAlarm = this.state.alarms.filtered("id = $0", alarmId);

            if (changedAlarm.length == 1) {
                console.log("wakeUpTime", changedAlarm.wakeUpTime);
                console.log("enabled", changedAlarm.enabled);

                /* Now schedule notification(s) for the changes */
                // passing in reloadAlarms function for iOS in-app alarm to be able to refresh AlarmsList screen
                scheduleAlarm(changedAlarm[0], this.reloadAlarms.bind(this));
            } else if (changedAlarm.length > 1) {
                console.error(
                    `Found more than 1 alarm with alarmId ${alarmId}. This should never happen...`
                );
            }
        }
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
        if (this._activeRow == null) {
            this.props.navigation.navigate("AlarmDetail", {
                alarm: alarmItem,
                reloadAlarms: this.reloadAlarms
            });
        } else {
            this._activeRow = null;
            this.setState(this.state);
        }
    };

    _onPressDelete = (item, event) => {
        console.info("AlarmsList - onPressDelete: ", item);

        // FIRST THING TO DO IS WE !MUST! Clear all notifications for this alarm !!!!
        clearAlarm(item);

        // Configure layout animation for when row disappears
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

        let { alarms } = this.state;
        realm.write(() => {
            // Update the 'order' field of the Alarms lower in the list than this one
            let deletedAlmPos = item.order;

            for (let i = deletedAlmPos + 1; i < alarms.length; i++) {
                alarms[i].order -= 1;
            }

            // delete the Alarm from the DB
            realm.delete(item);

            this._activeRow = null;
            this.setState({ alarms: alarms });
        });
    };

    _onPressDuplicate = (item, event) => {
        console.log("_onPressDuplicate");
        let newAlarm = new AlarmModel(this.state.alarms.length);
        newAlarm.wakeUpTime = item.wakeUpTime;
        newAlarm.arrivalTime = item.arrivalTime;
        newAlarm.mode = item.mode;
        newAlarm.tasks = []; // needs careful attention for copying due to nested objects...

        for (let i = 0; i < item.tasks.length; i++) {
            let almTask = new AlarmTaskModel(
                item.tasks[i].task,
                item.tasks[i].order
            );
            almTask.duration = item.tasks[i].duration;

            newAlarm.tasks.push(almTask);
        }

        newAlarm.label = item.label;
        newAlarm.enabled = false;
        newAlarm.visible = item.visible;
        newAlarm.preset = item.preset;
        newAlarm.sound = item.sound;
        newAlarm.snoozeTime = item.snoozeTime;
        newAlarm.noticiationId = null;

        realm.write(() => {
            realm.create("Alarm", newAlarm);
            this._duplicationInfo = {
                alarm: newAlarm,
                srcPosition: item.order
            };
            this._activeRow = null;

            this.setState(this.state);
        });
        // console.log("duplicated Alarm");
    };

    _onAlarmToggled = alarm => {
        console.info("AlarmsList - alarm toggled: ");
        realm.write(() => {
            alarm.enabled = !alarm.enabled;
        });
        // console.log(alarm);

        // console.log(wakeUpTime);
        console.log("WakeUpTime: " + alarm.wakeUpTime);
        if (alarm.enabled) {
            let wakeUpTime = DateUtils.date_to_nextTimeInstance(
                alarm.wakeUpTime
            );

            realm.write(() => {
                alarm.wakeUpTime = wakeUpTime;
            });
            console.log("Setting alarm");
            scheduleAlarm(alarm);
        } else {
            // Cancel all notification(s) for this alarm
            //  - NOTE: For iOS there are multiple notifications for each Alarm (due to snoozes)
            //          However, on Android the 'repeat' feature works, so there is only one notification
            clearAlarm(alarm);
        }

        // //console.log("this.state", this.state);
        this.setState(this.state);
    };

    _onSnap = (row, rowState) => {
        console.info("AlarmsList - _onSnap");
        // console.log("=========== row swiped ============", row);
        // console.log("=========== rowState ============", rowState);

        if (rowState == "active") {
            this._activeRow = row.item.id;
        }
    };
    _onReorderAlarms(alarmId, from, to, data) {
        console.info("_onReorderAlarms");
        // console.info("alarmId", alarmId);
        // console.info("from", from);
        // console.info("to", to);

        let alarms = realm.objects("Alarm").sorted("order");
        // console.log("alarms", alarms);
        // console.log(`alarms[${0}]`, alarms[0]);
        // console.log(`alarms[from]`, alarms[from]);
        let alarmsCopy = alarms.snapshot();
        realm.write(() => {
            for (const key in alarmsCopy) {
                // console.log("key", key);
                if (alarmsCopy.hasOwnProperty(key)) {
                    const alarm = alarmsCopy[key];
                    if (alarm.order == from) {
                        alarm.order = to;
                    } else {
                        if (
                            from < to &&
                            alarm.order <= to &&
                            alarm.order > from
                        ) {
                            alarm.order--;
                        } else if (
                            from > to &&
                            alarm.order >= to &&
                            alarm.order < from
                        ) {
                            alarm.order++;
                        }
                    }
                }
            }
        });
        // console.log("alarms", alarms);

        let orderArr = alarms.map(alm => alm.order);

        for (let i = 0; i < orderArr.length; i++) {
            let idx = orderArr.indexOf(i);
            if (idx == -1) {
                alert("Failure!");
            }
        }
        this.setState({ alarms: alarms });
    }

    _onPressBackground = () => {
        console.info("AlarmsList - _onPressBackground");
        this._activeRow = null;
        this.setState(this.state);
    };

    render() {
        console.info("AlarmsList - Render");
        // console.debug(this.state);
        // let { alarms } = this.state;
        // console.log("alarms", alarms);

        // alarms.forEach(a => {
        //     console.log(a.id);
        // });

        // TODO: Uncomment this line to monitor for inactivity, and enable ProxMonitor if no activity for x seconds
        // this.resetTimer();

        // this.setState({ duplicatedAlarmId: null });
        let duplicationInfo = this._duplicationInfo;

        this._duplicationInfo = null;
        // console.log("this.state.alarms.length", this.state.alarms.length);
        return (
            <TouchableWithoutFeedback
                style={ListStyle.container}
                onPressIn={this._onPressBackground}
            >
                <View style={{ flex: 1 }}>
                    {/* <PushController /> */}
                    <DraggableFlatList
                        data={this.state.alarms}
                        renderItem={alarm => {
                            let { move, moveEnd, isActive } = alarm;
                            return (
                                <AlarmItem
                                    alarm={alarm.item}
                                    onPress={this._onPressItem}
                                    onDelete={this._onPressDelete.bind(
                                        this,
                                        alarm.item
                                    )}
                                    onDuplicate={this._onPressDuplicate.bind(
                                        this,
                                        alarm.item
                                    )}
                                    onToggle={this._onAlarmToggled}
                                    onSnap={this._onSnap.bind(this, alarm)}
                                    close={alarm.item.id !== this._activeRow}
                                    hide={
                                        duplicationInfo &&
                                        duplicationInfo.alarm.id ==
                                            alarm.item.id
                                    }
                                    startMove={move}
                                    endMove={moveEnd}
                                    isActive={isActive}
                                />
                            );
                        }}
                        keyExtractor={this._keyExtractor}
                        // extraData={this.state} // TODO: FIXME: May be able to fix flickering issue by being more careful about what extraData we pass in. THis may prevent unessesary re-renders of AlarmItems when they haven't changed
                        onMoveEnd={moveInfo => {
                            // console.log("moveInfo", moveInfo);
                            this._onReorderAlarms(
                                moveInfo.row.id,
                                moveInfo.from,
                                moveInfo.to,
                                moveInfo.data
                            );
                        }}
                    />
                    {duplicationInfo && (
                        <AlarmItem
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                shadowOpacity: 0.2,
                                shadowRadius: 10,
                                elevation: 3,
                                shadowColor: "black"
                                // borderWidth: 3,
                                // borderColor: "blue"
                            }}
                            alarm={duplicationInfo.alarm}
                            onPress={this._onPressItem}
                            onDelete={this._onPressDelete.bind(
                                this,
                                duplicationInfo.alarm
                            )}
                            onDuplicate={this._onPressDuplicate.bind(
                                this,
                                duplicationInfo.alarm
                            )}
                            onToggle={this._onAlarmToggled}
                            onSnap={this._onSnap.bind(
                                this,
                                duplicationInfo.alarm
                            )}
                            close={true}
                            animateConfig={{
                                enabled: true,
                                sourceRow: duplicationInfo.srcPosition,
                                alarmCount: this.state.alarms.length,
                                onComplete: this.setState.bind(this, this.state)
                            }}
                        />
                    )}
                    {/* <TouchableOpacity
                        style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            height: 100,
                            width: 100,
                            alignSelf: "flex-end",
                            backgroundColor: "red"
                        }}
                        onPress={() => {
                            if (this.state.alarms.length == 0) {
                                populateDummyAlarms();
                            } else {
                                realm.write(() => {
                                    realm.delete(this.state.alarms);
                                });
                            }
                            this.setState(this.state);
                        }}
                    /> */}
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

export default Alarms;
