/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    TouchableWithoutFeedback,
    Dimensions,
    LayoutAnimation,
    Platform,
    DeviceEventEmitter,
    AppState,
    NativeModules,
    InteractionManager,
    PanResponder,
    ActivityIndicator,
    StyleSheet,
    View,
    Alert,
    Text,
    TouchableOpacity,
    Button,
    AsyncStorage,
    Modal,
    Animated
} from "react-native";
import moment from "moment";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView, NavigationEvents } from "react-navigation";
import Permissions from "react-native-permissions";

import PushNotificationAndroid from "react-native-push-notification";
import {
    ALARM_CAT,
    scheduleAlarm,
    clearAlarm,
    snoozeAlarm,
    setInAppAlarm,
    resumeAlarm,
    checkForImplicitSnooze,
    cancelAllNotifications
} from "../services/PushController";
import NotificationsIOS from "react-native-notifications";
import realm from "../data/DataSchemas";
import DraggableFlatList from "react-native-draggable-flatlist";
import {
    AdMobBanner,
    // AdMobInterstitial,
    PublisherBanner
    // AdMobRewarded
} from "react-native-admob";
import SplashScreen from "react-native-splash-screen";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MatComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import FAIcon from "react-native-vector-icons/FontAwesome";
import * as Animatable from "react-native-animatable";

import ClkAlert from "../components/clk-awesome-alert";
import Upgrades from "../config/upgrades";
import Colors from "../styles/colors";
import { ListStyle } from "../styles/list";
import AlarmItem from "../components/alarm-item";
import RNSound from "react-native-sound";
import * as DateUtils from "../util/date_utils";
import { AlarmModel, AlarmTaskModel } from "../data/models";
import { scaleByFactor } from "../util/font-scale";
const { UIManager } = NativeModules;
import { AdWrapper } from "../services/AdmobService";

import { ALARM_STATES } from "../data/constants";
import Settings from "../config/settings";
import { ifIphoneX } from "react-native-iphone-x-helper";

/* Dev only */
// import { populateDummyAlarms } from "../data/data-prepop";

var loadedSound = null;

const CHARGE_REMINDER_HEIGHT = 90;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
class Alarms extends Component {
    width = SCREEN_WIDTH; //full width
    height = SCREEN_HEIGHT; //full height

    _didFocusListener = null;
    _duplicationInfo = null;

    _activeRow = null;

    _idleTimer = null;
    // proxMgrEnabled = false;
    isCurrentScreen = true;
    _recPermission = false;

    constructor() {
        super();
        console.log("AlarmsList -- Constructor");
        console.log("(App was opened from KILLED state)");

        //console.log("Fetching Alarms...");
        this.state = {
            alarms: realm.objects("Alarm").sorted("order"), //
            menuVisible: false,
            appState: AppState.currentState,
            isLoading: false,
            showChargePopup: false,
            showUpgradePopup: false,
            hasProVersion: Upgrades.pro == true,
            forceProAdv: false
        };

        console.log("showChargePopup", this.state.showChargePopup);

        if (Platform.OS === "android") {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }

        try {
            AsyncStorage.getItem("notFirstLaunch").then(value => {
                // this.props.navigation.navigate("Help"); // DEV: Remove
                // setTimeout(() => SplashScreen.hide(), 1000); // DEV: Remove

                if (value === null) {
                    console.log("First Launch");
                    this.props.navigation.navigate("Help", {
                        willExitHelp: () =>
                            NotificationsIOS.requestPermissions([ALARM_CAT])
                    });
                    setTimeout(() => SplashScreen.hide(), 1000);
                } else {
                    setTimeout(() => SplashScreen.hide(), 500);
                    NotificationsIOS.requestPermissions([ALARM_CAT]);

                    // load Permissions
                    Permissions.check("microphone").then(response => {
                        console.log("response", response);
                        this._recPermission = response == "authorized";
                    });
                }
            });
        } catch (error) {
            console.error(
                `Unable to check if app has already been launched: ${error}`
            );
        }

        // this._idlePanResponder = PanResponder.create({
        //     // Ask to be the responder:
        //     onStartShouldSetPanResponderCapture: () => {
        //         console.log("onStartShouldSetPanResponderCapture (AlarmsList)");
        //         // this.handleActivity();
        //         return false;
        //     }
        // });

        this.verifyAlarmStates();
    }

