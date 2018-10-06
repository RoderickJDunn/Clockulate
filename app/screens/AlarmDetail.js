/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    Animated,
    Keyboard,
    TextInput,
    ScrollView,
    Platform,
    LayoutAnimation,
    Alert,
    Easing,
    TouchableWithoutFeedback
} from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import { Header, Transitioner } from "react-navigation";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import FAIcon from "react-native-vector-icons/FontAwesome";
import MenuItem from "../components/menu-item";
import MenuHeader from "../components/menu-header";
import StyledRadio from "../components/styled-radio";
import { Icon } from "react-native-elements";

import Interactable from "react-native-interactable";
import DateTimePicker from "react-native-modal-datetime-picker";
// import KeyframesView from "react-native-facebook-keyframes";
import { isIphoneX } from "react-native-iphone-x-helper";
import LinearGradient from "react-native-linear-gradient";
import { PanGestureHandler, State } from "react-native-gesture-handler";

import moment from "moment";

import realm from "../data/DataSchemas";
import TaskList from "../components/task-list";
import LabeledInput from "../components/labeled-input";
import LabeledTimeInput from "../components/labeled-time-input";
import PickerActionSheet from "../components/picker-action-sheet";
import StartTimesList from "../components/starttimes-list";
import AnimatedView from "../components/animated-view";
import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { AlarmModel } from "../data/models";
import ArrowView from "../components/arrow-view-native";
import TouchableBackdrop from "../components/touchable-backdrop";
// TODO: Remove after we're done choosing fonts
import { fontPreview } from "../styles/text.js";
import { scale, scaleByFactor } from "../util/font-scale";
import * as DateUtils from "../util/date_utils";
import { ALARM_STATES } from "../data/constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

let _menuIconAnim = new Animated.Value(0);

