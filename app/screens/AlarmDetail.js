/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    Image,
    Animated,
    TouchableWithoutFeedback,
    Keyboard,
    TextInput
} from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Interactable from "react-native-interactable";
import DateTimePicker from "react-native-modal-datetime-picker";
// import KeyframesView from "react-native-facebook-keyframes";
import { isIphoneX } from "react-native-iphone-x-helper";
import LinearGradient from "react-native-linear-gradient";

import moment from "moment";

import realm from "../data/DataSchemas";
import TaskList from "../components/task-list";
import LabeledInput from "../components/labeled-input";
import LabeledTimeInput from "../components/labeled-time-input";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
class AlarmDetail extends Component {
    static navigationOptions = () => ({
        title: "Edit Alarm"
    });

    _calculatedWakeUpTime;
    alarmLabelCache;

    width = SCREEN_WIDTH; //full width
    height = SCREEN_HEIGHT; //full height
    snapAuto = 0;
    snapNormal = SCREEN_HEIGHT;

    xtraKeyboardHeight = 0; // this is always 0, except on iPhone X it is 34

    AnimatedAlarmLabel = Animated.createAnimatedComponent(TextInput);
    AnimatedHandle = Animated.createAnimatedComponent(MaterialIcon);

    _clockTransform = new Animated.Value(0);
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

            realm.write(() => {
                this.state = {
                    alarm: realm.create("Alarm", new AlarmModel(alarmsCount)),
                    isDatePickerVisible: false,
                    animationDuration: 3000,
                    activeTask: null, // holds the task ID of the task currently showing DELETE button. Otherwise null.
                    isEditingTasks: false, // indicates whether tasks are currently moveable.
                    isEditingLabel: false, // indicates whether Label is being edited. Need to move Input when keyboard shows.
                    keyboardHeight: null,
                    isSlidingTask: false
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
                isSlidingTask: false
            };
        }

        this._setAnimatedViewRef = this._setAnimatedViewRef.bind(this);

        this.alarmLabelCache = this.state.alarm.label;
        // if (this.state.alarm.mode == "normal") {
        //     setTimeout(() => {
        //         this.interactiveRef.snapTo({ index: 1 });
        //     }, 0);
        // }

        // setTimeout(() => {
        //     this._animatedView.animate(this.state.animationDuration);
        // }, 0);

        console.log(this.state);
        console.log(params);
    }

    // componentDidMount() {
    // }

    componentWillMount() {
        console.log("AlarmDetail: componentWillMount");
        this.addKeyboardListeners();
    }

    componentWillUnmount() {
        console.debug("AlarmDetail: componentWillUnmount");
        this.removeKeyboardListeners();
    }

    addKeyboardListeners() {
        this.keyboardWillShowSub = Keyboard.addListener(
            "keyboardDidShow",
            this.keyboardWillShow.bind(this)
        );
        this.keyboardWillHideSub = Keyboard.addListener(
            "keyboardDidHide",
            this.keyboardWillHide.bind(this)
        );
    }

