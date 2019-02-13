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
    Easing,
    InteractionManager,
    ActivityIndicator
} from "react-native";
import { Header } from "react-navigation";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import FAIcon from "react-native-vector-icons/FontAwesome";
import MenuItem from "../components/menu-item";
import StyledRadio from "../components/styled-radio";

import Interactable from "react-native-interactable";
import DateTimePicker from "react-native-modal-datetime-picker";
// import KeyframesView from "react-native-facebook-keyframes";
import { isIphoneX, ifIphoneX } from "react-native-iphone-x-helper";
import LinearGradient from "react-native-linear-gradient";

import moment from "moment";

import realm from "../data/DataSchemas";
import TaskList from "../components/task-list";
import LabeledInput from "../components/labeled-input";
import LabeledTimeInput from "../components/labeled-time-input";
import PickerActionSheet from "../components/picker-action-sheet";
import EdgeSwiper from "../components/edge-swiper";

import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { AlarmModel } from "../data/models";
// import ArrowView from "../components/arrow-view-native";
import TouchableBackdrop from "../components/touchable-backdrop";
// TODO: Remove after we're done choosing fonts
import { fontPreview } from "../styles/text.js";
import { scale, scaleByFactor } from "../util/font-scale";
import * as DateUtils from "../util/date_utils";
import { ALARM_STATES } from "../data/constants";
import { AdWrapper, AdvSvcOnScreenConstructed } from "../services/AdmobService";
import upgrades from "../config/upgrades";

let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const snoozeTimeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15];

let _menuIconAnim = new Animated.Value(0);

let isSmallScreen = SCREEN_HEIGHT < 650;

/* Layout factors */
const NON_CLOCK_HEIGHT_FACTOR = 1.15; // multiply this by SCREEN_HEIGHT to get height of non-clock area
const TASK_AREA_TL_VIEW_FLEX_FACTOR = 0.91; // flex value for TaskArea (within non-clock area) in TaskList view
const TASK_AREA_AUTO_VIEW_FLEX_FACTOR = isSmallScreen ? 0.49 : 0.53; // flex value for TaskArea (within non-clock area) in Auto view
const TASK_HEAD_TL_VIEW_FLEX_FACTOR = 0.06; // flex value for TaskHeader (within TaskArea) in TaskList view
const TASK_HEAD_AUTO_VIEW_FLEX_FACTOR = 0.15; // flex value for Taskheader (within TaskArea) in Auto view
const TASK_LIST_TL_VIEW_FLEX_FACTOR = 1 - TASK_HEAD_TL_VIEW_FLEX_FACTOR; // flex value for TaskList (within TaskArea) in TaskList view
const TASK_LIST_AUTO_VIEW_FLEX_FACTOR = 1 - TASK_HEAD_AUTO_VIEW_FLEX_FACTOR; // flex value for TaskList (within TaskArea) in Auto view
const FIELDS_AREA_FLEX_FACTOR = isSmallScreen ? 0.24 : 0.17; // flex value for TaskArea (within non-clock area) in Auto view

const TASK_LIST_TL_VIEW_POS_FACTOR = 0.21; // multiply this by SCREEN_HEIGHT to get the position of TaskList from top of screen in TaskList View
const TASK_LIST_AUTO_VIEW_POS_FACTOR = isSmallScreen ? 0.65 : 0.595; // multiply this by SCREEN_HEIGHT to get the position of TaskList from top of screen in Auto view