    // handleActivity() {
    //     console.log("this.proxMgrEnabled ", this.proxMgrEnabled);

    //     if (this.proxMgrEnabled == true) {
    //         this.disableProxManager();
    //     }

    //     if (this.isCurrentScreen == false) {
    //         if (this._idleTimer) clearTimeout(this._idleTimer);
    //         return;
    //     }

    //     clearTimeout(this._idleTimer);
    //     this._idleTimer = setTimeout(this.enableProxManager.bind(this), 5000);
    // }

    // enableProxManager() {
    //     this.proxMgrEnabled = true;
    //     ProximityManager.enable();
    // }

    // disableProxManager() {
    //     this.proxMgrEnabled = false;
    //     ProximityManager.disable();
    // }

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
        // NotificationsIOS.log(
        //     "Notification Received Background: " + JSON.stringify(notification)
        // );
        console.log("Got background notification");

        // this.playRingtone("super_ringtone.mp3");
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
            NotificationsIOS.consumeBackgroundQueue();
        } else {
            // PushNotificationAndroid.cancelAllLocalNotifications();

            // console.log(
            //     "notificationActionReceived listeners.length",
            //     DeviceEventEmitter.listeners("notificationActionReceived").length
            // );
            // DeviceEventEmitter.addListener("remoteNotificationReceived", e => {
            //     console.log("Notification event: ", e);
            // });
            DeviceEventEmitter.removeAllSubscriptions(
                "notificationActionReceived"
            );
            PushNotificationAndroid.unregister();
            // console.log(
            //     "notificationActionReceived listeners.length",
            //     DeviceEventEmitter.listeners("notificationActionReceived").length
            // );
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

            // console.log(
            //     "notificationActionReceived listeners.length",
            //     DeviceEventEmitter.listeners("notificationActionReceived").length
            // );
        }

        // this._didBlurListener = this.props.navigation.addListener(
        //     "didBlur",
        //     payload => {
        //         this.isCurrentScreen = false;
        //         clearTimeout(this._idleTimer);
        //         this.disableProxManager();
        //     }
        // );

        this._didFocusListener = this.props.navigation.addListener(
            "didFocus",
            payload => {
                if (!this.state.hasProVersion && Upgrades.pro == true) {
                    this.forceUpdate();
                } else {
                    // Its possible that network was down but now were connected, so we should
                    //  try to fetch another ad on navigation back to this screen.
                    this.setState({ forceProAdv: false });
                }
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
        } else {
            DeviceEventEmitter.removeAllSubscriptions(
                "notificationActionReceived"
            );
        }
        // this.props.navigation.removeListener("didBlur");

        this.props.navigation.removeListener("didFocus");

        AppState.removeEventListener("change", this._handleAppStateChange);
    }

    _handleAppStateChange = nextAppState => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            console.log("App has come to the foreground! (ALARMS LIST)");
            this.verifyAlarmStates();
            this.reloadAlarms();
        } else if (nextAppState === "background") {
            console.log("App is going into background");

            // let alarms = realm
            //     .objects("Alarm")
            //     .filtered("status == $0", ALARM_STATES.SET);
            // for (let i = 0; i < alarms.length; i++) {
            //     cancelInAppAlarm(alarms[i]);
            // }
        }

        this.setState({ appState: nextAppState });
    };

    /**
     * Called when App first starts up, and when it enters the foreground, to verify that any SET alarms are properly enabled, and
     * that snoozeCount tracking is in sync.
     */
    verifyAlarmStates() {
        // Implicit Snoozing and In-App Timers: Check if we need to manually switch any Alarms into 'snooze'. (ie: snooze Count)arent to user)
        let mNow = moment();

        let alarms = realm
            .objects("Alarm")
            .filtered(
                "status == $0 OR status == $1 OR status == $2",
                ALARM_STATES.SET,
                ALARM_STATES.RINGING,
                ALARM_STATES.SNOOZED
            );

        for (let i = 0; i < alarms.length; i++) {
            if (moment(alarms[i].wakeUpTime) > mNow) {
                console.log("This alarm has NOT yet triggered... resuming.");

                // alarm is in the future. Set in app alarm. (On Android, the inAppAlarm is a transparent timer)
                // setInAppAlarm(alarms[i], this.reloadAlarms.bind(this)); // NOTE: (on Android this may still be necessary, so I'm leaving it commented out)

                // If app was terminated, or if Audio was interupted, we need to re-enable native Alarm service (iOS only), and reschedule in-app notification.
                resumeAlarm(
                    alarms[i],
                    this.reloadAlarms.bind(this),
                    this.alarmDidInitialize.bind(
                        this,
                        alarms[i],
                        alarms[i].status
                    )
                );
            } else {
                // the alarm has already triggered
                console.log(
                    "This alarm has already triggered. Checking for implicit snooze etc."
                );

                // If snoozeCount is null set it to 1. Otherwise, calculate what it should be, and set it accordingly.
                checkForImplicitSnooze(alarms[i], mNow);
                // setInAppAlarm(alarms[i], this.reloadAlarms.bind(this));

                // Its possible that the app was terminated, or audio was interupted.
                //     If this is the case, we need to resume Native module functionality without scheduling a timer for wakeUpTime (since it has already passed).
                //     Instead the native module will need to set the timer for the next snoozeInterval. I guess it should check if wakeUpTime has passed, and if so,
                //     check the snoozeCount value, and snoozeTime value, and calculate when to set the snooze timer for. Hopefully, instead of calling
                //     setInAppAlarm after checkForImplicitSnooze, I can just call resumeAlarm.

                resumeAlarm(
                    alarms[i],
                    this.reloadAlarms.bind(this),
                    this.alarmDidInitialize.bind(
                        this,
                        alarms[i],
                        alarms[i].status
                    )
                );
            }
        }

        if (alarms.length == 0) {
            // Make sure there are no notifications scheduled, since no Alarms are enabled or snoozed.
            console.log("Cancelling notifications (from verifyAlarmStates)");
            cancelAllNotifications();
        }
    }

    handleAddAlarm() {
        console.info("Adding alarm");
        if (Upgrades.pro != true) {
            console.info("FREE version");
            if (this.state.alarms.length >= 2) {
                console.info("Alarm count: ", this.state.alarms.length);
                this.setState({ showUpgradePopup: "long" });
                return;
            }
        }
        // check if any Alarm is set and pass this info in as a flag to AlarmDetail
        let { alarms } = this.state;
        let activeAlarms = alarms.filtered("status > 0");

        let otherAlarmIsOn = false;
        if (activeAlarms.length > 0) {
            otherAlarmIsOn = true;
        }

        //NOTE: 1A. IAP-locked Feature - Alarms Limit
        this.props.navigation.navigate("AlarmDetail", {
            newAlarm: true,
            updateOrSetAlarm: this.updateOrSetAlarm,
            otherAlarmOn: otherAlarmIsOn,
            willNavBackToAlarms: this.willNavigateBack
        });
    }

    willNavigateBack = () => {
        this.setState({ isLoading: true });
    };

    /* We only allow 1 alarm to be active (SET) at a time. This function checks if there is
        already an active alarm. If not, returns true. If there is an alarm already active,
        it returns false, but more importantly, it displays an Alert. The Alert asks user whether
        to de-activate other alarm(s) so that this one can be activated, or to leave this alarm
        inactive, and the active Alarm in active state. If user chooses to activate this alarm, 
        the onAllowed callback will be executed. If they choose to not activate this alarm,
        the onDisallowed callback will be executed.
    */
    verifyAlarmActivationAllowed(onAllowed, onDisallowed) {
        let activeAlms = this.state.alarms.filtered("status > 0");
        let setAlmCount = activeAlms.length;

        if (setAlmCount > 0) {
            Alert.alert(
                "Enable this alarm?",
                "Your active alarm will be disabled if you enable this one.",
                [
                    {
                        text: "Enable",
                        onPress: () => {
                            // Disable active alarm(s)
                            for (let i = 0; i < setAlmCount; i++) {
                                this._onAlarmToggled(activeAlms[i]);
                            }

                            onAllowed && onAllowed();
                        }
                    },
                    {
                        text: "Don't enable",
                        style: "cancel"
                    }
                ],
                { cancelable: false }
            );
            return false;
        } else {
            return true;
        }
    }

    updateOrSetAlarm = (alarmId, nextStatus) => {
        console.info(
            "AlarmsList - reloading alarms list. Specific alarm to schedule: " +
                alarmId
        );

        if (alarmId) {
            let changedAlarms = this.state.alarms.filtered("id = $0", alarmId);

            if (changedAlarms.length == 1) {
                let changedAlarm = changedAlarms[0];
                // console.log("changedAlarm", changedAlarm);
                // console.log("wakeUpTime", changedAlarm.wakeUpTime);
                // console.log("status", changedAlarm.status);

                // Only schedule an Alarm if the changed Alarm status is SET. If it is not SET, then
                // another alarm is SET, and we don't want to schedule another.
                if (nextStatus == ALARM_STATES.SET) {
                    /* Now schedule notification(s) for the changes */
                    // passing in reloadAlarms function for iOS in-app alarm to be able to refresh AlarmsList screen
                    // setTimeout(() => {
                    //     // NOTE: I'm using a setTimeout here because runAfterInteractions doesn't seem to wait for the
                    //     //          back navigation animation to finish, for some reason.

                    // NOTE: Revision. Actually it seems that setTimeout isn't required. I'm not seeing a stutter (maybe a fix elsewhere helped)
                    scheduleAlarm(
                        changedAlarm,
                        this.reloadAlarms.bind(this),
                        this.alarmDidInitialize.bind(
                            this,
                            changedAlarm,
                            nextStatus
                        )
                    );
                    // }, 1000);
                } else {
                    this.reloadAlarms();
                }
            } else if (changedAlarms.length > 1) {
                console.error(
                    `Found more than 1 alarm with alarmId ${alarmId}. This should never happen...`
                );
            }
        } else {
            console.warn("Unable to find alarm to update/set.");
            this.setState({ isLoading: false });
        }
    };

    reloadAlarms = () => {
        // console.log("this: ", this.constructor.name); /* This is how you check a class's name (here i'm checking 'this') */
        // console.debug(this.state);
        // console.debug("Called set state from reloadAlarms");
        // console.debug(this.state);

        console.log("Reloading alarms...");
        let alarms = realm.objects("Alarm").sorted("order");
        // console.log("Alarms after reload: ", alarms);
        // general reload. No specific alarm ID is known to have changed.
        this.setState({
            alarms: realm.objects("Alarm").sorted("order"),
            isLoading: false
        });
    };

    _showChargeReminder = () => {
        if (this.chargeNotifRef) {
            this.chargeNotifRef.transitionTo({
                transform: [
                    {
                        // translate extra depending on what type of ad is showing, or 0 if no ad.
                        translateY: -CHARGE_REMINDER_HEIGHT - ifIphoneX(34, 5)
                    }
                ]
            });

            setTimeout(this._hideChargeReminder, 4000);
        }
    };

    _hideChargeReminder = () => {
        if (this.chargeNotifRef) {
            this.chargeNotifRef.transitionTo({
                transform: [
                    {
                        // translate extra depending on what type of ad is showing, or 0 if no ad.
                        translateY: 0
                    }
                ]
            });
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

        // check if any Alarm is set (excluding this one), and pass this info in as a flag to AlarmDetail
        let { alarms } = this.state;
        let setAlarms = alarms.filtered("status > 0");

        let otherAlarmOn = false;
        if (setAlarms.length > 0) {
            if (setAlarms[0].id != alarmItem.id) {
                otherAlarmOn = true;
            }
        }

        if (this._activeRow == null) {
            this.props.navigation.navigate("AlarmDetail", {
                alarm: alarmItem,
                updateOrSetAlarm: this.updateOrSetAlarm,
                otherAlarmOn: otherAlarmOn,
                willNavBackToAlarms: this.willNavigateBack
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

        if (Upgrades.pro != true) {
            console.info("FREE version");
            if (this.state.alarms.length >= 2) {
                console.info("Alarm count: ", this.state.alarms.length);
                this._activeRow = null;
                this.setState({ showUpgradePopup: "long" });
                return;
            }
        }

        let newAlarm = new AlarmModel(this.state.alarms.length);
        newAlarm.wakeUpTime = item.wakeUpTime;
        newAlarm.arrivalTime = item.arrivalTime;
        newAlarm.mode = item.mode;
        newAlarm.showHrsOfSleep = item.showHrsOfSleep;
        newAlarm.tasks = []; // needs careful attention for copying due to nested objects...

        for (let i = 0; i < item.tasks.length; i++) {
            let almTask = new AlarmTaskModel(
                item.tasks[i].task,
                item.tasks[i].order,
                item.tasks[i].enabled
            );
            almTask.duration = item.tasks[i].duration;

            newAlarm.tasks.push(almTask);
        }

        newAlarm.label = item.label;
        newAlarm.status = ALARM_STATES.OFF;
        newAlarm.visible = item.visible;
        newAlarm.preset = item.preset;
        newAlarm.alarmSound = item.alarmSound;
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
        // console.info("AlarmsList - alarm toggled: ");

        if (!alarm) {
            return;
        }

        let nextAlarmStatus =
            alarm.status > ALARM_STATES.OFF
                ? ALARM_STATES.OFF
                : ALARM_STATES.SET;

        // console.log(alarm);

        // console.log(wakeUpTime);
        console.log("WakeUpTime: " + alarm.wakeUpTime);
        if (nextAlarmStatus == ALARM_STATES.SET) {
            let { alarms } = this.state;

            if (
                !this.verifyAlarmActivationAllowed(
                    this._onAlarmToggled.bind(this, alarm)
                )
            ) {
                return;
            }

            this.setState({ isLoading: true });

            let wakeUpTime = DateUtils.date_to_nextTimeInstance(
                alarm.wakeUpTime
            );

            /* *** DEBUGGING *** */
            // set alarm to next whole minute
            // DEV:
            // if (__DEV__) {
            //     // let inOneMin = moment().add(1, "minutes");
            //     // wakeUpTime = inOneMin.second(0).toDate();

            //     let inTenSec = moment().add(10, "seconds");
            //     wakeUpTime = inTenSec.toDate();
            // }
            /* ***************** */

            realm.write(() => {
                alarm.wakeUpTime = wakeUpTime;
            });
            console.log("Setting alarm");
            setTimeout(() => {
                scheduleAlarm(
                    alarm,
                    this.reloadAlarms.bind(this),
                    this.alarmDidInitialize.bind(this, alarm, nextAlarmStatus)
                );
            }, 100);
        } else {
            // Cancel all notification(s) for this alarm
            //  - NOTE: For iOS there are multiple notifications for each Alarm (due to snoozes)
            //          However, on Android the 'repeat' feature works, so there is only one notification
            clearAlarm(alarm);
            this.setState(this.state);
        }

        //console.log("this.state", this.state);
    };

    alarmDidInitialize(alarm, nextAlarmStatus, error) {
        console.log("alarmDidInitialize. ? error:", error);
        console.log("alarm", alarm);
        console.log("NextStatus: ", nextAlarmStatus);
        if (!error) {
            this._recPermission = true;
        } else if (error == "NoRecPermission") {
            this._recPermission = false;
        }

        realm.write(() => {
            alarm.status = nextAlarmStatus;
            this.setState({ isLoading: false });
        });
    }

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

        // let orderArr = alarms.map(alm => alm.order);

        // for (let i = 0; i < orderArr.length; i++) {
        //     let idx = orderArr.indexOf(i);
        //     if (idx == -1) {
        //         alert("Failure!");
        //     }
        // }
        this.setState({ alarms: alarms });
    }

    _onPressBackground = () => {
        console.info("AlarmsList - _onPressBackground");

        if (this._activeRow != null) {
            this._activeRow = null;
            this.setState(this.state);
        }
    };

    onAnimFinished = () => {
        console.log("onAnimFinished");

        if (Settings.chargeReminder() == true && this._recPermission) {
            this._showChargeReminder();
        }
    };

    _bannerError = e => {
        console.log("_bannerError");
        console.log(e);
        this.setState({ forceProAdv: true });
    };

    render() {
        console.info("AlarmsList - Render");
        // console.debug(this.state);
        // let { alarms } = this.state;
        // console.log("alarms", alarms);
        console.log("this._recPermission", this._recPermission);
        // alarms.forEach(a => {
        //     console.log(a.id);
        // });

        // this.setState({ duplicatedAlarmId: null });
        let duplicationInfo = this._duplicationInfo;

        this._duplicationInfo = null;
        // console.log("this.state.alarms.length", this.state.alarms.length);
        return (
            <TouchableWithoutFeedback
                style={ListStyle.container}
                onPressIn={this._onPressBackground}
            >
                <LinearGradient
                    style={{ flex: 1 }}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 1.5, y: 1 }}
                    colors={[Colors.brandMidGrey, Colors.brandDarkGrey]}
                    // {...this._idlePanResponder.panHandlers}
                >
                    <SafeAreaView
                        forceInset={{
                            top: "never",
                            horizontal: "never",
                            bottom: "always"
                        }}
                        style={[
                            ListStyle.container,
                            { backgroundColor: "transparent" }
                        ]}
                    >
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
                                        onToggle={() => {
                                            requestAnimationFrame(() => {
                                                this._onAlarmToggled(
                                                    alarm.item
                                                );
                                            });
                                        }}
                                        onSnap={this._onSnap.bind(this, alarm)}
                                        close={
                                            alarm.item.id !== this._activeRow
                                        }
                                        hide={
                                            duplicationInfo &&
                                            duplicationInfo.alarm.id ==
                                                alarm.item.id
                                        }
                                        startMove={move}
                                        endMove={moveEnd}
                                        isActive={isActive}
                                        onAnimFinished={this.onAnimFinished}
                                        recPermission={this._recPermission}
                                    />
                                );
                            }}
                            keyExtractor={this._keyExtractor}
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
                                    onComplete: this.setState.bind(
                                        this,
                                        this.state
                                    )
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
                        {Upgrades.pro != true && (
                            <AdWrapper
                                // borderPosition="top"
                                animate={true}
                                // borderColor={Colors.brandDarkGrey}
                                screen={"Alarms"}
                                style={{
                                    borderWidth: 0
                                }}
                                proAdvStyle={{
                                    height: 100,
                                    width: this.width
                                }}
                                forcePro={this.state.forceProAdv}
                                navigation={this.props.navigation}
                                pubBannerProps={{
                                    adSize: "smartBannerPortrait",
                                    // adUnitID: "ca-app-pub-3940256099942544/6300978111",
                                    adUnitID:
                                        "ca-app-pub-5775007461562122/3906075015",
                                    testDevices: [AdMobBanner.simulatorId],
                                    onAdFailedToLoad: this._bannerError,
                                    validAdSizes: ["banner", "largeBanner"],
                                    onAdLoaded: () => {
                                        console.log("adLoaded");
                                    },
                                    style: {
                                        alignSelf: "center",
                                        height: 50,
                                        width: this.width
                                    }
                                }}
                                onPressProAdv={() =>
                                    this.setState({
                                        showUpgradePopup: "short"
                                    })
                                }
                            />
                        )}
                    </SafeAreaView>
                    {this.state.isLoading && (
                        <View style={styles.actIndWrapper}>
                            <ActivityIndicator
                                size="large"
                                style={styles.activityIndicator}
                            />
                        </View>
                    )}
                    {this.state.showChargePopup && this._recPermission && (
                        <ClkAlert
                            flexibleHeader={true}
                            contHeight={"large"}
                            title="Please Plug in Your Device"
                            headerContent={
                                <View style={{ marginLeft: 12 }}>
                                    {Platform.OS == "ios" ? (
                                        <MatComIcon
                                            name="cellphone-iphone"
                                            size={scaleByFactor(100)}
                                            color={Colors.backgroundLightGrey}
                                        />
                                    ) : (
                                        <MatComIcon
                                            name="cellphone-android"
                                            size={100}
                                            color={Colors.backgroundLightGrey}
                                        />
                                    )}
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            marginLeft: 65
                                        }}
                                    >
                                        <View
                                            style={{
                                                // backgroundColor: "blue",
                                                transform: [
                                                    {
                                                        rotateX: "180deg"
                                                    }
                                                ],
                                                alignSelf: "flex-start"
                                            }}
                                        >
                                            <EntypoIcon
                                                name="power-plug"
                                                size={35}
                                                color={
                                                    Colors.backgroundLightGrey
                                                }
                                            />
                                        </View>
                                        <View
                                            style={{
                                                // backgroundColor: "blue",
                                                transform: [
                                                    {
                                                        rotateY: "40deg"
                                                    },
                                                    {
                                                        skewY: "40deg"
                                                    }
                                                ],
                                                marginTop: 5,
                                                alignSelf: "flex-start"
                                            }}
                                        >
                                            <MatComIcon
                                                name="power-socket-us"
                                                size={35}
                                                color={
                                                    Colors.backgroundLightGrey
                                                }
                                            />
                                        </View>
                                    </View>
                                </View>
                            }
                            dismissConfig={{
                                onPress: () => {
                                    console.log("Dismissed Plugin popup");
                                    this.setState({
                                        showChargePopup: false
                                    });
                                },
                                text: "Dismiss"
                            }}
                            confirmConfig={{
                                onPress: () => {
                                    console.log("Confirmed Plugin popup");
                                    this.setState({
                                        showChargePopup: false
                                    });
                                    Settings.chargeReminder(false);
                                },
                                text: "Don't Show Again"
                            }}
                        />
                    )}
                    <Animatable.View
                        contentInsetAdjustmentBehavior="automatic"
                        useNativeDriver={true}
                        ref={elm => (this.chargeNotifRef = elm)}
                        style={[styles.chargeNotifCont]}
                    >
                        <TouchableWithoutFeedback
                            style={{ flex: 1 }}
                            onPress={() => {
                                console.log("on press touchable");
                                this._hideChargeReminder();
                                this.setState({ showChargePopup: true });
                            }}
                        >
                            <View style={[styles.chargeNotifTouchableWrap]}>
                                <EntypoIcon
                                    name="power-plug"
                                    size={36}
                                    style={{
                                        flex: 0.18,
                                        textAlign: "center"
                                    }}
                                    color={Colors.brandDarkPurple}
                                    // color={Colors.brandMidOpp}
                                />
                                <View style={{ flex: 0.82 }}>
                                    <Text style={styles.chargeNotifHeaderText}>
                                        REMINDER
                                    </Text>
                                    <Text style={styles.chargeNotifBodyText}>
                                        Please plug in your device
                                    </Text>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </Animatable.View>
                    {this.state.showUpgradePopup && (
                        <ClkAlert
                            contHeight={"mid"}
                            headerIcon={
                                <FAIcon
                                    name="magic"
                                    size={33}
                                    color={Colors.brandLightPurple}
                                />
                            }
                            title="Interested in Going Pro?"
                            headerTextStyle={{
                                color: Colors.brandLightOpp
                            }}
                            bodyText={
                                (this.state.showUpgradePopup == "long"
                                    ? "You are using the free version of Clockulate, which is limited to two alarms. "
                                    : "") +
                                "Upgrade to Clockulate Pro for Unlimited Alarms!\n\n" +
                                "Would you like to learn more?"
                            }
                            dismissConfig={{
                                onPress: () => {
                                    console.log("Dismissed Upgrade popup");
                                    this.setState({
                                        showUpgradePopup: false
                                    });
                                },
                                text: "Dismiss"
                            }}
                            confirmConfig={{
                                onPress: () => {
                                    console.log(
                                        "Confirmed Upgrade popup: Going to Upgrades screen"
                                    );
                                    this.setState({
                                        showUpgradePopup: false
                                    });
                                    this.props.navigation.navigate("Upgrade");
                                },
                                text: "Go to Upgrades"
                            }}
                        />
                    )}
                    {/* <Button
                            title={"Cancel All Notis"}
                            style={{
                                position: "absolute",
                                bottom: 100,
                                left: 30,
                                height: 60,
                                width: 120
                            }}
                            onPress={() => {
                                NotificationsIOS.cancelAllLocalNotifications();
                            }}
                        /> */}
                    <NavigationEvents
                        onWillFocus={payload => {
                            console.log("Alarms: onWillFocus");
                            // load Permissions
                            Permissions.check("microphone").then(response => {
                                console.log("response", response);
                                this._recPermission = response == "authorized";
                            });
                        }}
                    />
                </LinearGradient>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
    actIndWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        opacity: 0.5
    },
    activityIndicator: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        height: 80
    },
    chargeNotifCont: {
        position: "absolute",
        // bottom: ifIphoneX(34, 0), // DEV: For easy visibility
        bottom: -CHARGE_REMINDER_HEIGHT,
        borderRadius: 15,
        justifyContent: "center",
        alignSelf: "center",
        backgroundColor: Colors.brandSuperLightPurple,
        height: CHARGE_REMINDER_HEIGHT,
        width: SCREEN_WIDTH - 10
    },
    chargeNotifTouchableWrap: {
        flex: 1,
        fontFamily: "Gurmukhi MN",
        flexDirection: "row",
        alignItems: "center"
        // backgroundColor: Colors.brandMidOpp
    },
    chargeNotifHeaderText: {
        color: Colors.darkGreyText,
        marginBottom: 7,
        // fontFamily: "Gurmukhi MN",
        fontWeight: "700",
        fontSize: 16
    },
    chargeNotifBodyText: {
        color: Colors.darkGreyText,
        // fontFamily: "Gurmukhi MN",
        fontSize: 15
    }
});

export default Alarms;