    removeKeyboardListeners() {
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    componentDidMount() {
        // console.debug("AlarmDetail --- ComponentDidMount");
        this.props.navigation.setParams({
            handleBackBtn: this.handleBackPress.bind(this)
        });
    }

    _setAnimatedViewRef(ref) {
        this._animatedView = ref;
    }

    keyboardWillShow = event => {
        console.log("keyboardWillShow -------");
        console.log(event.endCoordinates);
        console.log(SCREEN_HEIGHT);
        this.setState({ keyboardHeight: event.endCoordinates.height });
        if (this.state.alarm.mode == "normal") {
            setTimeout(() => {
                this.interactiveRef.snapTo({ index: 2 }); // snap to "keyboard" snapPoint.
            }, 0);
        }
    };

    keyboardWillHide = event => {
        console.log("keyboardWillHide");
        let { mode } = this.state.alarm;
        let modeInt = mode == "autocalc" ? 0 : 1;
        setTimeout(() => {
            this.interactiveRef.snapTo({ index: modeInt });
            this.setState({ keyboardHeight: null, isEditingLabel: false });
        }, 0);
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
                if (AlarmModel.isDefault(alarm[0])) {
                    // Since this alarm has default settings, delete it before nav'ing back. User hasn't changed anything.
                    realm.delete(alarm);
                } else {
                    alarm[0].label = this.state.alarm.label;
                    alarm[0].arrivalTime = this.state.alarm.arrivalTime;
                    alarm[0].enabled = true;
                    if (
                        this.state.alarm.mode === "autocalc" &&
                        this._calculatedWakeUpTime
                    ) {
                        alarm[0].wakeUpTime = this._calculatedWakeUpTime;
                    } else {
                        alarm[0].wakeUpTime = this.state.alarm.wakeUpTime;
                    }
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

    onPressAddTask() {
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
            // re-calculated wake-up time either way, since existing task duration may have been changed
            alarm.wakeUpTime = this._calcWakeUpTime();
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
        console.log("Label text changed: ", text);
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
        console.info("onChangeTaskEnabled");
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
            taskToChange.enabled = !enabled;
            alarm.wakeUpTime = this._calcWakeUpTime();
        });
        this.setState({ tasks: tasks });
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
            console.log("newDuration", newDuration);
            taskToChange.duration = newDuration;
            alarm.wakeUpTime = this._calcWakeUpTime();
        });
        this.setState({ tasks: tasks, isSlidingTask: false });
        // this.onTaskListChanged();
    };

    onSnap = event => {
        console.info("onSnap");
        let alarmState = this.state.alarm;
        let snapId = event.nativeEvent.id;
        // console.log("snapId", snapId);
        // console.log("alarmState", alarmState);
        if (snapId != alarmState.mode && snapId != "keyboard") {
            realm.write(() => {
                if (event.nativeEvent.id == "normal") {
                    alarmState.mode = "normal";
                } else if (event.nativeEvent.id == "autocalc") {
                    alarmState.mode = "autocalc";
                    // Re-calculate
                    alarmState.wakeUpTime = this._calcWakeUpTime();
                }
                this.setState({ alarm: alarmState });
            });
        }
    };

    onPressClock = ref => {
        console.info("onPressClock");
        if (this.state.activeTask == null) {
            if (this.state.alarm.mode == "autocalc") {
                this.interactiveRef.snapTo({ index: 1 });
            }
            this._showDateTimePicker();
        } else {
            // simply snap the active task back to resting position
            this.setState({ activeTask: null });
        }
    };

    saveSound = sound => {
        console.info("Sound changed: ", sound);
        // console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.sound = sound;
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
        console.log(
            "Calculating wakeuptime with arrival time: " +
                this.state.alarm.arrivalTime
        );
        let totalTaskDurations = this.state.alarm.tasks
            .map(alarmTask => {
                // console.log("mapping: ");
                // console.log(alarmTask);
                if (alarmTask.enabled) {
                    console.log("Task enabled");
                    return alarmTask.duration;
                } else {
                    console.log("Task DISabled");
                    return 0;
                }
            })
            .reduce((a, b) => a + b, 0);
        totalTaskDurations *= 1000;
        // console.log(totalTaskDurations);

        // save calculated wakeUpTime to use for saving to DB when user presses back
        let epochSec = this.state.alarm.arrivalTime - totalTaskDurations;

        this._calculatedWakeUpTime = new Date(epochSec);

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

    _onDeleteTask(data) {
        console.log("Deleting task");
        console.log("data", data);
        console.log("data.id", data.id);

        let alarmTaskRlmObject = realm.objectForPrimaryKey(
            "AlarmTask",
            data.id
        );
        if (alarmTaskRlmObject) {
            realm.write(() => {
                realm.delete(alarmTaskRlmObject);

                // Update order of task list
                let { tasks } = this.state.alarm;
                console.log("Deleted task. --> Now Tasks:", tasks);
                let idx = 0;
                for (var taskId in tasks) {
                    if (tasks.hasOwnProperty(taskId)) {
                        if (idx == tasks[taskId].order) {
                            console.log(tasks[taskId]);
                            console.log("-----> Order OK");
                        } else {
                            console.log(tasks[taskId]);
                            console.log("-----> Order WRong. Decrementing...");
                            tasks[taskId].order--;
                        }
                    }
                    idx++;
                }
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

    _onReorderTasks(aTasks, aTaskId, from, to, anotherArg) {
        console.info("_onReorderTasks");
        // console.info("aTaskId", aTaskId);
        // console.info("from", from);
        // console.info("to", to);
        // console.log("anotherArg", anotherArg);

        console.log("aTasks", aTasks);
        aTasks = aTasks.sort((t1, t2) => t1.order > t2.order);
        realm.write(() => {
            aTasks[from].order = to;

            if (from < to) {
                for (let i = from + 1; i <= to; i++) {
                    aTasks[i].order--;
                }
            } else {
                for (let i = from - 1; i >= to; i--) {
                    aTasks[i].order++;
                }
            }
        });

        this.setState(this.state);
    }

    render() {
        console.info("AlarmDetail render ");
        // console.debug("AlarmDetail render - this.state: ", this.state);
        let imageHeight = this.height + 30;
        let initInterPosition, initClockPosition, initHandlePosition;

        if (this.state.alarm.mode == "normal") {
            console.info("NORMAL MODE ");
            initInterPosition = 450;
            initClockPosition = 210;
            initHandlePosition = 160;
        } else {
            console.info("CALC MODE ");
            initInterPosition = 0;
            initClockPosition = 0;
            initHandlePosition = 120;
        }

        /* I hope this means: If either isEditingTasks or isSlidingTask is true, set
            disableDrag to true. Otherwise, set disableDrag to false (if both are false)*/
        let disableDrag = this.state.isEditingTasks || this.state.isSlidingTask;

        // Assign tasks to 'sortedTasks', first ordering them if there are >1
        let sortedTasks =
            this.state.alarm.tasks.length > 1
                ? this.state.alarm.tasks.sorted("order")
                : this.state.alarm.tasks;

        console.log("sortedTasks", sortedTasks);
        // let sortedTasks = [];
        // for (let id in sortedTasksRealm) {
        //     sortedTasks.push(sortedTasksRealm[id]);
        // }

        let taskArea = null;
        if (sortedTasks.length == 0) {
            taskArea = (
                <TouchableOpacity
                    style={{
                        flex: 1
                    }}
                    onPress={this.onPressAddTask.bind(this)}
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
                                backgroundColor: "#603b91",
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
            console.log("Passing new list of tasks to TaskList");
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
                    isSlidingTask={disableDrag}
                    onReorderTasks={this._onReorderTasks.bind(this)}
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

        let touchableBackdrop = null;
        if (this.state.activeTask != null) {
            touchableBackdrop = (
                <TouchableBackdrop
                    style={{
                        width: this.width,
                        height: this.height
                    }}
                    onPress={() => {
                        // console.log(
                        //     "Pressed touchable without feedback"
                        // );
                        this._closeTaskRows();
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
                <Text
                    style={{ color: "blue", fontSize: scaleByFactor(15, 0.15) }}
                >
                    DONE
                </Text>
            );
        }

        let snapPoints = [
            { y: this.snapAuto, id: "autocalc" },
            { y: this.snapNormal, id: "normal" }
        ];

        let labelForceVisible = null;
        let handleForceHide = null;

        if (this.state.isEditingLabel && this.state.keyboardHeight) {
            snapPoints.push({
                y:
                    SCREEN_HEIGHT -
                    this.state.keyboardHeight -
                    50 -
                    this.xtraKeyboardHeight,
                id: "keyboard"
            });
            labelForceVisible = { opacity: 1 };
            handleForceHide = { opacity: 0 };
        }

        let hoursOfSleep = this._calculateHoursOfSleep(wakeUpTime);

        return (
            <View style={styles.screenContainer}>
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
                                                -this.height,
                                                this.height
                                            ],
                                            outputRange: [0, this.height / 30]
                                        }
                                    )
                                }
                            ]
                        }
                    ]}
                    source={require("../img/ClockBgd_v5.png")}
                />

                {touchableBackdrop}
                <Interactable.View
                    ref={interactableRef}
                    style={[
                        styles.animatedView,
                        {
                            width: this.width,
                            // backgroundColor: "#456729"
                            backgroundColor: "transparent"
                        }
                    ]}
                    verticalOnly={true}
                    snapPoints={snapPoints}
                    animatedValueY={this._clockTransform}
                    onSnap={this.onSnap.bind(this)}
                    // initialPosition={{ y: initInterPosition }}
                    dragEnabled={!disableDrag}
                    boundaries={{
                        top: -this.height * 0.1,
                        bottom: this.snapNormal * 1.15,
                        bounce: 0.3
                    }}
                    // dragWithSpring={{ tension: 200, damping: 0.5 }}
                    // frictionAreas={[
                    //     { damping: 0.0, influenceArea: { right: 0 } }
                    // ]}
                    animatedNativeDriver={true}
                >
                    {/* This is the animated wrapper for the CLOCK display, and the label shown in Normal */}
                    <Animated.View
                        style={[
                            styles.clockContainer,
                            {
                                transform: [
                                    {
                                        translateY: this._clockTransform.interpolate(
                                            {
                                                inputRange: [
                                                    this.snapAuto,
                                                    this.snapNormal
                                                ],
                                                outputRange: [
                                                    this.height,
                                                    this.height * 0.3
                                                ]
                                            }
                                        )
                                    },
                                    {
                                        scale: this._clockTransform.interpolate(
                                            {
                                                inputRange: [
                                                    this.snapAuto -
                                                        this.height * 0.2,
                                                    this.snapAuto,
                                                    this.snapNormal,
                                                    this.snapNormal +
                                                        this.height * 0.2
                                                ],
                                                outputRange: [1.0, 0.9, 1, 1.1],
                                                extrapolate: "clamp"
                                            }
                                        )
                                    }
                                ]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            onPress={this.onPressClock.bind(
                                this,
                                interactableRef
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
                                <Text style={[{ fontSize: scaleByFactor(40) }]}>
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
                                width: this.width,
                                alignSelf: "stretch",
                                ...labelForceVisible
                            }}
                            autoResize={false}
                            numberOfLines={1}
                            multiline={false}
                        />
                        {/* <Text style={{ alignSelf: "flex-end" }}>My profile</Text> */}
                    </Animated.View>
                    <View style={[styles.nonClockWrapper]}>
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

                        <View style={[styles.fieldsContainer]}>
                            <LabeledInput
                                labelText="ALARM LABEL"
                                placeholder="Enter a label"
                                fieldText={this.alarmLabelCache}
                                handleTextInput={this.onChangeLabel}
                                onTextInputBlur={this.onLabelInputBlur}
                                separation={4}
                                textInputStyle={{
                                    fontSize: scaleByFactor(22, 0.5)
                                }}
                                flex={0.5}
                                autoResize={false}
                                numberOfLines={1}
                                multiline={false}
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
                                    labelText="ARRIVAL TIME"
                                    flex={0.6}
                                    fieldText={moment
                                        .utc(this.state.alarm.arrivalTime)
                                        .local()
                                        .format("h:mm A")}
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
                                />
                                <LabeledTimeInput
                                    labelText="HOURS OF SLEEP"
                                    fieldText={hoursOfSleep}
                                    flex={0.4}
                                    viewStyle={{
                                        flex: 0.3,
                                        height: "auto"
                                        // backgroundColor: "green",
                                    }}
                                    inputFontSize={scaleByFactor(33, 0.5)}
                                    separation={scaleByFactor(5, 0.3)}
                                    disabled={true}
                                    textAlign={"right"}
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
                            style={[styles.taskListContainer]}
                        >
                            <View style={styles.taskListHeader}>
                                <View
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        justifyContent: "center",
                                        alignItems: "center"
                                    }}
                                >
                                    <Text
                                        style={[
                                            TextStyle.labelText,
                                            { fontSize: scaleByFactor(17, 0.3) }
                                        ]}
                                    >
                                        TASKS
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={{
                                        alignSelf: "center"
                                    }}
                                    onPress={this._onPressEditTasks.bind(this)}
                                    /* onPress={this._CHANGE_CLOCK_FONT.bind(this)} */
                                >
                                    {editTasksBtn}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        alignSelf: "center"
                                    }}
                                    onPress={this.onPressAddTask.bind(this)}
                                    /* onPress={this._CHANGE_CLOCK_FONT.bind(this)} */
                                >
                                    <EntypoIcon
                                        name="add-to-list"
                                        size={scaleByFactor(30, 0.2)}
                                        // color="#7a7677"
                                        color={Colors.brandLightOpp}
                                    />
                                </TouchableOpacity>
                            </View>
                            {touchableBackdrop}
                            {taskArea}
                        </LinearGradient>
                    </View>
                    <this.AnimatedHandle
                        name="drag-handle"
                        size={scaleByFactor(25, 0.5)}
                        color={Colors.disabledGrey}
                        style={{
                            position: "absolute",
                            left: this.width / 2 - scaleByFactor(25, 0.5) / 2,
                            backgroundColor: "transparent",
                            transform: [
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [
                                                this.snapAuto,
                                                this.snapNormal
                                            ],
                                            outputRange: [
                                                this.height * 1.205,
                                                this.height * 0.8
                                            ]
                                        }
                                    )
                                }
                            ],
                            ...handleForceHide
                        }}
                        onPress={() => {
                            let idx = this.state.alarm.mode == "normal" ? 0 : 1;
                            this.interactiveRef.snapTo({ index: idx });
                        }}
                    />
                </Interactable.View>
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        alignSelf: "flex-end",
                        backgroundColor: "transparent",
                        padding: scaleByFactor(20, 0.6),
                        transform: [
                            {
                                scale: this._clockTransform.interpolate({
                                    inputRange: [
                                        this.snapAuto - this.height * 0.2,
                                        this.snapAuto,
                                        this.snapNormal,
                                        this.snapNormal + this.height * 0.2
                                    ],
                                    outputRange: [1.0, 0.9, 1, 1.1],
                                    extrapolate: "clamp"
                                })
                            }
                        ]
                    }}
                    onPress={() => {
                        this.props.navigation.navigate("Sounds", {
                            saveSound: this.saveSound.bind(this),
                            currSound: this.state.alarm.sound
                        });
                    }}
                >
                    <FontAwesome
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
            </View>
        );
    }
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        alignItems: "center",
        alignContent: "stretch",
        backgroundColor: Colors.backgroundGrey
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
        height: SCREEN_HEIGHT * 2 * 0.4,
        top: SCREEN_HEIGHT * 0.9
    },
    animatedView: {
        // flex: 1,
        position: "absolute",
        top: -SCREEN_HEIGHT,
        left: 0,
        height: SCREEN_HEIGHT * 2
    },
    fieldsContainer: {
        flex: 0.25,
        alignSelf: "stretch",
        justifyContent: "center",
        // backgroundColor: "yellow",
        padding: scaleByFactor(10, 0.4),
        paddingBottom: 8,
        borderBottomColor: "#e9e9e9"
        // borderBottomWidth: 1
    },
    taskListContainer: {
        flex: 0.6,
        padding: scaleByFactor(10, 0.4),
        alignSelf: "stretch"
        // backgroundColor: Colors.backgroundGrey
        // backgroundColor: "#afabb0"
    },
    taskListHeader: {
        flex: 0.1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10
    },

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
        fontSize: scaleByFactor(85, 0.7),
        backgroundColor: "transparent",
        alignSelf: "center",
        fontFamily: "Baskerville-Bold"
    },
    dateText: {
        color: "#d5d5d5",
        fontSize: 40
    }
});

export default AlarmDetail;