let AnimMaterialIcon = Animated.createAnimatedComponent(MaterialIcon);
class AlarmDetail extends Component {
    static navigationOptions = ({ navigation }) => {
        let menuIsOpen = navigation.state.params.menuIsOpen;

        return {
            title: "Edit Alarm",
            // This is how you define a custom back button. Apart from styling, this also seems like the best way to
            //  perform any additional tasks before executing navigation.goBack(), otherwise, goBack() is called
            //  automatically when the back button is pushed
            headerLeft: menuIsOpen ? null : (
                <TouchableOpacity
                    onPress={() => {
                        navigation.state.params.handleBackBtn();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 0, right: 20 }}
                >
                    <Icon
                        name={"chevron-left"}
                        color={Colors.brandLightGrey}
                        underlayColor={Colors.brandDarkGrey}
                        size={33}
                    />
                </TouchableOpacity>
            ),
            headerRight: (
                <TouchableOpacity
                    onPress={() => {
                        navigation.state.params.setMenuState(!menuIsOpen);
                    }}
                    style={{
                        alignSelf: "flex-end",
                        paddingLeft: 20,
                        paddingRight: 10
                        // height: Header.HEIGHT - 20
                    }}
                >
                    <Animated.View
                        style={{
                            alignSelf: "center",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            transform: [
                                {
                                    rotate: _menuIconAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "-90deg"]
                                    })
                                }
                            ]
                        }}
                    >
                        <MaterialIcon
                            color={Colors.brandLightGrey}
                            name="more-vert"
                            size={25}
                        />
                    </Animated.View>
                </TouchableOpacity>
            )
        };
    };

    headerHeight = 0;

    _calculatedWakeUpTime;
    alarmLabelCache;

    width = SCREEN_WIDTH; //full width
    height = SCREEN_HEIGHT; //full height
    snapAuto = 0;
    snapNormal = SCREEN_HEIGHT;
    snapTaskList = -SCREEN_HEIGHT * 0.415;

    xtraKeyboardHeight = 0; // this is always 0, except on iPhone X it is 34
    _animKeyboardHeight = new Animated.Value(0);

    AnimatedAlarmLabel = Animated.createAnimatedComponent(TextInput);
    AnimatedHandle = Animated.createAnimatedComponent(MaterialIcon);

    _clockTransform = new Animated.Value(0);
    _modeTextOpacity;
    _modeTextScale;
    startTimesHandleAnim = new Animated.Value(0);

    _viewIdx = null;
    _lastView = null;

    _hoursOfSleep = 0;
    _taskStartTimes = null;
    // _taskListScrollPos = 0;

    static closeMenu = (isMenuOpen, navigation) => {
        let config = {
            duration: 150,
            update: {
                duration: 150,
                type: "easeInEaseOut"
                // springDamping: 0.5,
                // property: "scaleXY"
            }
        };
        let nextMenuIsOpen = !isMenuOpen;
        Animated.timing(_menuIconAnim, {
            toValue: nextMenuIsOpen ? 1 : 0,
            duration: 200,
            delay: nextMenuIsOpen ? 0 : 100,
            useNativeDriver: true
        }).start();
        //isMenuAnimating

        LayoutAnimation.configureNext(config, () => {
            navigation.setParams({
                isMenuAnimating: false,
                menuOpen: nextMenuIsOpen
            });
        });

        navigation.setParams({
            menuIsAnimating: nextMenuIsOpen == true ? 1 : 0
            // menuOpen: nextMenuIsOpen
        });
    };

    constructor(props) {
        super(props);
        console.log("AlarmDetail -- Constructor");

        // let av = ArrowView();
        // av.printHello();
        if (isIphoneX()) {
            this.xtraKeyboardHeight = 180;
        }

        const { params } = props.navigation.state; // same as: " const params = props.navigation.state.params "
        if (params.newAlarm) {
            console.log("This is a new alarm");
            let alarmsCount = realm.objects("Alarm").length;

            let defaultShowHrsOfSleep = realm
                .objects("Setting")
                .filtered("name = 'defaultShowHrsOfSleep'")[0];

            // console.log("defaultShowHrsOfSleep", defaultShowHrsOfSleep);
            // console.log("enabled: ", defaultShowHrsOfSleep.enabled);
            let newAlarmModel = new AlarmModel(alarmsCount);
            newAlarmModel.showHrsOfSleep = defaultShowHrsOfSleep.enabled;
            realm.write(() => {
                this.state = {
                    alarm: realm.create("Alarm", newAlarmModel),
                    isDatePickerVisible: false,
                    animationDuration: 3000,
                    activeTask: null, // holds the task ID of the task currently showing DELETE button. Otherwise null.
                    isEditingTasks: false, // indicates whether tasks are currently moveable.
                    isEditingLabel: false, // indicates whether Label is being edited. Need to move Input when keyboard shows.
                    keyboardHeight: null,
                    isSlidingTask: false,
                    taskListFullScreen: false,
                    hideDisabledTasks: false,
                    menuIsOpen: false,
                    showSnoozePicker: false,
                    durationsVisible: true
                };
                // this.state.alarm.mode = "normal"; // FIXME: this is to hack in normal mode for testing
            });
        } else {
            // console.log("We are editing an existing alarm: ", params);
            this.state = {
                alarm: params.alarm,
                isDatePickerVisible: false,
                animationDuration: 3000,
                activeTask: null,
                isEditingTasks: false,
                isEditingLabel: false,
                keyboardHeight: null,
                isSlidingTask: false,
                taskListFullScreen: false,
                hideDisabledTasks: false,
                menuIsOpen: false,
                showSnoozePicker: false,
                durationsVisible: true
            };
        }

        this._setAnimatedViewRef = this._setAnimatedViewRef.bind(this);

        this.alarmLabelCache = this.state.alarm.label;

        this._hoursOfSleep = this._calculateHoursOfSleep(
            this.state.alarm.wakeUpTime
        );

        this._taskStartTimes = this._calcStartTimes();

        this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");
        /* These may be used for Intro (Tutorial Mode), but removing for now */
        // TODO: Here we need to check whether user has global setting to "Never show mode indicator"
        // this._modeTextOpacity = new Animated.Value(1);
        // this._modeTextScale = new Animated.Value(0);

        // setTimeout(() => {
        //     this._animatedView.animate(this.state.animationDuration);
        // }, 0);
        this._viewIdx = this.state.alarm.mode == "autocalc" ? 1 : 0;

        // console.log(this.state);
        // console.log(params);
    }

    // componentDidMount() {
    // }

    componentWillMount() {
        // console.log("AlarmDetail: componentWillMount");
        this.addKeyboardListeners();
    }

    componentWillUnmount() {
        // console.debug("AlarmDetail: componentWillUnmount");
        this.removeKeyboardListeners();
    }

    addKeyboardListeners() {
        this.keyboardWillShowSub = Keyboard.addListener(
            Platform.OS == "ios" ? "keyboardWillShow" : "keyboardDidShow",
            this.keyboardWillShow.bind(this)
        );
        this.keyboardWillHideSub = Keyboard.addListener(
            Platform.OS == "ios" ? "keyboardWillHide" : "keyboardDidHide",
            this.keyboardWillHide.bind(this)
        );
    }

    removeKeyboardListeners() {
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    componentDidMount() {
        console.debug("AlarmDetail --- ComponentDidMount");
        console.log("this.state.alarm", this.state.alarm);
        this.props.navigation.setParams({
            handleBackBtn: this.handleBackPress.bind(this),
            menuOpen: false,
            setMenuState: this._setMenuState.bind(this),
            openSnoozeTimePicker: this._openSnoozeTimePicker.bind(this)
        });

        this._lastMeasuredView = "autocalc"; // set initial lastView to calcmode index

        if (this.state.alarm.mode == "normal") {
            /* IMPORTANT: I'm purposefully not setting initial lastMeasuredView to classic-mode index. 
                This flag doesn't care about normal mode. It is an indicator of which mode, FullTaskList or Autocalc
                was last measured.
             */
            setTimeout(() => {
                this._snapToIdx(0);
            }, 0);
        }

        // this.startTimesHandleAnim.addListener(({ value }) => {
        //     console.log(value);
        // });

        // this._playModeIndicatorAnimation();

        this.headerHeight = Header.HEIGHT;
    }

    _setMenuState(nextMenuState, nextState) {
        Animated.timing(_menuIconAnim, {
            toValue: nextMenuState ? 1 : 0,
            duration: 200,
            delay: nextMenuState ? 0 : 100,
            useNativeDriver: true
        }).start();

        if (nextState) {
            this.setState({ menuIsOpen: nextMenuState, ...nextState });
        } else {
            this.setState({ menuIsOpen: nextMenuState });
        }
        this.props.navigation.setParams({ menuIsOpen: nextMenuState });
    }

    _snapToIdx(idx) {
        console.log("_snapToIdx");
        // console.log("this.interactiveRef", this.interactiveRef);
        if (this.interactiveRef) {
            this.interactiveRef.snapTo({ index: idx });
            this._viewIdx = idx;
            realm.write(() => {
                let { alarm } = this.state;
                switch (idx) {
                    case 0:
                        alarm.mode = "normal";
                        break;
                    case 1:
                        alarm.mode = "autocalc";
                        this._layoutAnimateToCalcMode({
                            taskListFullScreen: false,
                            activeTask: null // closes any Row showing DELETE btn
                        });
                        break;
                    case 2: 
                        this._layoutAnimateToFullScreenTaskList({
                            taskListFullScreen: true,
                            activeTask: null // closes any Row showing DELETE btn
                        });
                        break;
                }
                // this.setState({ alarm: alarm });
            });
           
            // this.setState(this.state);
        }
    }

    /* This may be used for Intro (Tutorial Mode), but removing for now */
    // _playModeIndicatorAnimation() {
    //     this._modeTextOpacity.setValue(1);
    //     Animated.sequence([
    //         Animated.spring(this._modeTextScale, {
    //             toValue: 1,
    //             useNativeDriver: true
    //         }),
    //         Animated.timing(this._modeTextOpacity, {
    //             toValue: 0,
    //             duration: 2000,
    //             delay: 3000,
    //             useNativeDriver: true
    //         })
    //     ]).start(() => {
    //         this._modeTextScale.setValue(0);
    //         this._modeTextOpacity.setValue(0);
    //     });
    // }

    // _hideModeText() {
    //     this._modeTextScale.setValue(0);
    //     this._modeTextOpacity.setValue(0);
    // }

    _openSnoozeTimePicker() {
        this.setState({ showSnoozePicker: true });
    }

    _setAnimatedViewRef(ref) {
        this._animatedView = ref;
    }

    keyboardWillShow = event => {
        // console.log("keyboardWillShow -------");
        // console.log(event.endCoordinates);
        // console.log(SCREEN_HEIGHT);
        // this.setState({ keyboardHeight: event.endCoordinates.height });
        // if (this.state.alarm.mode == "normal") {
        //     setTimeout(() => {
        //         this.interactiveRef.snapTo({ index: 2 }); // snap to "keyboard" snapPoint.
        //     }, 0);
        // }
        Animated.timing(this._animKeyboardHeight, {
            duration: Platform.OS == "ios" ? event.duration : 100,
            toValue: event.endCoordinates.height,
            useNativeDriver: true
        }).start();
    };

    keyboardWillHide = event => {
        // console.log("keyboardWillHide");
        // let { mode } = this.state.alarm;
        // let modeInt = mode == "autocalc" ? 0 : 1;
        // setTimeout(() => {
        //     this.interactiveRef.snapTo({ index: modeInt });
        //     this.setState({ keyboardHeight: null, isEditingLabel: false });
        // }, 0);

        Animated.timing(this._animKeyboardHeight, {
            duration: Platform.OS == "ios" ? event.duration : 100,
            toValue: 0,
            useNativeDriver: true
        }).start();
    };

    /*
    NOTE: This method DOES get called when you push 'Back' do go back to parent screen. However, no lifecycle
          methods are called in the previous screen (not even Render()), so any work that you want to do in the
          parent screen on navigating back must be done by sending a callback fx upon initial navigation to this screen.
          The callback can be executed from 1) componentWillUnmount (in which case you might see the parent screen update
          after navigation back is complete), or 2) from a custom 'Back' function. This seems to work better, but
          requires you to define a custom back button in navigation options, then bind the onPress function of the
          back button to a function in the child screen (ie: this screen). See handleBackPress() -- I've done option 2.
     */
    // componentWillUnmount() {
    //     console.debug("AlarmDetail componentWillUnmount");
    // }

    handleBackPress() {
        // console.debug("Going back to Alarms List");
        // console.debug(this.state);

        // TODO: If activeTask != null, set it back to inactive (snap back to not showing Delete)

        realm.write(() => {
            // TODO: This should work, but it seems that due to a bug, the Tasks list gets unlinked from the parent Alarm object. It should be fixed soon
            // https://github.com/realm/realm-js/issues/1124
            //realm.create('Alarm', this.state, true);
            // TODO: end

            // For Now, use this workaround //
            let alarm = realm
                .objects("Alarm")
                .filtered(`id = "${this.state.alarm.id}"`);
            if (alarm && alarm.length === 1) {
                // if (AlarmModel.isDefault(alarm[0])) {
                //     // Since this alarm has default settings, delete it before nav'ing back. User hasn't changed anything.
                //     realm.delete(alarm);
                // } else
                alarm[0].label = this.state.alarm.label;
                alarm[0].arrivalTime = DateUtils.date_to_nextTimeInstance(
                    this.state.alarm.arrivalTime
                );
                alarm[0].status = ALARM_STATES.SET;
                alarm[0].alarmSound = this.state.alarm.alarmSound;
                if (
                    this.state.alarm.mode === "autocalc" &&
                    this._calculatedWakeUpTime
                ) {
                    alarm[0].wakeUpTime = DateUtils.date_to_nextTimeInstance(
                        this._calculatedWakeUpTime
                    );
                } else {
                    alarm[0].wakeUpTime = DateUtils.date_to_nextTimeInstance(
                        this.state.alarm.wakeUpTime
                    );
                }
            }
            //////////////////////////////////
        });
        // this.props.navigation.setParams({ shouldReload: true });

        this.props.navigation.state.params.reloadAlarms(this.state.alarm.id);
        this.props.navigation.goBack();
        // setTimeout(() => {
        //     this.props.navigation.goBack();
        // }, 500);
    }

    _willShowNavScreen() {
        this.addKeyboardListeners();
    }

    _willLeaveNavScreen() {
        this.removeKeyboardListeners();
    }

    _onPressAddTask() {
        if (this.state.activeTask == null) {
            let nextTaskPosition = this.state.alarm.tasks.length;
            // console.log("passing position of new task: ", nextTaskPosition);
            this._willLeaveNavScreen();
            this.props.navigation.navigate("TaskDetail", {
                onSaveState: this.onTaskListChanged.bind(this),
                willNavigateBack: this._willShowNavScreen.bind(this),
                order: nextTaskPosition
            });
        } else {
            // simply snap the active task back to resting position
            this.setState({ activeTask: null });
        }
    }

    onTaskListChanged(newTask) {
        console.info("Task modified");
        // console.log("Task modified", newTask);
        // Check if Task is defined. This callback expects the newly created alarmTask,
        // or nothing if an existing alarmTask was updated.
        let { alarm } = this.state;
        realm.write(() => {
            if (newTask) {
                // only add task to list if new task was created
                alarm.tasks.push(newTask);
            }
            // re-calculate wake-up time either way, since existing task duration may have been changed
            alarm.wakeUpTime = this._calcWakeUpTime();

            // calculate startTimes
            this._calcStartTimes();
        });
        let tempState = this.state;
        tempState.activeTask = null;
        this.setState(tempState);
    }

    /*
    Called by a 'bubble-up' type functionality, since a reference to this function was passed as a prop to 'TaskList',
    which in turn passes the fx reference to each 'TaskItem' in that list.
    IMPORTANT: It is vital to either use an arrow function here (which uses the outer-scope 'this'), or if it is a
        regular function, bind the fx to 'this' in the outer scope (the screen) so that it has access to this.props.navigation.
     */
    _onPressTask = task => {
        // console.debug("AlarmDetail: onPressTask -- task: ", task);

        if (this.state.activeTask == null) {
            // Need to use a workaround to delete the object, otherwise app will crash due to Realm bug when navigating after deleting passed Object:
            // Pass TaskAlarm ID instead of TaskAlarm object.
            this._willLeaveNavScreen();
            const params = {
                alarmTaskId: task.id,
                onSaveState: this.onTaskListChanged.bind(this),
                willNavigateBack: this._willShowNavScreen.bind(this)
            };

            this.props.navigation.navigate("TaskDetail", params);
        } else {
            // simply snap the active task back to resting position
            this.setState({ activeTask: null });
        }
    };

    /**** THIS IS A DEV FUNCTION THAT WILL BE DELETED BEFORE RELEASE ****/
    fontCount = 50;
    nextFont = fontPreview[0];
    _CHANGE_CLOCK_FONT() {
        // console.log("Changing font");
        // console.log(fontPreview);
        if (this.fontCount < 0 || this.fontCount > fontPreview.length)
            this.fontCount = 0;

        this.nextFont = fontPreview[this.fontCount];
        // console.log("this.nextFont ", this.nextFont);
        this.fontCount++;
        this.setState(this.state);
    }
    /***************************************************/

    onChangeLabel = text => {
        // console.log("Label text changed: ", text);
        // simply save to instance variable until the TextInput blurs.
        // This avoids excessive re-renders!!!!
        this.alarmLabelCache = text;

        /////  DO NOT WRITE TO DB OR UPDATE STATE YET !!! WAIT UNTIL BLUR EVENT ! ////
        /* We also need to handle saving the Label to DB if user presses BACK
            while still editing the Label TextInput field, since BLUR event may not fire.
        */

        // let tempAlarm = this.state.alarm;
        // realm.write(() => {
        //     tempAlarm.label = text;
        // });
        // this.setState({ alarm: tempAlarm });
    };

    onLabelInputBlur = e => {
        console.log("Label textInput blurred: " + this.alarmLabelCache);
        // using manually cached alarmLabel Text, since Android doesn't send 'Text' to onBlur...

        let tempAlarm = this.state.alarm;
        if (
            this.alarmLabelCache != null &&
            typeof this.alarmLabelCache != "undefined"
        ) {
            realm.write(() => {
                tempAlarm.label = this.alarmLabelCache;
            });
        }
        this.setState({ alarm: tempAlarm });
    };

    onLabelInputFocus = () => {
        console.info("Focusing label input");
        if (this.state.alarm.mode == "normal") {
            this.setState({ isEditingLabel: true });
        }
    };

    onChangeTaskEnabled = (taskToUpdate, enabled) => {
        // console.info("onChangeTaskEnabled");
        let { alarm } = this.state;
        // let tasks = alarm.tasks;
        let taskToChange = this._cachedSortedTasks.find(
            task => task.id === taskToUpdate.id
        );
        if (!taskToChange) {
            console.error(
                "Could not find task to update with new 'enabled' value. Searching for AlarmTask id: ",
                taskToChange.id
            );
            return;
        }
        realm.write(() => {
            taskToChange.enabled = !enabled;
            alarm.wakeUpTime = this._calcWakeUpTime();
            this._calcStartTimes();
        });
        this.setState(this.state);
        // this.onTaskListChanged();
    };

    /* Callback from TaskItem for when duration-slider has been released.
        Two main responsibilites
        1. Update the specified task in DB with the new duration value (set from slider)
        2. Re-enable dragging of the main Interactable-View, as well as the TaskList child
            - This is done by setting isSlidingTask==false
    */
    onChangeTaskDuration = (taskToUpdate, newDuration) => {
        console.info("onChangeTaskDuration");
        let { alarm } = this.state;
        let tasks = alarm.tasks;
        let taskToChange = tasks.find(task => task.id === taskToUpdate.id);
        if (!taskToChange) {
            console.error(
                "Could not find task to update with new 'enabled' value. Searching for AlarmTask id: ",
                taskToChange.id
            );
            return;
        }
        realm.write(() => {
            // console.log("newDuration", newDuration);
            taskToChange.duration = newDuration;
            alarm.wakeUpTime = this._calcWakeUpTime();
        });
        this.setState({ tasks: tasks, isSlidingTask: false });
        // this.onTaskListChanged();
    };

    onSnap = event => {
        console.info("onSnap");

        // let alarmState = this.state.alarm;
        let { id, index: snapIdx } = event.nativeEvent;

        // if (snapIdx == 2) {
        //     this._hideModeText();
        // }

        this._viewIdx = snapIdx;
        this.setState(this.state);
        // console.log("snapId", id);
        // // console.log("alarmState", alarmState);

        // console.log("this._lastMeasuredView", this._lastMeasuredView);
        // console.log("snapIdx", snapIdx);
        // // Set flag to remeasure list container if we've moved from fullListView to calcmode, or vice versa
        // if (
        //     (snapIdx == 0 && this._lastMeasuredView == 2) ||
        //     (snapIdx == 2 && this._lastMeasuredView == 0)
        // ) {
        //     console.log("Setting this._taskListNeedsRemeasure");
        //     this._taskListNeedsRemeasure = true;
        // }
        // if (snapIdx == 2) {
        //     this._lastMeasuredView = 2; // set lastView as the snap-index of full-screen TaskList
        //     this.setState({ taskListFullScreen: true });
        // } else if (id != alarmState.mode) {
        //     console.log("alarmState.mode", alarmState.mode);
        //     realm.write(() => {
        //         if (id == "normal") {
        //             /* IMPORTANT: I'm purposefully not saving normal mode to this._lastMeasuredView, since the purpose of this flag
        //                 is to check which of 'FullTaskList View' or 'Calcmode' has been measured last.
        //             */
        //             alarmState.mode = "normal";
        //         } else if (id == "autocalc") {
        //             alarmState.mode = "autocalc";
        //             this._lastMeasuredView = snapIdx;
        //             // Re-calculate
        //             alarmState.wakeUpTime = this._calcWakeUpTime();
        //         }
        //         this.setState({ alarm: alarmState, taskListFullScreen: false });
        //     });
        // } else {
        //     console.log("else... no change in view...");
        //     this.setState({ taskListFullScreen: false });
        // }
    };

    onPressClock = () => {
        console.info("onPressClock");
        Keyboard.dismiss();
        if (this.state.activeTask == null) {
            if (this.state.alarm.mode == "autocalc") {
                this._snapToIdx(0);
            }
            this._showDateTimePicker();
        } else {
            // simply snap the active task back to resting position
            this.setState({ activeTask: null });
        }
    };

    saveSound = sound => {
        // console.info("Sound changed: ", sound);
        // console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.alarmSound.sound = sound;
            alarm.alarmSound.type = sound.type; // for random sounds
        });
    };

    _onArrivalTimePicked = time => {
        console.info("Arrival Time input changed: ", time);
        // console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.arrivalTime = time;
            alarm.wakeUpTime = this._calcWakeUpTime();
        });
        this.setState({
            alarm: alarm
        });
    };

    _onWakeTimePicked = date => {
        console.info("A date has been picked: ", date);
        let { alarm } = this.state;

        let wakeUpDate = DateUtils.date_to_nextTimeInstance(date);

        realm.write(() => {
            alarm.wakeUpTime = wakeUpDate;
        });
        this._hideDateTimePicker();
    };

    _showDateTimePicker = () => this.setState({ isDatePickerVisible: true });

    _hideDateTimePicker = () => this.setState({ isDatePickerVisible: false });

    _calcWakeUpTime = () => {
        // console.log(
        //     "Calculating wakeuptime with arrival time: " +
        //         this.state.alarm.arrivalTime
        // );
        let totalTaskDurations = this.state.alarm.tasks
            .map(alarmTask => {
                // console.log("mapping: ");
                // console.log(alarmTask);
                if (alarmTask.enabled) {
                    // console.log("Task enabled");
                    return alarmTask.duration;
                } else {
                    // console.log("Task DISabled");
                    return 0;
                }
            })
            .reduce((a, b) => a + b, 0);
        totalTaskDurations *= 1000;
        // console.log(totalTaskDurations);

        // save calculated wakeUpTime to use for saving to DB when user presses back
        let epochSec = this.state.alarm.arrivalTime - totalTaskDurations;

        this._calculatedWakeUpTime = new Date(epochSec);

        this._hoursOfSleep = this._calculateHoursOfSleep(
            this._calculatedWakeUpTime
        );

        this._calcStartTimes();

        return this._calculatedWakeUpTime;
    };

    _calculateHoursOfSleep = wakeUpTime => {
        console.log("Calculating hours of sleep");

        wakeUpTime = DateUtils.date_to_nextTimeInstance(wakeUpTime);

        let now = new Date();

        let secUntilAlarm = (wakeUpTime - now) / 1000;

        let fmtTimeUntilAlarm;
        if (secUntilAlarm > 0) {
            fmtTimeUntilAlarm = DateUtils.formatDuration(secUntilAlarm, true);
        } else {
            fmtTimeUntilAlarm = "None";
        }

        return fmtTimeUntilAlarm;
    };

    _calcStartTimes = hideDisableTasks => {
        let additiveMoment = moment(this.state.alarm.wakeUpTime);
        if (hideDisableTasks == null || hideDisableTasks == undefined) {
            hideDisableTasks = this.state.hideDisabledTasks;
        }

        if (this._cachedSortedTasks == null) {
            this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");
        }

        if (realm.isInTransaction) {
            this._cachedSortedTasks.forEach(task => {
                if (task.enabled == false) {
                    task.startTime = null;
                } else if (task.enabled == true) {
                    task.startTime = additiveMoment.format("h:mm A");
                    additiveMoment.add(task.duration, "seconds");
                }
            });
        } else {
            realm.write(() => {
                this._cachedSortedTasks.forEach(task => {
                    if (task.enabled == false) {
                        task.startTime = null;
                    } else if (task.enabled == true) {
                        task.startTime = additiveMoment.format("h:mm A");
                        additiveMoment.add(task.duration, "seconds");
                    }
                });
            });
        }

        console.log("this.state.alarm", this.state.alarm);
        console.log("_cachedSortedTasks", this._cachedSortedTasks);
    };

    _onDeleteTask(data) {
        console.log("Deleting task");
        // console.log("data", data);
        // console.log("data.id", data.id);

        let alarmTaskRlmObject = realm.objectForPrimaryKey(
            "AlarmTask",
            data.id
        );
        if (alarmTaskRlmObject) {
            realm.write(() => {
                realm.delete(alarmTaskRlmObject);

                // Update order of task list
                let { tasks } = this.state.alarm;

                this._cachedSortedTasks = tasks.sorted("order");
                console.log("sortedTasks", this._cachedSortedTasks);
                // console.log("Deleted task. --> Now Tasks:", tasks);
                let idx = 0;
                for (var taskId in this._cachedSortedTasks) {
                    if (this._cachedSortedTasks.hasOwnProperty(taskId)) {
                        if (idx == this._cachedSortedTasks[taskId].order) {
                            // console.log(tasks[taskId]);
                            // console.log("-----> Order OK");
                        } else {
                            console.log(this._cachedSortedTasks[taskId]);
                            // console.log("-----> Order WRong. Decrementing...");
                            this._cachedSortedTasks[taskId].order--;
                        }
                    }
                    idx++;
                }
                tasks = this._cachedSortedTasks;
            });
        }
        this.onTaskListChanged();
    }

    _onSnapTask(item, index, rowState) {
        console.info("Snapping task");
        // console.log("1. ", item);
        // console.log("2. ", index);
        // console.log("3. ", rowState);
        if (rowState == "active") {
            this.setState({ activeTask: index });
        }
    }

    _onPressEditTasks() {
        console.info("_onPressEditTasks");
        let editingTasks = !this.state.isEditingTasks;
        this.setState({ isEditingTasks: editingTasks });
    }

    _closeTaskRows() {
        console.info("_closeTaskRows");
        this.setState({ activeTask: null });
    }

    _closeMenu() {
        console.info("_closeMenu");
        this.props.navigation.setParams({
            menuOpen: false
        });
    }

    /* Called when TaskItem longPress ends without TaskItem having been moved at all */
    _didEndMove() {
        this.setState({ disableDrag: false });
    }

    _onReorderTasks(allATasks, filterMap, aTaskId, from, to) {
        console.info("_onReorderTasks");
        // console.info("aTaskId", aTaskId);
        // console.info("from", from);
        // console.info("to", to);
        // console.log("anotherArg", anotherArg);

        // console.log("aTasks", aTasks);

        /* FilterMap is an array of the original orders of enabled aTasks. Each position in the array
            corresponds to the order value of the enabled aTask if disabled tasks are excluded. Each value of the array
            corresponds to the order value of the enabled aTask including any disabled ones. If hideDisabledTasks
            was false during the move, then filterMap will be null.

            First look up position 'from' in filterMap. This yields the original position of the moved
            item with respect to all tasks (including disabled ones). [ie. the original 'order' property for this AT]

            Then look up position 'to' in filterMap. This yields the final position of the moved item with 
            respect to all tasks (including disabled ones). [ie. the final 'order' property of this AT after the move]
        */
        if (filterMap) {
            from = filterMap[from];
            to = filterMap[to];
        }

        /* 'snapshot()' yields a copy that is not live-updated, which is necessary for the loop below
            which updates alarm task order values as it loops through the list. Since the list is
            sorted by order, changing order values on a live-updating list could cause the loop to skip 
            skip some items, while hitting others more than once.
        */
        let aTasksCopy = allATasks.snapshot();

        realm.write(() => {
            // aTasks[from].order = to;

            for (const key in aTasksCopy) {
                // console.log("key", key);
                if (aTasksCopy.hasOwnProperty(key)) {
                    const alarmTask = aTasksCopy[key];
                    console.log("order: ", alarmTask.order);

                    if (alarmTask.order == from) {
                        alarmTask.order = to;
                    } else {
                        if (
                            from < to &&
                            alarmTask.order <= to &&
                            alarmTask.order > from
                        ) {
                            alarmTask.order--;
                        } else if (
                            from > to &&
                            alarmTask.order >= to &&
                            alarmTask.order < from
                        ) {
                            alarmTask.order++;
                        }
                    }
                }
            }
        });

        this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");

        this._calcStartTimes();

        // this._cachedSortedTasks = this.state.alarm.tasks.;

        this.setState({ disableDrag: false });
    }

    _layoutAnimateToFullScreenTaskList(nextState = {}) {
        let config = {
            duration: 50,
            update: {
                duration: 50,
                type: "easeInEaseOut"
                // springDamping: 0.5,
                // property: "scaleXY"
            }
        };
        LayoutAnimation.configureNext(config);

        // This should be in TaskList full screen view

        console.log("Setting taskArea to LARGE");
        // first just set new height
        this.setState({
            fieldAreaFlex: 0.17,
            taskAreaFlex: 0.83,
            taskHeaderFlex: 0.06,
            taskListDimensions: {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 1.15 * 0.83 * 0.95, // TODO: Extract layout values into constants, the create variables for the value of these calculations
                pageX: 0,
                pageY: SCREEN_HEIGHT * 0.17 // TODO: Extract layout values into constants, the create variables for the value of these calculations
            },
            ...nextState
        });
    }

    _layoutAnimateToCalcMode(nextState) {
        let config = {
            duration: 50,
            update: {
                duration: 50,
                type: "easeInEaseOut"
            }
        };
        LayoutAnimation.configureNext(config);

        console.log("Setting taskArea to small");
        // This should be in calc mode
        this.setState({
            fieldAreaFlex: 0.17,
            taskAreaFlex: 0.4,
            taskHeaderFlex: 0.15,
            taskListDimensions: {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT * 1.15 * 0.4 * 0.95, // TODO: Extract layout values into constants, then create variables for the value of these calculations
                pageX: 0,
                pageY: SCREEN_HEIGHT * 0.58 // TODO: Extract layout values into constants, the create variables for the value of these calculations
            },
            ...nextState
        });
    }

    _onPressAnimHandle() {
        // console.log("_onPressAnimHandle");
        // console.log("this.state.alarm.mode ", this.state.alarm.mode);
        let nextIdx = this.state.alarm.mode == "normal" ? 1 : 0;
        // console.log("nextIdx", nextIdx);
        this._snapToIdx(nextIdx);
    }

    _onPressTasksHeader() {
        console.log("_onPressTasksHeader");
        this._taskListNeedsRemeasure = true;
        // this._hideModeText();
        if (this.state.taskListFullScreen == false) {
            console.log("1");
            this._lastMeasuredView = "tasklist";
            this._snapToIdx(2);
        } else {
            console.log("2");
            this._lastMeasuredView = "normal";
            this._snapToIdx(1);
        }
    }

    _onDragInteractable(event) {
        console.log("drag:", event.nativeEvent);
        Keyboard.dismiss();
        let { state, y, targetSnapPointId } = event.nativeEvent;
        if (state == "start" && y < 50 && y > -100) {
            console.log("y < 50");
            // animate height increase of TaskList
            // this._hideModeText();
            this._layoutAnimateToFullScreenTaskList({ activeTask: null });
        } else if (state == "end") {
            console.log("END OF DRAG ******************* ");

            let alarmState = this.state.alarm;
            // console.log("alarmState", alarmState);
            let nextState = {};
            console.log("this._lastMeasuredView", this._lastMeasuredView);
            console.log("targetSnapPointId", targetSnapPointId);

            let measuredViewHasChanged =
                targetSnapPointId != this._lastMeasuredView;

            if (targetSnapPointId == "tasklist") {
                this._lastMeasuredView = targetSnapPointId;
                this._viewIdx = 2;
                if (measuredViewHasChanged) {
                    // since lastView will never be set to "normal", we know that the last view measured was "autocalc". Therefore we need to remeasure
                    this._taskListNeedsRemeasure = true;

                    // since view has changed, we need to set new state
                    this.setState({
                        taskListFullScreen: true,
                        activeTask: null // closes any Row showing DELETE btn
                    });
                }
            } else {
                /* targetSnapPoint is either "normal" or "autocalc" */
                nextState = { taskListFullScreen: false, activeTask: null };

                // first check if the last measured view was "tasklist".
                if (this._lastMeasuredView == "tasklist") {
                    this._taskListNeedsRemeasure = true;
                }
                this._lastMeasuredView = "autocalc";
                this._viewIdx = targetSnapPointId == "autocalc" ? 1 : 0;
                let modeHasChanged = targetSnapPointId != alarmState.mode;
                console.log("alarmState.mode", alarmState.mode);

                if (modeHasChanged) {
                    // newMode = targetSnapPointId;
                    let newWakeUpTime;
                    if (targetSnapPointId == "autocalc") {
                        newWakeUpTime = this._calcWakeUpTime();
                        // alarmState.wakeUpTime = this._calcWakeUpTime();
                    } 
                    realm.write(() => {
                        let { alarm } = this.state;

                        alarm.mode = targetSnapPointId;
                        if (newWakeUpTime) {
                            alarm.wakeUpTime = newWakeUpTime;
                        }
                        Object.assign({ alarm: alarm }, nextState);
                    });

                    // this._playModeIndicatorAnimation();
                }

                this._layoutAnimateToCalcMode(nextState);
            }
        }
    }

    _saveSnoozeTime = value => {
        realm.write(() => {
            let { alarm } = this.state;

            alarm.snoozeTime = value;
        });
        this.setState({ showSnoozePicker: false });
    };

    _closeSnoozeTimePicker = () => {
        this.setState({ showSnoozePicker: false });
    };

    // onScrollTaskList = nativeEvent => {
    //     console.log("scroll event", nativeEvent);
    //     console.log("this", this.constructor.name);
    //     this._taskListScrollPos = nativeEvent.contentOffset.y;
    //     console.log("this._taskListScrollPos ", this._taskListScrollPos);
    // };

    // onEndReachedTaskList = () => {
    //     console.log("onEndReachedTaskList");
    //     this._taskListAtEnd = true;
    // };

    _onGestureStateChanged = event => {
        console.log("_onGestureStateChanged");
    };
    startTimesPanRef;

    render() {
        console.info("AlarmDetail render ");
        console.debug("AlarmDetail render - this.state: ", this.state);
        let imageHeight = SCREEN_HEIGHT + 30;

        /* clockAndLabelTranslation:
            This is complicated. There are 2 Animated values that can effect the translateY value of
            the Clock+Label view:
                1) this._clockTransform -- tracks the vertical position of the Interactable.View
                2) this._animKeyboardHeight -- follows the height of the keyboard with equal duration to that of keyboard appearance/disappearance
            If we are in normal mode, we need the Clock+Label view to move out of the way for the keyboard (especially in small SE screen). So we 
            use Animated.add to add the 2 animated values together. AnimKeyboardHeight is first interpolated since it doesn't need to move the full
            keyboard height up (since there was already a decent size gap to begin with). The addition of the animKeyboardHeight interpolation and
            the current clockTransform value, is then interpolated again mapping 'snap points' to screen height, so that the Clock+Label view movement
            is lessened compared to the dragging gesture of the Interactable.View.
        */
        let clockAndLabelTranslation;
        if (this.state.alarm.mode == "normal") {
            console.info("NORMAL MODE ");
            clockAndLabelTranslation = Animated.add(
                this._clockTransform,
                this._animKeyboardHeight.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, 250],
                    extrapolate: "clamp"
                })
            ).interpolate({
                inputRange: [this.snapTaskList, this.snapAuto, this.snapNormal],
                outputRange: [
                    SCREEN_HEIGHT * 0.97,
                    SCREEN_HEIGHT,
                    SCREEN_HEIGHT * 0.3
                ]
            });
        } else {
            console.info("CALC MODE");

            clockAndLabelTranslation = this._clockTransform.interpolate({
                inputRange: [this.snapTaskList, this.snapAuto, this.snapNormal],
                outputRange: [
                    SCREEN_HEIGHT * 0.97,
                    SCREEN_HEIGHT,
                    SCREEN_HEIGHT * 0.3
                ]
            });
        }

        // FIXME: TODO: This should not go here. We shouldn't have to re-sort the tasks on every render.
        // Assign tasks to 'sortedTasks', first ordering them if there are >1
        // let sortedTasks =
        //     this.state.alarm.tasks.length > 1
        //         ? this.state.alarm.tasks.sorted("order")
        //         : this.state.alarm.tasks;

        let sortedTasks = this._cachedSortedTasks;

        // console.log("sortedTasks", sortedTasks);
        // let sortedTasks = [];
        // for (let id in sortedTasksRealm) {
        //     sortedTasks.push(sortedTasksRealm[id]);
        // }

        console.log("AlarmDetail: this._viewIdx", this._viewIdx);

        let taskArea = null;
        if (sortedTasks.length == 0) {
            taskArea = (
                <TouchableOpacity
                    style={{
                        flex: 1
                    }}
                    onPress={this._onPressAddTask.bind(this)}
                >
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "column",
                            justifyContent: "center"
                        }}
                    >
                        <View
                            style={{
                                alignSelf: "center",
                                justifyContent: "center",
                                position: "absolute",
                                // borderColor: "black",
                                // borderWidth: 0.5,
                                backgroundColor: "#191966",
                                padding: 12,
                                borderRadius: 7,
                                shadowOffset: {
                                    height: 2,
                                    width: 0
                                },
                                shadowOpacity: 0.5,
                                shadowRadius: 2,
                                elevation: 3,
                                shadowColor: "black",
                                zIndex: 999
                            }}
                        >
                            <Text style={{ color: "#FFFFFF" }}>ADD TASKS</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        } else {
            // console.log("Passing new list of tasks to TaskList");
            let forceRemeasure = this._taskListNeedsRemeasure;
            this._taskListNeedsRemeasure = false;

            console.log("forceRemeasure?", forceRemeasure);

            taskArea = (
                <TaskList
                    onPressItem={this._onPressTask.bind(this)}
                    onPressItemCheckBox={this.onChangeTaskEnabled}
                    onChangeTaskDuration={this.onChangeTaskDuration}
                    onPressDelete={this._onDeleteTask.bind(this)}
                    onShowDurationSlider={() =>
                        this.setState({ isSlidingTask: true })
                    }
                    onSnapTask={this._onSnapTask.bind(this)}
                    data={sortedTasks}
                    activeTask={this.state.activeTask}
                    closeTaskRows={this._closeTaskRows.bind(this)}
                    isEditingTasks={this.state.isEditingTasks}
                    isSlidingTask={this.state.isSlidingTask}
                    didEndMove={this._didEndMove.bind(this)}
                    onReorderTasks={this._onReorderTasks.bind(this)}
                    willStartMove={() => this.setState({ disableDrag: true })}
                    forceRemeasure={forceRemeasure}
                    hideDisabledTasks={this.state.hideDisabledTasks}
                    containerDimensions={this.state.taskListDimensions}
                    startTimesAnim={this.startTimesHandleAnim}
                    durationsVisible={this.state.durationsVisible}
                    // onScroll={this.onScrollTaskList.bind(this)}
                    // onEndReached={this.onEndReachedTaskList.bind(this)}
                />
            );
        }

        let wakeUpTime = this.state.alarm.wakeUpTime;
        // console.log("this.state.alarm.mode", this.state.alarm.mode);
        // if (this.state.alarm.mode == "autocalc") {
        //     wakeUpTime = this._calcWakeUpTime();
        // } else {
        //     wakeUpTime = this.state.alarm.wakeUpTime;
        // }

        let wakeTimeMoment = moment.utc(wakeUpTime).local();
        let fWakeUpTime = wakeTimeMoment.format("h:mm");
        let amPmWakeUpTime = wakeTimeMoment.format("A");

        let interactableRef = el => (this.interactiveRef = el);

        let touchableBackdrop,
            fullScreenTouchableBackdrop = null;
        // console.log("this.props.navigation", this.props.navigation);

        if (this.state.activeTask != null) {
            touchableBackdrop = (
                <TouchableBackdrop
                    style={{
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT
                    }}
                    onPress={() => {
                        // console.log(
                        //     "Pressed touchable without feedback"
                        // );
                        this._closeTaskRows();
                    }}
                />
            );
        } else if (this.state.menuIsOpen || this.state.showSnoozePicker) {
            fullScreenTouchableBackdrop = (
                <TouchableBackdrop
                    style={{
                        position: "absolute",
                        top: 0, // - (isIphoneX() ? 15 : 0),
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.4)"
                    }}
                    onPress={() => {
                        // console.log(
                        //     "Pressed touchable without feedback"
                        // );
                        // let nextMenuIsOpen = !isMenuOpen;

                        this._setMenuState(false);
                        this._closeSnoozeTimePicker();
                    }}
                />
            );
        }

        let editTasksBtn;
        if (!this.state.isEditingTasks) {
            editTasksBtn = (
                <EntypoIcon
                    name="edit"
                    size={scaleByFactor(20, 0.2)}
                    // color="#7a7677"
                    color={Colors.brandLightOpp}
                />
            );
        } else {
            editTasksBtn = (
                <View
                    style={{
                        flex: 1,
                        paddingHorizontal: 7,
                        // paddingVertical: 3,
                        borderRadius: 12,
                        backgroundColor: Colors.brandLightPurple,
                        alignItems: "center",
                        alignContent: "center",
                        justifyContent: "center"
                    }}
                >
                    <Text
                        style={{
                            color: "white",
                            fontSize: scaleByFactor(15, 0.1),
                            textAlignVertical: "center"
                        }}
                    >
                        DONE
                    </Text>
                </View>
            );
        }

        let snapPoints = [
            { y: this.snapNormal, id: "normal" },
            { y: this.snapAuto, id: "autocalc" },
            { y: this.snapTaskList, id: "tasklist" }
        ];

        let labelForceVisible = null;
        let handleForceHide = null;

        // if (this.state.isEditingLabel && this.state.keyboardHeight) {
        // snapPoints.push({
        //     y:
        //         SCREEN_HEIGHT -
        //         this.state.keyboardHeight -
        //         50 -
        //         this.xtraKeyboardHeight,
        //     id: "keyboard"
        // });
        // labelForceVisible = { opacity: 1 };
        // handleForceHide = { opacity: 0 };
        // }

        return (
            <ScrollView
                contentContainerStyle={styles.screenContainer}
                keyboardShouldPersistTaps={"handled"}
                scrollEnabled={false}
            >
                <TouchableBackdrop />
                {/* <StatusBar style={{ backgroundColor: Colors.brandDarkGrey }} /> */}
                {/*This is the actual Star image. It takes up the whole screen. */}
                <Animated.Image
                    style={[
                        styles.clockBackground,
                        { height: imageHeight },
                        {
                            transform: [
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [
                                                -SCREEN_HEIGHT,
                                                SCREEN_HEIGHT
                                            ],
                                            outputRange: [0, SCREEN_HEIGHT / 30]
                                        }
                                    )
                                },
                                { perspective: 1000 }
                            ]
                        }
                    ]}
                    // source={require("../img/ClockBgd_v5.png")}
                    source={require("../img/ClockBgd_v8_iphoneSE-5-6-7-8.png")}
                    // source={require("../img/ClockBgd_v9_iphoneSE-5-6-7-8.png")}
                />
                {touchableBackdrop}
                <Interactable.View
                    ref={interactableRef}
                    style={[
                        styles.animatedView,
                        {
                            width: SCREEN_WIDTH,
                            backgroundColor: "transparent"
                            // backgroundColor: "#456729"
                        }
                    ]}
                    verticalOnly={true}
                    snapPoints={snapPoints}
                    animatedValueY={this._clockTransform}
                    onSnap={this.onSnap.bind(this)}
                    // initialPosition={{ y: initInterPosition }}
                    dragEnabled={!this.state.disableDrag}
                    boundaries={{
                        top: -SCREEN_HEIGHT * 0.45, // 0.7 before
                        bottom: this.snapNormal * 1.15,
                        bounce: 0.3
                    }}
                    dragWithSpring={
                        this.state.alarm.mode == "normal"
                            ? { tension: 1200, damping: 0.5 }
                            : { tension: 1500, damping: 0.5 }
                    }
                    // dragWithSpring={{ tension: 200, damping: 0.5 }}
                    // frictionAreas={[
                    //     { damping: 0.0, influenceArea: { right: 0 } }
                    // ]}
                    animatedNativeDriver={true}
                    onDrag={this._onDragInteractable.bind(this)}
                    // onStartShouldSetResponderCapture={({ nativeEvent }) => {
                    //     this._dragStartPos = nativeEvent.pageY;
                    // }}
                    // onMoveShouldSetResponderCapture={({ nativeEvent }) => {
                    //     console.log(
                    //         "Interactable.View: onMoveShouldSetResponderCapture"
                    //     );
                    //     console.log(
                    //         "Scroll position is <= 0",
                    //         this._taskListScrollPos
                    //     );
                    //     // if (this._taskListScrollPos <= 0) {

                    //     // }
                    //     console.log("latest", nativeEvent);
                    //     console.log("previous", this._dragStartPos);

                    //     // If drag from top to bottom (attempt to scroll up), and scrollPosition is 0, take control of responder
                    //     if (
                    //         this._dragStartPos < nativeEvent.pageY &&
                    //         this._taskListScrollPos <= 0
                    //     ) {
                    //         return true;
                    //     }

                    //     // If drag is from bottom to top (attempt to scroll down), and scrollPosition is bottom, take control of responder
                    // }}
                >
                    {/* This is the animated wrapper for the CLOCK display, and the label shown in Normal */}
                    <Animated.View
                        style={[
                            styles.clockContainer,
                            {
                                transform: [
                                    {
                                        translateY: clockAndLabelTranslation
                                    },
                                    {
                                        scale: this._clockTransform.interpolate(
                                            {
                                                inputRange: [
                                                    // this.snapAuto -
                                                    //     SCREEN_HEIGHT * 0.5,
                                                    // this.snapAuto -
                                                    //     SCREEN_HEIGHT * 0.1,
                                                    this.snapAuto,
                                                    this.snapNormal,
                                                    this.snapNormal +
                                                        SCREEN_HEIGHT * 0.2
                                                ],
                                                outputRange: [
                                                    // 0,
                                                    // 0.5,
                                                    0.9,
                                                    1,
                                                    1.1
                                                ],
                                                extrapolate: "clamp"
                                            }
                                        )
                                    },
                                    { perspective: 1000 }
                                ]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            onPress={this.onPressClock.bind(
                                this
                                // interactableRef
                            )}
                            style={{
                                alignSelf: "stretch",
                                alignContent: "center",
                                justifyContent: "center",
                                backgroundColor: "transparent",
                                flex: 0.65
                            }}
                        >
                            <Text style={[styles.timeText]}>
                                {fWakeUpTime}
                                <Text
                                    style={[
                                        { fontSize: scaleByFactor(53, 0.7) }
                                    ]}
                                >
                                    {" " + amPmWakeUpTime}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                        <this.AnimatedAlarmLabel
                            placeholder="Enter a label"
                            defaultValue={
                                this.alarmLabelCache || this.state.alarm.label
                            }
                            onChangeText={this.onChangeLabel}
                            onBlur={this.onLabelInputBlur}
                            onFocus={this.onLabelInputFocus}
                            underlineColorAndroid="transparent"
                            style={{
                                opacity: this._clockTransform.interpolate({
                                    inputRange: [
                                        this.snapAuto,
                                        this.snapNormal
                                    ],
                                    outputRange: [0, 1]
                                }),
                                // backgroundColor: "#AA6",
                                fontSize: scaleByFactor(16, 0.6),
                                textAlign: "center",
                                color: Colors.brandOffWhiteBlue,
                                fontWeight: "400",
                                justifyContent: "center",
                                height: 100,
                                position: "absolute",
                                bottom: "0%",
                                width: SCREEN_WIDTH,
                                alignSelf: "stretch",
                                ...labelForceVisible
                            }}
                            autoResize={false}
                            numberOfLines={1}
                            multiline={false}
                        />
                    </Animated.View>
                    <View
                        style={[
                            styles.nonClockWrapper
                            // {
                            //     height:
                            //         this.state.nonClockHeight ||
                            //         SCREEN_HEIGHT * 0.7
                            // }
                        ]}
                    >
                        <Image
                            style={[
                                styles.nonClockBgImage,
                                {
                                    height: SCREEN_HEIGHT * 1.2,
                                    resizeMode: "cover"
                                }
                            ]}
                            source={require("../img/NonClockBgV2.png")}
                        />

                        <View
                            style={[
                                styles.fieldsContainer,
                                {
                                    flex: this.state.fieldAreaFlex || 0.17
                                    // backgroundColor: "blue"
                                }
                                // { flex: 0 }
                            ]}
                        >
                            <LabeledInput
                                labelText="Label"
                                placeholder="Enter a label"
                                fieldText={this.alarmLabelCache}
                                handleTextInput={this.onChangeLabel}
                                onTextInputBlur={this.onLabelInputBlur}
                                separation={0}
                                textInputStyle={{
                                    fontSize: scaleByFactor(32, 0.5)
                                }}
                                flex={0.5}
                                autoResize={false}
                                numberOfLines={1}
                                multiline={false}
                                clearButton={
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.alarmLabelCache = "";
                                            // we are faking a 'blur' event here, so that the cache change is saved to DB and state is updated.
                                            this.onLabelInputBlur();
                                        }}
                                        style={{
                                            flex: 0.05,
                                            // position: "absolute",
                                            // right: 0,
                                            // top: 0,
                                            // bottom: 0,
                                            justifyContent: "center",
                                            alignItems: "center"
                                        }}
                                    >
                                        <EntypoIcon
                                            name="circle-with-cross"
                                            size={15}
                                            color="#929292"
                                        />
                                    </TouchableOpacity>
                                }
                            />
                            {/* <View style={{ height: scale(3) }} /> */}
                            {/* <View
                                style={{
                                    height: 1,
                                    backgroundColor: "#E0E0E0"
                                }}
                            /> */}
                            <View
                                style={{
                                    flex: 0.5,
                                    flexDirection: "row",
                                    justifyContent: "space-between"
                                    // backgroundColor: "blue"
                                }}
                            >
                                <LabeledTimeInput
                                    labelText="Arrival"
                                    flex={0.5}
                                    // fieldText={moment
                                    //     .utc(this.state.alarm.arrivalTime)
                                    //     .local()
                                    //     .format("h:mm A")}
                                    behavior={"picker"}
                                    time={moment
                                        .utc(this.state.alarm.arrivalTime)
                                        .local()
                                        .toDate()}
                                    handleArrivalChange={
                                        this._onArrivalTimePicked
                                    }
                                    timePickerPrompt="What time do you need to arrive?"
                                    inputFontSize={scaleByFactor(33, 0.5)}
                                    separation={scaleByFactor(5, 0.3)}
                                    onOpenModal={Keyboard.dismiss}
                                />
                                {/* {
                                    <View
                                        style={{
                                            alignSelf: "stretch",
                                            backgroundColor: "transparent",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <EntypoIcon
                                            style={{ flex: 0.5 }}
                                            name="moon"
                                        />
                                    </View>
                                } */}
                                <LabeledTimeInput
                                    labelText="Hrs of Sleep"
                                    fieldText={this._hoursOfSleep}
                                    flex={0.5}
                                    viewStyle={{
                                        flex: 0.3,
                                        height: "auto"
                                        // backgroundColor: "green",
                                    }}
                                    inputFontSize={scaleByFactor(33, 0.5)}
                                    separation={scaleByFactor(5, 0.3)}
                                    behavior={"hider"}
                                    textAlign={"right"}
                                    disabled={this.state.alarm.showHrsOfSleep}
                                    hiderView={
                                        !this.state.alarm.showHrsOfSleep && (
                                            <EntypoIcon
                                                style={{
                                                    textAlign: "right",
                                                    padding: 4
                                                    // backgroundColor: "red",
                                                }}
                                                size={25}
                                                name="moon"
                                            />
                                        )
                                    }
                                />
                            </View>
                            {/* <View style={{ height: 5 }} /> */}
                            {/* <View
                                style={{
                                    height: 1,
                                    backgroundColor: "#E0E0E0"
                                }}
                            /> */}
                        </View>
                        {touchableBackdrop}
                        <LinearGradient
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 0.04 }}
                            colors={["#D2CED4", Colors.backgroundGrey]}
                            // colors={["green", "green"]}
                            style={[
                                styles.taskListContainer,
                                {
                                    flex: this.state.taskAreaFlex || 0.4
                                }
                            ]}
                        >
                            <View
                                style={[
                                    styles.taskListHeader,
                                    {
                                        flex: this.state.taskHeaderFlex || 0.15,
                                        // backgroundColor: "green"
                                        backgroundColor: "transparent"

                                        // backgroundColor: "green"
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    // onPress={() => this.interactiveRef.snapTo({ index: 2 })}>
                                    onPress={this._onPressTasksHeader.bind(
                                        this
                                    )}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        bottom: 0,
                                        left: SCREEN_WIDTH / 4,
                                        right: SCREEN_WIDTH / 4,
                                        justifyContent: "center",
                                        alignItems: "center"
                                        // backgroundColor: "green"
                                    }}
                                >
                                    <Text
                                        style={[
                                            TextStyle.labelText,
                                            {
                                                fontSize: scaleByFactor(17, 0.3)
                                            }
                                        ]}
                                    >
                                        Tasks
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        alignSelf: "stretch",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingRight: 25,
                                        backgroundColor: "transparent"
                                        // backgroundColor: "green"
                                    }}
                                    onPress={this._onPressAddTask.bind(this)}
                                    /* onPress={this._CHANGE_CLOCK_FONT.bind(this)} */
                                    hitSlop={{
                                        top: 10,
                                        bottom: 10,
                                        right: 20,
                                        left: 0
                                    }}
                                >
                                    <EntypoIcon
                                        name="add-to-list"
                                        size={scaleByFactor(30, 0.2)}
                                        // color="#7a7677"
                                        color={Colors.brandLightOpp}
                                    />
                                    {/* {editTasksBtn} */}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        alignSelf: "stretch",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingLeft: 25,
                                        backgroundColor: "transparent"
                                        // backgroundColor: "green"
                                    }}
                                    onPress={() => {
                                        // alert(
                                        //     "Hide disabled tasks! (Not implemented)"
                                        // )
                                        // this._calcStartTimes(
                                        //     !this.state.hideDisabledTasks
                                        // );
                                        this.setState({
                                            hideDisabledTasks: !this.state
                                                .hideDisabledTasks
                                        });
                                    }}
                                    hitSlop={{
                                        top: 10,
                                        bottom: 10,
                                        left: 20,
                                        right: 0
                                    }}
                                >
                                    {this.state.hideDisabledTasks ? (
                                        <EntypoIcon
                                            name="eye-with-line"
                                            size={scaleByFactor(26, 0.2)}
                                            // color="#7a7677"
                                            color={Colors.brandLightOpp}
                                        />
                                    ) : (
                                        <EntypoIcon
                                            name="eye"
                                            size={scaleByFactor(26, 0.2)}
                                            // color="#7a7677"
                                            color={Colors.brandLightOpp}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {/* <Interactable.View
                                style={[
                                    // StyleSheet.absoluteFill,
                                    {
                                        position: "absolute",
                                        // right: 0,
                                        left: SCREEN_WIDTH - 15,
                                        // top: 173,
                                        top: 0,
                                        bottom: 0,
                                        width: 230,
                                        // paddingBottom: scaleByFactor(10, 0.4),

                                        // paddingVertical: scaleByFactor(10, 0.4)
                                        backgroundColor: "transparent"
                                        // backgroundColor: "red"
                                        // borderRadius: 10
                                        // backgroundColor: Colors.brandDarkGrey
                                    }
                                ]}
                                horizontalOnly={true}
                                animatedNativeDriver={true}
                                snapPoints={[
                                    { id: "dur", x: 0 },
                                    { id: "st", x: -230 }
                                    // { id: "hide", x: -160 }
                                ]}
                                boundaries={{ right: 20, left: -235 }}
                                ref={el => (this.startTimesRef = el)}
                                animatedValueX={this.startTimesHandleAnim}
                                dragEnabled={false}
                                onDrag={event => {
                                    let {
                                        state,
                                        y,
                                        targetSnapPointId
                                    } = event.nativeEvent;

                                    if (state == "start") return;

                                    console.log("onDrag - end");
                                    console.log(
                                        "targetSnapPointId",
                                        targetSnapPointId
                                    );
                                    let toValue;
                                    if (targetSnapPointId == "st") {
                                        toValue = 0;
                                        // this.startTimesRef.snapTo({ index: 0 });
                                    } else {
                                        toValue = -230;
                                    }
                                    // Animated.spring(
                                    //     this.startTimesHandleAnim,
                                    //     {
                                    //         toValue: toValue,
                                    //         bounciness: 10,
                                    //         useNativeDriver: true
                                    //     }
                                    // ).start();
                                }}
                                // initialPosition={{ y: initInterPosition }}
                            > */}
                            <PanGestureHandler
                                ref={el => (this.startTimesPanRef = el)}
                                onGestureEvent={Animated.event(
                                    [
                                        {
                                            nativeEvent: {
                                                // contentOffset: {
                                                translationX: this
                                                    .startTimesHandleAnim
                                                // }
                                            }
                                        }
                                    ],
                                    { useNativeDriver: true }
                                )}
                                shouldCancelWhenOutside={false}
                                onHandlerStateChange={({ nativeEvent }) => {
                                    if (nativeEvent.state != State.END) {
                                        return;
                                    }
                                    if (
                                        nativeEvent.translationX > -70 &&
                                        nativeEvent.velocityX > -1000
                                    ) {
                                        // console.log(
                                        //     "Translation too small or velocity too slow. Snapping back"
                                        // );
                                        // Animated.spring back to 0
                                        Animated.spring(
                                            this.startTimesHandleAnim,
                                            {
                                                toValue: 0,
                                                tension: 300,
                                                friction: 11,
                                                useNativeDriver: true
                                            }
                                        ).start();
                                    } else {
                                        // translationX is less than -70, finish the flip (Animated.spring to 1)
                                        Animated.timing(
                                            this.startTimesHandleAnim,
                                            {
                                                toValue: -230,
                                                duration: 200,
                                                easing: Easing.bounce,
                                                useNativeDriver: true
                                            }
                                        ).start(() => {
                                            this.setState({
                                                durationsVisible: !this.state
                                                    .durationsVisible
                                            });
                                            this.startTimesHandleAnim.setValue(
                                                0
                                            );
                                        });
                                    }
                                }}
                                minDist={1}
                            >
                                {/* <Animated.View style={animatedStyles} /> */}
                                {/* <-- NEEDS TO BE Animated.View */}
                                <Animated.View
                                    style={[
                                        // StyleSheet.absoluteFill,
                                        {
                                            position: "absolute",
                                            // right: 0,
                                            left: SCREEN_WIDTH - 15,
                                            // left: 0,
                                            // top: 173,
                                            top: 0,
                                            bottom: 0,
                                            width: 230,
                                            // paddingBottom: scaleByFactor(10, 0.4),

                                            // paddingVertical: scaleByFactor(10, 0.4)
                                            backgroundColor: "transparent"
                                            // backgroundColor: "red"
                                            // borderRadius: 10
                                            // backgroundColor: Colors.brandDarkGrey
                                        }
                                    ]}
                                />
                            </PanGestureHandler>
                            {/* </Interactable.View> */}
                            {touchableBackdrop}
                            {taskArea}
                        </LinearGradient>
                        {/* Task Start-Times Interactable View*/}
                        {/* <View
                            style={[
                                // StyleSheet.absoluteFill,
                                {
                                    position: "absolute",
                                    // right: 0,
                                    left: SCREEN_WIDTH - 80,
                                    // top: 173,
                                    top: 0,
                                    bottom: 0,
                                    width: 230,
                                    // backgroundColor: "green",
                                    overflow: "hidden"
                                }
                            ]}
                            pointerEvents="box-none"
                        > */}
                    </View>
                    <this.AnimatedHandle
                        name="drag-handle"
                        size={scaleByFactor(25, 0.5)}
                        color={Colors.disabledGrey}
                        style={{
                            position: "absolute",
                            left:
                                SCREEN_WIDTH / 2 -
                                scaleByFactor(25, 0.5) / 2 -
                                30, // padding (30 left + 30 right / 2 == 30)
                            backgroundColor: "transparent",
                            // backgroundColor: "blue",
                            paddingHorizontal: 30,
                            paddingVertical: 15,
                            transform: [
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [
                                                this.snapTaskList,
                                                this.snapAuto,
                                                this.snapNormal
                                            ],
                                            outputRange: [
                                                SCREEN_HEIGHT * 1.1,
                                                SCREEN_HEIGHT * 1.185,
                                                SCREEN_HEIGHT * 0.76
                                            ]
                                        }
                                    )
                                },
                                { perspective: 1000 }
                            ]
                        }}
                        onPress={this._onPressAnimHandle.bind(this)}
                        hitSlop={{ top: 70, bottom: 70, left: 70, right: 70 }}
                    />
                </Interactable.View>

                <Animated.View
                    style={{
                        position: "absolute",
                        alignSelf: "flex-end",
                        backgroundColor: "transparent",
                        transform: [
                            {
                                scale: this._clockTransform.interpolate({
                                    inputRange: [
                                        this.snapAuto - SCREEN_HEIGHT * 0.2,
                                        this.snapAuto,
                                        this.snapNormal,
                                        this.snapNormal + SCREEN_HEIGHT * 0.2
                                    ],
                                    outputRange: [1.0, 0.9, 1, 1.1],
                                    extrapolate: "clamp"
                                })
                            },
                            {
                                translateY: this._clockTransform.interpolate({
                                    inputRange: [
                                        this.snapTaskList,
                                        this.snapAuto
                                    ],
                                    outputRange: [-SCREEN_HEIGHT * 0.3, 0],
                                    extrapolate: "clamp"
                                })
                            },
                            { perspective: 1000 }
                        ]
                        // opacity: this._clockTransform.interpolate({
                        //     inputRange: [this.snapTaskList, this.snapAuto],
                        //     outputRange: [-2, 1]
                        // })
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            this.props.navigation.navigate("Sounds", {
                                saveSound: this.saveSound.bind(this),
                                currSound: this.state.alarm.alarmSound
                            });
                        }}
                        style={{
                            padding: scaleByFactor(20, 0.6)
                        }}
                    >
                        <FAIcon
                            name="music"
                            size={scaleByFactor(23, 0.4)}
                            // color="#ECECEC"
                            color={Colors.brandOffWhiteBlue}
                            // color="#10ac84"
                            iconStyle={{
                                color: "blue"
                            }}
                        />
                    </TouchableOpacity>
                </Animated.View>
                {!this.state.showSnoozePicker && fullScreenTouchableBackdrop}
                {/*  <Animated.View
                    style={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        backgroundColor: "rgba(20, 20, 82, 0.6)",
                        borderRadius: 15,
                        opacity: this._modeTextOpacity,
                        transform: [
                            {
                                scale: this._modeTextScale
                            },
                            {
                                translateY: this._clockTransform.interpolate({
                                    inputRange: [
                                        this.snapTaskList,
                                        this.snapAuto
                                    ],
                                    outputRange: [-SCREEN_HEIGHT * 0.3, 0],
                                    extrapolate: "clamp"
                                })
                            }
                        ]
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            console.log("Pressed mode indicator text");
                            Alert.alert(
                                "Mode Indication",
                                "Hide mode inidicator?",
                                [
                                    {
                                        text: "Hide",
                                        onPress: () => {
                                            // TODO: Save to global settings
                                            console.log(
                                                "(MOCK) Saving 'hide mode inidicator' to global settings"
                                            );
                                        }
                                    },
                                    {
                                        text: "Cancel",
                                        style: "cancel"
                                    }
                                ]
                            );
                        }}
                    >
                        <Text
                            style={{
                                backgroundColor: "transparent",
                                color: Colors.brandLightGrey
                            }}
                        >
                            {this.state.alarm.mode == "normal"
                                ? "Classic Mode"
                                : "Calculate Mode"}
                        </Text>
                    </TouchableOpacity>
                </Animated.View> */}
                <Animated.View
                    style={{
                        position: "absolute",
                        top: Header.HEIGHT - 20, // - (isIphoneX() ? 20 : 0),
                        left: 0,
                        right: 0,
                        height: 240,
                        overflow: "hidden",
                        transform: [
                            {
                                translateY: _menuIconAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-290, -Header.HEIGHT + 20]
                                })
                            }
                        ]
                        // backgroundColor: "blue"
                    }}
                    pointerEvents="box-none"
                >
                    {/* <MenuHeader title="Alarm Options" open={isMenuOpen} /> */}
                    <MenuItem
                        left={
                            <MaterialComIcon
                                name="sleep"
                                size={25}
                                color={Colors.brandDarkPurple}
                            />
                        }
                        center="Snooze Time"
                        right={
                            <Text>{`${this.state.alarm.snoozeTime} min`}</Text>
                        }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={() => {
                            // AlarmDetail.closeMenu(this.state.menuIsOpen, navigation);
                            this._setMenuState(0);
                            this._openSnoozeTimePicker();
                        }}
                    />
                    <MenuItem
                        left={
                            <EntypoIcon
                                size={25}
                                name="moon"
                                color={Colors.brandDarkPurple}
                            />
                        }
                        center={"Hide Hours of Sleep"}
                        right={
                            !this.state.alarm.showHrsOfSleep ? (
                                <EntypoIcon name="check" size={22} />
                            ) : (
                                <View />
                            )
                        }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={() => {
                            realm.write(() => {
                                let { alarm } = this.state;
                                alarm.showHrsOfSleep = !alarm.showHrsOfSleep;
                            });
                            this._setMenuState(0);
                        }}
                    />
                    <MenuItem
                        left={
                            this.state.durationsVisible ? (
                                <MaterialComIcon
                                    size={25}
                                    name="timetable"
                                    color={Colors.brandDarkPurple}
                                />
                            ) : (
                                <EntypoIcon
                                    size={25}
                                    name="time-slot"
                                    color={Colors.brandDarkPurple}
                                />
                            )
                        }
                        centerRight={
                            <Text>
                                {this.state.durationsVisible
                                    ? "Show Task Start Times"
                                    : "Show Task Durations"}
                            </Text>
                        }
                        // right={
                        //     !this.state.durationsVisible ? (
                        //         <EntypoIcon name="check" size={22} />
                        //     ) : (
                        //         <View />
                        //     )
                        // }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={() => {
                            // realm.write(() => {
                            //     let { alarm } = this.state;
                            //     alarm.showHrsOfSleep = !alarm.showHrsOfSleep;
                            // });
                            // this._setMenuState(0);
                            let nextState = {
                                durationsVisible: !this.state.durationsVisible
                            };
                            this._setMenuState(0, nextState);
                        }}
                    />
                    <MenuItem
                        // style={{ height: 80 }}
                        left={
                            <MaterialComIcon
                                name="view-dashboard-variant"
                                size={25}
                                color={Colors.brandDarkPurple}
                            />
                        }
                        centerRight={
                            <StyledRadio
                                title="Mode"
                                options={[
                                    {
                                        id: 0,
                                        name: "Classic"
                                    },
                                    {
                                        id: 1,
                                        name: "Clockulator"
                                    },
                                    {
                                        id: 2,
                                        name: "Task List"
                                    }
                                ]}
                                initialIdx={this._viewIdx}
                                selectedIdx={this._viewIdx}
                                onSelect={idx => {
                                    // console.log("Pressed fancy radio: ", idx);
                                    this._snapToIdx(idx);
                                    // this._snapToIdx(idx);1
                                }}
                                // style={{ flex: 0.75 }}
                            />
                        }
                        showSeparator={false}
                    />
                </Animated.View>
                {/* Measuring line -- dev view to check whether views are aligned properly */}
                {/* <View
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 260,
                        height: 2,
                        backgroundColor: "black"
                    }}
                /> */}
                <DateTimePicker
                    date={moment
                        .utc(this.state.alarm.wakeUpTime)
                        .local()
                        .toDate()} // time has been converted into a Date() for this Component
                    mode={"time"}
                    titleIOS={"Set Wake-Up Time"}
                    isVisible={this.state.isDatePickerVisible}
                    onConfirm={this._onWakeTimePicked}
                    onCancel={this._hideDateTimePicker}
                />
                {this.state.showSnoozePicker && (
                    <PickerActionSheet
                        initialValue={this.state.alarm.snoozeTime}
                        onValueSelected={this._saveSnoozeTime.bind(this)}
                        onPressedCancel={this._closeSnoozeTimePicker.bind(this)}
                        backdrop={fullScreenTouchableBackdrop}
                    />
                )}
            </ScrollView>
        );
    }
}

const snoozeTimeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15];

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        alignItems: "center",
        alignContent: "stretch",
        backgroundColor: Colors.backgroundGrey
        // backgroundColor: "green"
    },

    clockBackground: {
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -100, // required for image parallax
        width: SCREEN_WIDTH * 1.2,
        backgroundColor: "transparent",
        padding: 10
    },
    clockContainer: {
        // position: "absolute",
        // justifyContent: "center",
        // alignItems: "center",
        backgroundColor: "transparent",
        height: SCREEN_HEIGHT * 0.3,
        width: SCREEN_WIDTH,
        top: 0
        // backgroundColor: "#9DD033"
        // top: 20
    },
    interactableHandle: {
        backgroundColor: "transparent",
        // backgroundColor: "#0FF",
        width: SCREEN_WIDTH
    },
    nonClockWrapper: {
        alignItems: "stretch",
        height: SCREEN_HEIGHT * 1.15,
        top: SCREEN_HEIGHT * 0.9
        // borderWidth: 3,
        // borderColor: "blue"
    },
    animatedView: {
        // flex: 1,
        position: "absolute",
        top: -SCREEN_HEIGHT,
        left: 0,
        height: SCREEN_HEIGHT * 2.5
    },
    fieldsContainer: {
        alignSelf: "stretch",
        justifyContent: "center",
        // backgroundColor: "yellow",
        padding: scaleByFactor(10, 0.4),
        paddingBottom: 8,
        borderBottomColor: "#e9e9e9"
        // borderBottomWidth: 1
    },
    taskListHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: 20
        // paddingVertical: 10,
        // backgroundColor: "blue"
    },
    taskListContainer: {
        // flex: 0.22,
        paddingHorizontal: scaleByFactor(10, 0.4),
        paddingBottom: scaleByFactor(10, 0.4),
        alignSelf: "stretch",
        backgroundColor: Colors.backgroundGrey
        // borderColor: "red",
        // borderWidth: 1
    },
    // taskAreaFiller: {
    //     flex: 0.75,
    //     // padding: scaleByFactor(10, 0.4),
    //     alignSelf: "stretch"
    //     // backgroundColor: Colors.backgroundGrey
    //     // backgroundColor: "#afabb0"
    // },
    nonClockBgImage: {
        position: "absolute",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        top: -15,
        left: 0
    },
    clockBackgroundNotImage: {
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -40,
        width: SCREEN_WIDTH,
        height: 195,
        backgroundColor: "#220957"
    },
    timeText: {
        // color: "#d5d5d5",
        color: Colors.brandOffWhiteBlue,
        fontSize: scaleByFactor(105, 0.7),
        backgroundColor: "transparent",
        alignSelf: "center",
        // fontFamily: "Baskerville-Bold"
        fontFamily: "Quesha"
        // fontWeight: "bold"
    },
    dateText: {
        color: "#d5d5d5",
        fontSize: 40
    },
    menuHeader: {
        fontWeight: "bold",
        alignSelf: "stretch",
        fontSize: 15,
        padding: 10,
        paddingBottom: 5
    },
    menuOption: {
        // justifyContent: "center",
        // height: scale(50, 0.5),
        // padding: 10,
        alignSelf: "stretch",
        overflow: "hidden",
        backgroundColor: "#FDFDFD"
    }
});

export default AlarmDetail;