const SNAP_FACTOR_TL_VIEW = isSmallScreen ? 0.44 : 0.385;
// for safe keeping
//const TASK_LIST_TL_VIEW_POS_FACTOR = 0.21; // multiply this by SCREEN_HEIGHT to get the position of TaskList from top of screen in TaskList View
//const TASK_LIST_AUTO_VIEW_POS_FACTOR = 0.595; // multiply this by SCREEN_HEIGHT to get the position of TaskList from top of screen in Auto view
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
                    <MaterialIcon
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
    snapTaskList = -SCREEN_HEIGHT * SNAP_FACTOR_TL_VIEW;

    xtraKeyboardHeight = 0; // this is always 0, except on iPhone X it is 34
    _animKeyboardHeight = new Animated.Value(0);

    tskListDimsTLView = {
        width: SCREEN_WIDTH,
        height:
            SCREEN_HEIGHT *
            NON_CLOCK_HEIGHT_FACTOR *
            TASK_AREA_TL_VIEW_FLEX_FACTOR *
            TASK_LIST_TL_VIEW_FLEX_FACTOR,
        pageX: 0,
        pageY: SCREEN_HEIGHT * TASK_LIST_TL_VIEW_POS_FACTOR - ifIphoneX(29, 0)
    };

    tskListDimsAutoView = {
        width: SCREEN_WIDTH,
        height:
            SCREEN_HEIGHT *
            NON_CLOCK_HEIGHT_FACTOR *
            TASK_AREA_AUTO_VIEW_FLEX_FACTOR *
            TASK_LIST_AUTO_VIEW_FLEX_FACTOR,
        pageX: 0,
        pageY: SCREEN_HEIGHT * TASK_LIST_AUTO_VIEW_POS_FACTOR - ifIphoneX(29, 0)
    };

    AnimatedAlarmLabel = Animated.createAnimatedComponent(TextInput);
    AnimatedHandle = Animated.createAnimatedComponent(TouchableOpacity);

    _clockTransform;
    _modeTextOpacity;
    _modeTextScale;
    startTimesHandleAnim = new Animated.Value(0);

    _viewIdx = null;
    _lastView = null;

    _hoursOfSleep = 0;
    _taskStartTimes = null;
    // _taskListScrollPos = 0;

    _snapPoints;
    _ALL_SNAP_POINTS;

    startTimesPanRef;

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
                    activeTask: null, // holds the task ID of the task currently showing DELETE button. Otherwise null.
                    isEditingTasks: false, // indicates whether tasks are currently moveable.
                    isEditingLabel: false, // indicates whether Label is being edited. Need to move Input when keyboard shows.
                    keyboardHeight: null,
                    isSlidingTask: false,
                    taskListFullScreen: false,
                    hideDisabledTasks: false,
                    menuIsOpen: false,
                    showSnoozePicker: false,
                    durationsVisible: true,
                    isLoadingTasks: true,
                    taskAreaFlex: TASK_AREA_AUTO_VIEW_FLEX_FACTOR,
                    taskHeaderFlex: TASK_HEAD_AUTO_VIEW_FLEX_FACTOR,
                    taskListDimensions: this.tskListDimsAutoView
                };
                // this.state.alarm.mode = "normal"; // FIXME: this is to hack in normal mode for testing
            });
        } else {
            // console.log("We are editing an existing alarm: ", params);
            this.state = {
                alarm: params.alarm,
                isDatePickerVisible: false,
                activeTask: null,
                isEditingTasks: false,
                isEditingLabel: false,
                keyboardHeight: null,
                isSlidingTask: false,
                taskListFullScreen: false,
                hideDisabledTasks: false,
                menuIsOpen: false,
                showSnoozePicker: false,
                durationsVisible: true,
                isLoadingTasks: true,
                taskAreaFlex: TASK_AREA_AUTO_VIEW_FLEX_FACTOR,
                taskHeaderFlex: TASK_HEAD_AUTO_VIEW_FLEX_FACTOR,
                taskListDimensions: this.tskListDimsAutoView
            };
        }

        this.alarmLabelCache = this.state.alarm.label;

        this._hoursOfSleep = this._calculateHoursOfSleep(
            this.state.alarm.wakeUpTime
        );

        // this._taskStartTimes = this._calcStartTimes();

        // this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");
        this._cachedSortedTasks = [];

        // this.renderRowsInclude = [];
        /* These may be used for Intro (Tutorial Mode), but removing for now */
        // TODO: Here we need to check whether user has global setting to "Never show mode indicator"
        // this._modeTextOpacity = new Animated.Value(1);
        // this._modeTextScale = new Animated.Value(0);

        this._ALL_SNAP_POINTS = [
            { y: this.snapNormal, id: "normal" },
            { y: this.snapAuto, id: "autocalc" },
            { y: this.snapTaskList, id: "tasklist" }
        ];

        let initModeIsNormal = this.state.alarm.mode == "normal";

        if (initModeIsNormal) {
            this._viewIdx = 0;
            this._clockTransform = new Animated.Value(this.snapNormal);
            this._snapPoints = this._ALL_SNAP_POINTS.slice(0, 2);
        } else {
            this._viewIdx = 1;
            this._clockTransform = new Animated.Value(this.snapAuto);
            this._snapPoints = this._ALL_SNAP_POINTS;
        }

        this.normModeCLTranslation = Animated.add(
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

        this.calcModeCLTranslation = this._clockTransform.interpolate({
            inputRange: [this.snapTaskList, this.snapAuto, this.snapNormal],
            outputRange: [
                SCREEN_HEIGHT * 0.97,
                SCREEN_HEIGHT,
                SCREEN_HEIGHT * 0.3
            ]
        });

        // console.log(this.state);
        // console.log(params);
        console.log("InteractionManager");

        this._onPressAnimHandle = this._onPressAnimHandle.bind(this);
        this._onPressTasksHeader = this._onPressTasksHeader.bind(this);
        this._onDragInteractable = this._onDragInteractable.bind(this);
        this._getMeasurementsForTaskRow = this._getMeasurementsForTaskRow.bind(
            this
        );
        this._onSelectViewFromMenu = this._onSelectViewFromMenu.bind(this);
        this._toggleShowStartTimes = this._toggleShowStartTimes.bind(this);
        this._toggleHideHrsOfSleep = this._toggleHideHrsOfSleep.bind(this);
        this._navigateToSounds = this._navigateToSounds.bind(this);
        this._toggleHideDisabledTasks = this._toggleHideDisabledTasks.bind(
            this
        );
        this._clearLabeledInput = this._clearLabeledInput.bind(this);
        this._willStartTaskMove = this._willStartTaskMove.bind(this);
        this._closeSnoozeTimePicker = this._closeSnoozeTimePicker.bind(this);
        this._saveSnoozeTime = this._saveSnoozeTime.bind(this);
        this._onReorderTasks = this._onReorderTasks.bind(this);
        this._didEndMove = this._didEndMove.bind(this);
        this._closeTaskRows = this._closeTaskRows.bind(this);
        this._onSnapTask = this._onSnapTask.bind(this);
        this._onDeleteTask = this._onDeleteTask.bind(this);
        this._calcStartTimes = this._calcStartTimes.bind(this);
        this._calculateHoursOfSleep = this._calculateHoursOfSleep.bind(this);
        this._calcWakeUpTime = this._calcWakeUpTime.bind(this);
        this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
        this._showDateTimePicker = this._showDateTimePicker.bind(this);
        this._onWakeTimePicked = this._onWakeTimePicked.bind(this);
        this._onArrivalTimePicked = this._onArrivalTimePicked.bind(this);
        this.saveSound = this.saveSound.bind(this);
        this._onPressClock = this._onPressClock.bind(this);
        this.onSnap = this.onSnap.bind(this);
        this.onCompleteGestureAnimation = this.onCompleteGestureAnimation.bind(
            this
        );
        this.onChangeTaskDuration = this.onChangeTaskDuration.bind(this);
        this.onChangeTaskEnabled = this.onChangeTaskEnabled.bind(this);
        this.onLabelInputFocus = this.onLabelInputFocus.bind(this);
        this.onLabelInputBlur = this.onLabelInputBlur.bind(this);
        this.onChangeLabel = this.onChangeLabel.bind(this);
        this._onPressTask = this._onPressTask.bind(this);
        this.onTaskListChanged = this.onTaskListChanged.bind(this);
        this._onPressAddTask = this._onPressAddTask.bind(this);
        this._willLeaveNavScreen = this._willLeaveNavScreen.bind(this);
        this._willShowNavScreen = this._willShowNavScreen.bind(this);
        this.handleBackPress = this.handleBackPress.bind(this);
        this.keyboardWillHide = this.keyboardWillHide.bind(this);
        this.keyboardWillShow = this.keyboardWillShow.bind(this);
        this._openSnoozeTimePicker = this._openSnoozeTimePicker.bind(this);
        this._snapToIdx = this._snapToIdx.bind(this);
        this._realm_snap_idx = this._realm_snap_idx.bind(this);
        this._setMenuState = this._setMenuState.bind(this);
        this.removeKeyboardListeners = this.removeKeyboardListeners.bind(this);
        this.addKeyboardListeners = this.addKeyboardListeners.bind(this);
    }

    componentWillUnmount() {
        // console.debug("AlarmDetail: componentWillUnmount");
        this.removeKeyboardListeners();
    }

    addKeyboardListeners() {
        // console.log("AlarmDetail: addKeyboardListeners");
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
        console.log("AlarmDetail  -- removeKeyboardListeners");
        if (this.keyboardWillShowSub) this.keyboardWillShowSub.remove();
        if (this.keyboardWillHideSub) this.keyboardWillHideSub.remove();
    }

    // OPTIMIZATION: Try moving content of this function to screen didFocus
    componentDidMount() {
        console.debug("AlarmDetail --- ComponentDidMount");
        // console.log("this.state.alarm", this.state.alarm);

        this.addKeyboardListeners();

        this._lastMeasuredView = "autocalc"; // set initial lastView to calcmode index

        this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");
        this._taskStartTimes = this._calcStartTimes();

        this.props.navigation.setParams({
            handleBackBtn: this.handleBackPress,
            menuIsOpen: false,
            setMenuState: this._setMenuState,
            openSnoozeTimePicker: this._openSnoozeTimePicker
        });

        AdvSvcOnScreenConstructed("AlarmDetail");
    }

    _setMenuState(nextMenuState, nextState) {
        if (nextMenuState == this.state.menuIsOpen) return;

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

    _realm_snap_idx() {
        // console.log("_realm_snap_idx");
        let { alarm } = this.state;
        switch (this._viewIdx) {
            case 0:
                this._snapPoints = this._ALL_SNAP_POINTS.slice(0, 2); // returns new array containing 0th and 1st elements
                alarm.mode = "normal";
                this.setState(this.state);
                break;
            case 1:
                alarm.mode = "autocalc";
                alarm.wakeUpTime = this._calcWakeUpTime();
                this._snapPoints = this._ALL_SNAP_POINTS;
                this._layoutAnimateToCalcMode({
                    taskListFullScreen: false,
                    activeTask: null // closes any Row showing DELETE btn
                });
                break;
            case 2:
                this._snapPoints = this._ALL_SNAP_POINTS.slice(1); // returns new array containing 1st element to end (2nd element)
                this._layoutAnimateToFullScreenTaskList({
                    taskListFullScreen: true,
                    activeTask: null // closes any Row showing DELETE btn
                });
                break;
        }
    }
    _tmpViewIdx = null;

    /**
     * Imperitively snaps main Interactable View to provided snap index, and updates
     * mode in DB as well as view tracking variables as required.
     *
     * Accepts a Snap Index within the range [0 - 2] inclusive, which includes all
     * possible snap-points. Since all snappoints may not currently be accessible,
     * depending on the current view, the provided idx will either be mapped to the current index
     * of the desired view, or the function will return if it is not accessible after mapping.
     * See large comment within the function for further explanation
     */
    _snapToIdx(idx) {
        console.log("_snapToIdx: ", idx);
        if (this.interactiveRef) {
            // console.log("this.interactiveRef", this.interactiveRef);
            /* Depending on what the current View is, we may need to map the passed-in snap index to currently accessible ones.
               Note that mapping only needs to be done when this is called while in TaskList view, but we need error checking in both
               NORMAL and TASKLIST views.

                 Examples
                    Current View   -     Accessible SnapPoints                 -    Passed in Idx    -    Mapped Index
                    NORMAL            [0: 'normal', 1: 'autocalc']                        0                     0
                    NORMAL            [0: 'normal', 1: 'autocalc']                        1                     1
                    NORMAL            [0: 'normal', 1: 'autocalc']                        2                   error
                    AUTOCALC     [0: 'normal', 1: 'autocalc', 2: 'tasklist']              0                     0
                    AUTOCALC     [0: 'normal', 1: 'autocalc', 2: 'tasklist']              1                     1
                    AUTOCALC     [0: 'normal', 1: 'autocalc', 2: 'tasklist']              2                     2
                    TASKLIST          [0: 'autocalc', 1: 'TaskList']                      0                   error
                    TASKLIST          [0: 'autocalc', 1: 'TaskList']                      1                     0
                    TASKLIST          [0: 'autocalc', 1: 'TaskList']                      2                     1
                 */
            let accessibleSnapIdx = idx;
            let currViewIdx = this._tmpViewIdx || this._viewIdx;
            this._viewIdx = idx;

            /* These handle cases where menu is used to enter NORMAL view from FullTaskList or vice versa */
            if (currViewIdx == 0 && idx == 2) {
                console.info(
                    `Invalid snap idx ${idx} for current mode (${currViewIdx})`
                );
                this._snapPoints = this._ALL_SNAP_POINTS;

                // Temporarily set viewIdx to 1 (autocalc) so that when this fx is called again it won't end up
                //  back in this if-else
                this._tmpViewIdx = 1;
                this.forceUpdate(() => this._snapToIdx(idx)); // force update to activate new snappoints, then CB is executed after update.
                return;
            } else if (currViewIdx == 2) {
                if (idx == 0) {
                    console.info(
                        `Invalid snap idx ${idx} for current mode (${currViewIdx})`
                    );
                    this._snapPoints = this._ALL_SNAP_POINTS;

                    // Temporarily set viewIdx to 1 (autocalc) so that when this fx is called again it won't end up
                    //  back in this if-else
                    this._tmpViewIdx = 1;

                    this.forceUpdate(() => this._snapToIdx(idx)); // force update to activate new snappoints, then CB is executed after update.
                    return;
                } else {
                    accessibleSnapIdx = idx - 1; // map index to current position of desired view
                }
            }

            this._tmpViewIdx = null;

            console.log(
                "Snapping to (of accessible indices): ",
                accessibleSnapIdx
            );
            this.interactiveRef.snapTo({ index: accessibleSnapIdx });
            realm.write(this._realm_snap_idx);
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
        this._setMenuState(0);
        this.setState({ showSnoozePicker: true });
    }

    _setInteractiveRef = el => (this.interactiveRef = el);

    startTimesRefs = [];

    setStartTimeRef = (el, index) => {
        console.log("startTimesRef - index", index);
        console.log("this.startTimesRefs.length", this.startTimesRefs.length);
        // console.log("this.startTimesRefs[index]", this.startTimesRefs[index]);
        if (this.startTimesRefs[index] !== undefined) {
            console.log("updated startTimesRef for idx (order): ", index);
            if (el != null) {
                this.startTimesRefs[index] = el;
            } /* else {
                console.warn("Element is null. Not overwriting ref with null");
            } */
        } else {
            this.startTimesRefs.push(el);
            console.log("added new startTimesRef for idx (order): ", index);
            // sanity check
            if (this.startTimesRefs.length != index + 1) {
                console.warn("SetStartTimeRef not working as expected");
            }
        }
        console.log("... done.");
    };

    keyboardWillShow(event) {
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
    }

    keyboardWillHide(event) {
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
    }

    /*
    //NOTE: This method DOES get called when you push 'Back' do go back to parent screen. However, no lifecycle
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
            let { alarm } = this.state;
            alarm.status = ALARM_STATES.SET;
            if (alarm.mode === "autocalc" && this._calculatedWakeUpTime) {
                alarm.wakeUpTime = DateUtils.date_to_nextTimeInstance(
                    this._calculatedWakeUpTime
                );
            } else {
                alarm.wakeUpTime = DateUtils.date_to_nextTimeInstance(
                    alarm.wakeUpTime
                );
            }
            realm.create("Alarm", alarm, true);
            // TODO: end

            // For Now, use this workaround //
            // let alarm = realm
            //     .objects("Alarm")
            //     .filtered(`id = "${this.state.alarm.id}"`);
            // if (alarm && alarm.length === 1) {
            //     // if (AlarmModel.isDefault(alarm[0])) {
            //     //     // Since this alarm has default settings, delete it before nav'ing back. User hasn't changed anything.
            //     //     realm.delete(alarm);
            //     // } else
            //     alarm[0].label = this.state.alarm.label;
            //     alarm[0].arrivalTime = DateUtils.date_to_nextTimeInstance(
            //         this.state.alarm.arrivalTime
            //     );
            //     alarm[0].status = ALARM_STATES.SET;
            //     alarm[0].alarmSound = this.state.alarm.alarmSound;
            //     if (
            //         this.state.alarm.mode === "autocalc" &&
            //         this._calculatedWakeUpTime
            //     ) {
            //         alarm[0].wakeUpTime = DateUtils.date_to_nextTimeInstance(
            //             this._calculatedWakeUpTime
            //         );
            //     } else {
            //         alarm[0].wakeUpTime = DateUtils.date_to_nextTimeInstance(
            //             this.state.alarm.wakeUpTime
            //         );
            //     }
            // }
            //////////////////////////////////
        });
        // this.props.navigation.setParams({ shouldReload: true });

        this.props.navigation.goBack();
        this.props.navigation.state.params.reloadAlarms(this.state.alarm.id);
        // setTimeout(() => {
        //     this.props.navigation.goBack();
        // }, 500);
    }

    _willShowNavScreen() {
        console.log("AlarmDetail: _willShowNavScreen");
        this.addKeyboardListeners();
    }

    _willLeaveNavScreen() {
        this.removeKeyboardListeners();
    }

    _onPressAddTask() {
        if (upgrades.pro != true) {
            //NOTE: 2. IAP-locked Feature - Tasks Limit
            //TODO: Display CKT-styled upgrade popup
            alert("Not available in free version (Placeholder)");
            return;
        }

        if (this.state.activeTask == null) {
            let nextTaskPosition = this.state.alarm.tasks.length;
            // console.log("passing position of new task: ", nextTaskPosition);
            this._willLeaveNavScreen();
            this.props.navigation.navigate("TaskDetail", {
                onSaveState: this.onTaskListChanged,
                willNavigateBack: this._willShowNavScreen,
                order: nextTaskPosition,
                transition: "collapseExpand"
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
    _onPressTask(task) {
        // console.debug("AlarmDetail: onPressTask -- task: ", task);

        if (this.state.activeTask == null) {
            // Need to use a workaround to delete the object, otherwise app will crash due to Realm bug when navigating after deleting passed Object:
            // Pass TaskAlarm ID instead of TaskAlarm object.
            this._willLeaveNavScreen();
            const params = {
                alarmTaskId: task.id,
                onSaveState: this.onTaskListChanged,
                willNavigateBack: this._willShowNavScreen,
                transition: "collapseExpand"
            };

            this.props.navigation.navigate("TaskDetail", params);
        } else {
            // simply snap the active task back to resting position
            this.setState({ activeTask: null });
        }
    }

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

    onChangeLabel(text) {
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
    }

    onLabelInputBlur(e) {
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
    }

    onLabelInputFocus() {
        console.info("Focusing label input");
        if (this.state.alarm.mode == "normal") {
            this.setState({ isEditingLabel: true });
        }
    }

    onChangeTaskEnabled(taskToUpdate, enabled) {
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
    }

    /* Callback from TaskItem for when duration-slider has been released.
        Two main responsibilites
        1. Update the specified task in DB with the new duration value (set from slider)
        2. Re-enable dragging of the main Interactable-View, as well as the TaskList child
            - This is done by setting isSlidingTask==false
    */
    onChangeTaskDuration(taskToUpdate, newDuration) {
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
    }

    onSnap(event) {
        console.info("onSnap");

        // let alarmState = this.state.alarm;
    }

    _onPressClock() {
        console.info("_onPressClock");
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
    }

    saveSound(sound) {
        // console.info("Sound changed: ", sound);
        // console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.alarmSound.sound = sound;
            alarm.alarmSound.type = sound.type; // for random sounds
        });
    }

    _onArrivalTimePicked(time) {
        console.info("Arrival Time input changed: ", time);
        // console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.arrivalTime = time;
            alarm.wakeUpTime = this._calcWakeUpTime();
        });
        this.setState(
            {
                alarm: alarm
            },
            () => this._calcStartTimes()
        );
    }

    _onWakeTimePicked(date) {
        console.info("A date has been picked: ", date);
        let { alarm } = this.state;

        let wakeUpDate = DateUtils.date_to_nextTimeInstance(date);

        realm.write(() => {
            alarm.wakeUpTime = wakeUpDate;
        });
        this._hideDateTimePicker();
    }

    _showDateTimePicker() {
        this.setState({ isDatePickerVisible: true });
    }

    _hideDateTimePicker() {
        this.setState({ isDatePickerVisible: false });
    }

    _calcWakeUpTime() {
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

        return this._calculatedWakeUpTime;
    }

    _calculateHoursOfSleep(wakeUpTime) {
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
    }

    _calcStartTimes(hideDisableTasks) {
        console.log("_calcStartTimes");
        let additiveMoment = moment(this.state.alarm.wakeUpTime);
        if (hideDisableTasks == null || hideDisableTasks == undefined) {
            hideDisableTasks = this.state.hideDisabledTasks;
        }

        if (this._cachedSortedTasks == null) {
            this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");
        }

        if (realm.isInTransaction) {
            this._cachedSortedTasks.forEach((task, idx) => {
                console.log("idx", idx);
                if (task.enabled == false) {
                    task.startTime = null;
                } else if (task.enabled == true) {
                    task.startTime = additiveMoment.format("h:mm A");
                    additiveMoment.add(task.duration, "seconds");
                }
                if (this.startTimesRefs[idx]) {
                    this.startTimesRefs[idx].setNativeProps({
                        text: task.startTime
                    });
                } /* else {
                    console.warn("StartTimesRef not found at index: ", idx);
                } */
            });
        } else {
            realm.write(() => {
                this._cachedSortedTasks.forEach((task, idx) => {
                    console.log("idx", idx);
                    if (task.enabled == false) {
                        task.startTime = null;
                    } else if (task.enabled == true) {
                        task.startTime = additiveMoment.format("h:mm A");
                        additiveMoment.add(task.duration, "seconds");
                    }
                    if (this.startTimesRefs[idx]) {
                        this.startTimesRefs[idx].setNativeProps({
                            text: task.startTime
                        });
                        // this.startTimesRefs[idx]._getText();
                    } /* else {
                        console.warn("StartTimesRef not found at index: ", idx);
                    } */
                });
            });
        }

        // console.log("this.state.alarm", this.state.alarm);
        // console.log("_cachedSortedTasks", this._cachedSortedTasks);
    }

    _onDeleteTask(data) {
        console.log("Deleting task");
        // console.log("data", data);
        // console.log("data.id", data.id);

        let alarmTaskRlmObject = realm.objectForPrimaryKey(
            "AlarmTask",
            data.id
        );

        // first update our startTimesRef array
        this.startTimesRefs.splice(alarmTaskRlmObject.order, 1);

        if (alarmTaskRlmObject) {
            realm.write(() => {
                realm.delete(alarmTaskRlmObject);

                // Update order of task list
                let { tasks } = this.state.alarm;

                // TODO: This line should not be necessary. See if commenting out breaks anything.
                // this._cachedSortedTasks = tasks.sorted("order");

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

    // _onPressEditTasks() {
    //     console.info("_onPressEditTasks");
    //     let editingTasks = !this.state.isEditingTasks;
    //     this.setState({ isEditingTasks: editingTasks });
    // }

    _closeTaskRows() {
        console.info("_closeTaskRows");
        this.setState({ activeTask: null });
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

        // TODO: I need to re-order startTimesRefs here, otherwise one will get overwritten in setStartTimeRef
        let temp = this.startTimesRefs.splice(from, 1)[0];
        this.startTimesRefs.splice(to, 0, temp);
        // FIXME: not working for some reason. An index is not found when setting refs after this, and startTime for moved row is not updated.
        //  I should make the startTimesRefs an array of objects instead so that I can figure out which ones are which easier.

        console.log("Just updated startTimesRefs order");
        // console.log("this.startTimesRefs", this.startTimesRefs);

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

        // this._cachedSortedTasks = this.state.alarm.tasks.sorted("order");

        // this._cachedSortedTasks = this.state.alarm.tasks.;

        this.setState({ disableDrag: false }, () => this._calcStartTimes());
    }

    _layoutAnimateToFullScreenTaskList(nextState = {}) {
        let config = {
            duration: 100,
            update: {
                duration: 100,
                type: "easeOut"
                // springDamping: 0.5,
                // property: "scaleXY"
            }
        };
        LayoutAnimation.configureNext(config);

        // This should be in TaskList full screen view

        console.log("Setting taskArea to LARGE");
        // first just set new height
        this.setState({
            taskAreaFlex: TASK_AREA_TL_VIEW_FLEX_FACTOR,
            taskHeaderFlex: TASK_HEAD_TL_VIEW_FLEX_FACTOR,
            taskListDimensions: this.tskListDimsTLView,
            ...nextState
        });
    }

    _layoutAnimateToCalcMode(nextState) {
        let config = {
            duration: 200,
            update: {
                duration: 200,
                type: "easeInEaseOut"
            }
        };
        LayoutAnimation.configureNext(config);

        console.log("Setting taskArea to small");
        // This should be in calc mode
        this.setState({
            taskAreaFlex: TASK_AREA_AUTO_VIEW_FLEX_FACTOR,
            taskHeaderFlex: TASK_HEAD_AUTO_VIEW_FLEX_FACTOR,
            taskListDimensions: this.tskListDimsAutoView,
            ...nextState
        });
    }

    _onPressAnimHandle() {
        // console.log("_onPressAnimHandle");
        // console.log("this.state.alarm.mode ", this.state.alarm.mode);
        let nextIdx = this.state.alarm.mode == "normal" ? 1 : 0;
        // if (this.state.alarm.mode == "normal") {
        //     // changing to Calc mode
        //     let newWakeUpTime = this._calcWakeUpTime();
        //     // alarmState.wakeUpTime = this._calcWakeUpTime();
        //     realm.write(() => {
        //         let { alarm } = this.state;

        //         if (newWakeUpTime) {
        //             alarm.wakeUpTime = newWakeUpTime;
        //         }
        //         Object.assign({ alarm: alarm }, nextState);
        //     });
        // }

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
                    this._snapPoints = this._ALL_SNAP_POINTS.slice(1); // returns new array containing 1st element to end (2nd element)
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

                this._snapPoints =
                    this._viewIdx == 1
                        ? this._ALL_SNAP_POINTS
                        : this._ALL_SNAP_POINTS.slice(0, 2);

                this._layoutAnimateToCalcMode(nextState);
            }
        }
    }

    _saveSnoozeTime(value) {
        realm.write(() => {
            let { alarm } = this.state;
            alarm.snoozeTime = value[0];
        });
        this.setState({ showSnoozePicker: false });
    }

    _closeSnoozeTimePicker() {
        this.setState({ showSnoozePicker: false });
    }

    _willStartTaskMove() {
        this.setState({ disableDrag: true });
    }

    // onScrollTaskList = nativeEvent => {
    //     console.log("scroll event", nativeEvent);
    //     console.log("this", this.constructor.name);
    //     this._taskListScrollPos = nativeEvent.contentOffset.y;
    //     console.log("this._taskListScrollPos ", this._taskListScrollPos);
    // };

    // onEndReachedTaskList() {
    //     console.log("onEndReachedTaskList");
    //     this._taskListAtEnd = true;
    // };

    onCompleteGestureAnimation() {
        this.setState({
            durationsVisible: !this.state.durationsVisible
        });
    }

    _clearLabeledInput() {
        this.alarmLabelCache = "";
        // we are faking a 'blur' event here, so that the cache change is saved to DB and state is updated.
        this.onLabelInputBlur();
    }

    _toggleHideDisabledTasks() {
        this.setState({
            hideDisabledTasks: !this.state.hideDisabledTasks
        });
    }

    _navigateToSounds() {
        this.props.navigation.navigate("Sounds", {
            saveSound: this.saveSound,
            currSound: this.state.alarm.alarmSound
        });
    }

    _toggleHideHrsOfSleep() {
        realm.write(() => {
            let { alarm } = this.state;
            alarm.showHrsOfSleep = !alarm.showHrsOfSleep;
        });
        this._setMenuState(0);
    }

    _toggleShowStartTimes() {
        // realm.write(() => {
        //     let { alarm } = this.state;
        //     alarm.showHrsOfSleep = !alarm.showHrsOfSleep;
        // });
        // this._setMenuState(0);
        let nextState = {
            durationsVisible: !this.state.durationsVisible
        };
        this._setMenuState(0, nextState);
    }

    _onSelectViewFromMenu(idx) {
        // console.log("Pressed fancy radio: ", idx);
        this._snapToIdx(idx);
        // this._snapToIdx(idx);1
    }

    // taskRowsY = [];
    ROW_HEIGHT = 55;
    ROW_WIDTH = SCREEN_WIDTH + 90 - scaleByFactor(20, 0.4);
    _getMeasurementsForTaskRow(idx) {
        // y measurement needs to add all of...:
        // 1. NAV HEADER HEIGHT
        // 2. TASKLIST HEADER HEIGHT --- (SCREEN_HEIGHT * 1.15) * this.state.taskAreaFlex * this.state.taskHeaderFlex
        //                                NonClockArea Height   *     taskAreaFlex        *      taskHeaderFlex
        // 3. FullTaskList (0px) OR AutoCalc (??) mode.
        // 4. idx * TaskItem_height
        let tasksHeaderHeight =
            SCREEN_HEIGHT *
            NON_CLOCK_HEIGHT_FACTOR *
            this.state.taskAreaFlex *
            this.state.taskHeaderFlex;
        let clockHeight = this._viewIdx == 2 ? 0 : SCREEN_HEIGHT * 0.4;
        console.log("Header.HEIGHT", Header.HEIGHT);
        console.log("tasksHeaderHeight", tasksHeaderHeight);
        console.log("idx * this.ROW_HEIGHT", idx * this.ROW_HEIGHT);
        let y =
            Header.HEIGHT +
            tasksHeaderHeight +
            clockHeight +
            idx * this.ROW_HEIGHT;
        console.log("y ", y);
        return { x: 0, y: y, width: this.ROW_WIDTH, height: this.ROW_HEIGHT };
    }

    render() {
        console.info("AlarmDetail render ");
        // console.debug("AlarmDetail render - this.state: ", this.state);
        // console.log("this._snapPoints");
        // for (let index = 0; index < this._snapPoints.length; index++) {
        //     console.log(index, this._snapPoints[index].id);
        // }
        // OPTIMIZATION: Replace redundant String-equality checks with a single one, and save a boolean
        //               or enumeration (number) flag
        //               or even better, create a Map of mode name <--> Enumeration value, then here at
        //                 the start of each render, use the map to get the ENUM numerical value of the
        //                 current mode.

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
            clockAndLabelTranslation = this.normModeCLTranslation;
        } else {
            console.info("CALC MODE");
            clockAndLabelTranslation = this.calcModeCLTranslation;
        }

        let sortedTasks = this._cachedSortedTasks;

        console.log("AlarmDetail: this._viewIdx", this._viewIdx);

        // let taskArea = null;
        // if (sortedTasks.length == 0) {
        //     taskArea = (
        //         <TouchableOpacity
        //             style={{
        //                 flex: 1
        //             }}
        //             onPress={this._onPressAddTask}
        //         >
        //             <View
        //                 style={{
        //                     flex: 1,
        //                     flexDirection: "column",
        //                     justifyContent: "center"
        //                 }}
        //             >
        //                 <View
        //                     style={{
        //                         alignSelf: "center",
        //                         justifyContent: "center",
        //                         position: "absolute",
        //                         top: SCREEN_HEIGHT * 0.12,
        //                         // borderColor: "black",
        //                         // borderWidth: 0.5,
        //                         backgroundColor: "#191966",
        //                         padding: 12,
        //                         borderRadius: 7,
        //                         shadowOffset: {
        //                             height: 2,
        //                             width: 0
        //                         },
        //                         shadowOpacity: 0.5,
        //                         shadowRadius: 2,
        //                         elevation: 3,
        //                         shadowColor: "black",
        //                         zIndex: 999
        //                     }}
        //                 >
        //                     <Text style={{ color: "#FFFFFF" }}>ADD TASKS</Text>
        //                 </View>
        //             </View>
        //         </TouchableOpacity>
        //     );
        // } else {
        // console.log("Passing new list of tasks to TaskList");
        let forceRemeasure = this._taskListNeedsRemeasure;
        this._taskListNeedsRemeasure = false;

        // console.log("forceRemeasure?", forceRemeasure);

        let wakeUpTime = this.state.alarm.wakeUpTime;
        // console.log("this.state.alarm.mode", this.state.alarm.mode);
        // if (this.state.alarm.mode == "autocalc") {
        //     wakeUpTime = this._calcWakeUpTime();
        // } else {
        //     wakeUpTime = this.state.alarm.wakeUpTime;
        // }

        // OPTIMIZATION: Don't format these on every render. Save them in State along with the Alarm
        //                 whenever relevant parameters change.
        let wakeTimeMoment = moment.utc(wakeUpTime).local();
        let fWakeUpTime = wakeTimeMoment.format("h:mm");
        let amPmWakeUpTime = wakeTimeMoment.format("A");

        // let interactableRef

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
                    onPress={this._closeTaskRows}
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

        let labelForceVisible = null;

        let mode = this.state.alarm.mode;

        return (
            <ScrollView
                contentContainerStyle={styles.screenContainer}
                keyboardShouldPersistTaps={"handled"}
                scrollEnabled={false}
            >
                <View style={{ width: SCREEN_WIDTH, height: 200 }} />
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
                    source={{ uri: "clockbgd_v8_iphone_se5678" }}
                />
                {touchableBackdrop}
                <Interactable.View
                    ref={this._setInteractiveRef}
                    style={[
                        styles.animatedView,
                        {
                            width: SCREEN_WIDTH,
                            backgroundColor: "transparent"
                            // backgroundColor: "#456729"
                        }
                    ]}
                    verticalOnly={true}
                    snapPoints={this._snapPoints}
                    animatedValueY={this._clockTransform}
                    // onSnap={this.onSnap.bind(this)}
                    // initialPosition={{ y: initInterPosition }}
                    dragEnabled={!this.state.disableDrag}
                    boundaries={{
                        top: -SCREEN_HEIGHT * 0.45, // 0.7 before
                        bottom: this.snapNormal * NON_CLOCK_HEIGHT_FACTOR,
                        bounce: 0.3
                    }}
                    dragWithSpring={
                        mode == "normal"
                            ? { tension: 1200, damping: 0.5 }
                            : { tension: 1500, damping: 0.5 }
                    }
                    // dragWithSpring={{ tension: 200, damping: 0.5 }}
                    // frictionAreas={[
                    //     { damping: 0.0, influenceArea: { right: 0 } }
                    // ]}
                    animatedNativeDriver={true}
                    onDrag={this._onDragInteractable}
                    initialPosition={{
                        y: mode == "normal" ? this.snapNormal : this.snapAuto
                    }}
                    // onStartShouldSetResponderCapture={({ nativeEvent }) => {
                    //     // this._dragStartPos = nativeEvent.pageY;
                    //     return true;
                    // }}
                    // onMoveShouldSetResponderCapture={({ nativeEvent }) => {
                    //     console.log(
                    //         "Interactable.View: onMoveShouldSetResponderCapture"
                    //     );
                    //     console.log(
                    //         "Scroll position is <= 0",
                    //         this._taskListScrollPos
                    //     );
                    //     return true;
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
                            onPress={this._onPressClock}
                            style={{
                                alignSelf: "stretch",
                                alignContent: "center",
                                justifyContent: "center",
                                backgroundColor: "transparent",
                                flex: 0.65
                            }}
                            // hitSlop={{ top: 15, bottom: 15 }}
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
                                color: Colors.brandMidOpp,
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
                    <this.AnimatedHandle
                        // ref={elem => (this._animHandle = elem)}
                        style={{
                            position: "absolute",
                            left:
                                SCREEN_WIDTH / 2 -
                                scaleByFactor(28, 0.5) / 2 -
                                30, // padding (30 left + 30 right / 2 == 30)
                            top: 0,
                            backgroundColor: "transparent",
                            // backgroundColor: "blue",
                            paddingHorizontal: 30,
                            paddingVertical: 30,
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
                                                0,
                                                this.snapNormal * 1.4,
                                                this.snapNormal * 0.72
                                            ]
                                        }
                                    )
                                }
                            ],
                            opacity: this._clockTransform.interpolate({
                                inputRange: [
                                    this.snapTaskList,
                                    this.snapAuto,
                                    this.snapNormal
                                ],
                                outputRange: [0, 0, 1]
                            })
                        }}
                        onPress={this._onPressAnimHandle}
                    >
                        <MaterialComIcon
                            name="arrow-up-drop-circle-outline" //upcircle ("AntDesign")
                            size={scaleByFactor(28, 0.5)}
                            color={Colors.brandMidOpp}
                        />
                    </this.AnimatedHandle>
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
                        <View
                            style={[
                                styles.fieldsContainer
                                // {backgroundColor: "blue"}
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
                                    fontSize: scaleByFactor(32, 0.5),
                                    color: Colors.brandLightGrey
                                }}
                                flex={0.5}
                                autoResize={false}
                                numberOfLines={1}
                                multiline={false}
                                clearButton={
                                    <TouchableOpacity
                                        onPress={this._clearLabeledInput}
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
                                                color={Colors.brandMidOpp}
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
                        <Animated.View
                            style={[
                                styles.taskListContainer,
                                {
                                    flex: 1,
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
                                                        0,
                                                        0,
                                                        -this.snapNormal * 0.3
                                                    ]
                                                }
                                            )
                                        }
                                    ]
                                    // backgroundColor: "blue"
                                }
                            ]}
                        >
                            <View style={{ flex: this.state.taskAreaFlex }}>
                                <View
                                    style={[
                                        styles.taskListHeader,
                                        {
                                            // flex: this.state.taskHeaderFlex, // == (SCREEN_HEIGHT * NON_CLOCK_HEIGHT_FACTOR) * this.state.taskAreaFlex * this.state.taskHeaderFlex
                                            height: scaleByFactor(50, 0.6), // needs to be scaled to screen height
                                            backgroundColor: "transparent",
                                            // backgroundColor: "green",
                                            borderBottomColor:
                                                Colors.brandLightOpp,
                                            borderBottomWidth: 0.8
                                        }
                                    ]}
                                >
                                    <TouchableOpacity
                                        // onPress={() => this.interactiveRef.snapTo({ index: 2 })}>
                                        onPress={this._onPressTasksHeader}
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
                                                    fontSize: scaleByFactor(
                                                        19,
                                                        0.3
                                                    ),
                                                    color: Colors.brandLightOpp
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
                                            paddingLeft: 10,
                                            backgroundColor: "transparent"
                                            // backgroundColor: "green"
                                        }}
                                        onPress={this._onPressAddTask}
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
                                            color={Colors.brandMidOpp}
                                        />
                                        {/* {editTasksBtn} */}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            alignSelf: "stretch",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingLeft: 25,
                                            paddingRight: 10,
                                            backgroundColor: "transparent"
                                            // backgroundColor: "green"
                                        }}
                                        onPress={this._toggleHideDisabledTasks}
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
                                                color={Colors.brandMidOpp}
                                            />
                                        ) : (
                                            <EntypoIcon
                                                name="eye"
                                                size={scaleByFactor(26, 0.2)}
                                                // color="#7a7677"
                                                color={Colors.brandMidOpp}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {touchableBackdrop}
                                {/* {taskArea} */}
                                {sortedTasks.length > 0 ? (
                                    <TaskList
                                        onPressItem={this._onPressTask}
                                        onPressItemCheckBox={
                                            this.onChangeTaskEnabled
                                        }
                                        onChangeTaskDuration={
                                            this.onChangeTaskDuration
                                        }
                                        onPressDelete={this._onDeleteTask}
                                        // onShowDurationSlider={() =>
                                        //     this.setState({ isSlidingTask: true })
                                        // }
                                        onSnapTask={this._onSnapTask}
                                        data={sortedTasks}
                                        activeTask={this.state.activeTask}
                                        closeTaskRows={this._closeTaskRows}
                                        isEditingTasks={
                                            this.state.isEditingTasks
                                        }
                                        isSlidingTask={this.state.isSlidingTask}
                                        didEndMove={this._didEndMove}
                                        onReorderTasks={this._onReorderTasks}
                                        willStartMove={this._willStartTaskMove}
                                        forceRemeasure={forceRemeasure} // TODO: is this prop event required anymore?
                                        hideDisabledTasks={
                                            this.state.hideDisabledTasks
                                        }
                                        containerDimensions={
                                            this.state.taskListDimensions
                                        }
                                        taskRowDimensions={
                                            this._getMeasurementsForTaskRow
                                        }
                                        startTimesAnim={
                                            this.startTimesHandleAnim
                                        }
                                        durationsVisible={
                                            this.state.durationsVisible
                                        }
                                        setStartTimeRef={this.setStartTimeRef}
                                        // onScroll={this.onScrollTaskList.bind(this)}
                                        // onEndReached={this.onEndReachedTaskList.bind(this)}
                                        // tlContainerStyle={{
                                        //     paddingHorizontal: scaleByFactor(10, 0.4)
                                        // }}
                                    />
                                ) : (
                                    <ActivityIndicator style={{ flex: 1 }} />
                                )}

                                {isIphoneX() ? (
                                    <View
                                        style={{
                                            height: 34 // height of bottom safe area in Portrait mode
                                            // backgroundColor: "green"
                                        }}
                                    />
                                ) : null}
                                <Animated.Image
                                    style={{
                                        height: 61.5,
                                        width: 6,
                                        position: "absolute",
                                        right: -8,
                                        transform: [
                                            {
                                                scaleX: this.startTimesHandleAnim.interpolate(
                                                    {
                                                        inputRange: [
                                                            -230,
                                                            -115,
                                                            0
                                                        ],
                                                        outputRange: [1, 3, 1]
                                                    }
                                                )
                                            }
                                        ],
                                        top: this._viewIdx == 2 ? 247.5 : 137.5 // Height of 2.5 task-items
                                    }}
                                    source={require("../img/Indicator_StartTimesV1.png")}
                                />
                                <EdgeSwiper
                                    animValue={this.startTimesHandleAnim}
                                    onAnimComplete={
                                        this.onCompleteGestureAnimation
                                    }
                                />
                            </View>
                        </Animated.View>
                        {/* </View> */}
                        <TouchableOpacity
                            style={{
                                position: "absolute",
                                alignSelf: "center",
                                alignContent: "flex-start",
                                alignItems: "flex-start",
                                // top: SCREEN_HEIGHT * 1.159,
                                top: 0,
                                backgroundColor: "transparent",
                                // backgroundColor: "blue",
                                paddingHorizontal: 30,
                                paddingTop: 0,
                                paddingBottom: 7
                            }}
                            onPress={this._onPressAnimHandle}
                        >
                            <FAIcon
                                name="minus"
                                size={scaleByFactor(25, 0.5)}
                                color={Colors.brandMidOpp}
                            />
                        </TouchableOpacity>
                    </View>
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
                        onPress={this._navigateToSounds}
                        style={{
                            padding: scaleByFactor(20, 0.6)
                        }}
                    >
                        <FAIcon
                            name="music"
                            size={scaleByFactor(23, 0.4)}
                            // color="#ECECEC"
                            // color={Colors.brandOffWhiteBlue}
                            color={Colors.brandLightGrey}
                            // color="#10ac84"
                            iconStyle={{
                                color: "blue"
                            }}
                        />
                    </TouchableOpacity>
                </Animated.View>
                {!this.state.showSnoozePicker && fullScreenTouchableBackdrop}
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
                                color={Colors.brandMidPurple}
                            />
                        }
                        center="Snooze Time"
                        right={
                            <Text
                                style={{
                                    fontFamily: "Quesha",
                                    fontSize: 22,
                                    color: Colors.labelText
                                }}
                            >{`${this.state.alarm.snoozeTime} min`}</Text>
                        }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={this._openSnoozeTimePicker}
                    />
                    <MenuItem
                        left={
                            <EntypoIcon
                                size={25}
                                name="moon"
                                color={Colors.brandMidPurple}
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
                        onPressItem={this._toggleHideHrsOfSleep}
                    />
                    <MenuItem
                        left={
                            this.state.durationsVisible ? (
                                <MaterialComIcon
                                    size={25}
                                    name="timetable"
                                    color={Colors.brandMidPurple}
                                />
                            ) : (
                                <EntypoIcon
                                    size={25}
                                    name="time-slot"
                                    color={Colors.brandMidPurple}
                                />
                            )
                        }
                        centerRight={
                            <Text
                                style={{
                                    marginTop: 5,
                                    color: Colors.darkGreyText,
                                    fontFamily: "Gurmukhi MN"
                                }}
                            >
                                {this.state.durationsVisible
                                    ? "Show Task Start Times"
                                    : "Show Task Durations"}
                            </Text>
                        }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={this._toggleShowStartTimes}
                    />
                    <MenuItem
                        left={
                            <MaterialComIcon
                                name="view-dashboard-variant"
                                size={25}
                                color={Colors.brandMidPurple}
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
                                onSelect={this._onSelectViewFromMenu}
                                // style={{ flex: 0.75 }}
                            />
                        }
                        showSeparator={false}
                    />
                </Animated.View>
                {/* Measuring line -- dev view to measure whether views are aligned properly */}
                {/* <View
                    style={{
                        position: "absolute",
                        // use this for a horizontal line
                        // left: 0,
                        // right: 0,
                        // top: 64,
                        // height: 2,

                        // use this for a vertical line
                        alignSelf: "center",
                        width: 1,
                        top: 0,
                        bottom: 0,
                        backgroundColor: "red"
                    }}
                /> */}
                {this.state.isDatePickerVisible && (
                    <DateTimePicker
                        date={moment
                            .utc(this.state.alarm.wakeUpTime)
                            .local()
                            .toDate()} // time has been converted into a Date() for this Component
                        mode={"time"}
                        titleIOS={"Set Wake-Up Time"}
                        isVisible={true}
                        onConfirm={this._onWakeTimePicked}
                        onCancel={this._hideDateTimePicker}
                    />
                )}
                {this.state.showSnoozePicker && (
                    <PickerActionSheet
                        initialValues={[this.state.alarm.snoozeTime]}
                        onValueSelected={this._saveSnoozeTime}
                        onPressedCancel={this._closeSnoozeTimePicker}
                        dataSets={[snoozeTimeOptions]}
                        dataLabels={["minutes"]}
                        title={"Snooze Time"}
                    />
                )}
            </ScrollView>
        );
    }
}

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
        // backgroundColor: "purple",
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
        height: SCREEN_HEIGHT * NON_CLOCK_HEIGHT_FACTOR,
        top: SCREEN_HEIGHT * 0.9,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        // backgroundColor: Colors.backgroundGrey
        backgroundColor: Colors.brandDarkGrey
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
        flex: FIELDS_AREA_FLEX_FACTOR,
        // minHeight: 55,
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
        // backgroundColor: Colors.backgroundLightGrey,
        backgroundColor: Colors.brandMidGrey,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowColor: "black",
        shadowOffset: {
            height: 0,
            width: 0
        },
        elevation: 12
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
        // color: Colors.brandOffWhiteBlue,
        color: Colors.brandLightOpp,
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
