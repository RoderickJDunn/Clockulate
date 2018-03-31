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
    Keyboard
} from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import SimpleLineIcons from "react-native-vector-icons/SimpleLineIcons";
import Interactable from "react-native-interactable";
import DateTimePicker from "react-native-modal-datetime-picker";
// import KeyframesView from "react-native-facebook-keyframes";

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
class AlarmDetail extends Component {
    static navigationOptions = () => ({
        title: "Edit Alarm"
    });

    _calculatedWakeUpTime;
    alarmLabelCache;

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    AnimatedAlarmLabel = Animated.createAnimatedComponent(LabeledInput);
    AnimatedHandle = Animated.createAnimatedComponent(MaterialIcon);

    _clockTransform = new Animated.Value(0);
    constructor(props) {
        super(props);
        console.log("AlarmDetail -- Constructor");

        // let av = ArrowView();
        // av.printHello();

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
                    keyboardHeight: null
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
                keyboardHeight: null
            };
        }

        this._setAnimatedViewRef = this._setAnimatedViewRef.bind(this);

        if (this.state.alarm.mode == "normal") {
            setTimeout(() => {
                this.interactiveRef.snapTo({ index: 1 });
            }, 0);
        }

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
            "keyboardWillShow",
            this.keyboardWillShow.bind(this)
        );
        this.keyboardWillHideSub = Keyboard.addListener(
            "keyboardWillHide",
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
        this.setState({ keyboardHeight: event.endCoordinates.height + 10 });
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
        console.log("Task modified", newTask);
        // Check if Task is defined. This callback contains the newly created alarmTask,
        // or nothing if an existing alarmTask was updated.
        if (newTask) {
            realm.write(() => {
                this.state.alarm.tasks.push(newTask);
            });
        }
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
        let tasks = this.state.alarm.tasks;
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
        });
        this.setState({ tasks: tasks });
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
        // this.setState({
        //     alarm: alarm
        // });
    };

    _onArrivalTimePicked = time => {
        console.info("Arrival Time textInput changed: ", time);
        // console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.arrivalTime = time;
        });
        this.setState({
            alarm: alarm
        });
    };

    _onWakeTimePicked = time => {
        console.info("A date has been picked: ", time);
        let { alarm } = this.state;
        realm.write(() => {
            alarm.wakeUpTime = time;
        });
        this._hideDateTimePicker();
    };

    _showDateTimePicker = () => this.setState({ isDatePickerVisible: true });

    _hideDateTimePicker = () => this.setState({ isDatePickerVisible: false });

    _calcWakeUpTime = () => {
        // console.log("Calculating wakeuptime");
        let totalTaskDurations = this.state.alarm.tasks
            .map(alarmTask => {
                if (alarmTask.enabled) {
                    return alarmTask.duration
                        ? alarmTask.duration
                        : alarmTask.task.defaultDuration;
                } else {
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

    _onReorderTasks(aTasks, aTaskId, from, to) {
        console.info("_onReorderTasks");
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
        console.info("AlarmDetail render - ");
        // console.debug("AlarmDetail render - this.state: ", this.state);
        let imageHeight = this.height;
        let initInterPosition, initClockPosition, initHandlePosition;

        if (this.state.alarm.mode == "normal") {
            initInterPosition = 450;
            initClockPosition = 210;
            initHandlePosition = 160;
        } else {
            initInterPosition = 0;
            initClockPosition = 0;
            initHandlePosition = 120;
        }

        // Assign tasks to 'sortedTasks', first ordering them if there are >1
        let sortedTasks =
            this.state.alarm.tasks.length > 1
                ? this.state.alarm.tasks.sorted("order")
                : this.state.alarm.tasks;

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
                                position: "absolute"
                            }}
                        >
                            <Text style={{ color: Colors.labelText }}>
                                ADD TASKS TO THIS ALARM
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        } else {
            taskArea = (
                <TaskList
                    onPressItem={this._onPressTask.bind(this)}
                    onPressItemCheckBox={this.onChangeTaskEnabled}
                    onPressDelete={this._onDeleteTask.bind(this)}
                    onSnapTask={this._onSnapTask.bind(this)}
                    data={sortedTasks}
                    activeTask={this.state.activeTask}
                    closeTaskRows={this._closeTaskRows.bind(this)}
                    isEditingTasks={this.state.isEditingTasks}
                    onReorderTasks={this._onReorderTasks.bind(this)}
                />
            );
        }

        let disableDrag = this.state.isEditingTasks;

        let wakeUpTime;
        // console.log("this.state.alarm.mode", this.state.alarm.mode);
        if (this.state.alarm.mode == "autocalc") {
            wakeUpTime = this._calcWakeUpTime();
        } else {
            wakeUpTime = this.state.alarm.wakeUpTime;
        }

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
            editTasksBtn = <EntypoIcon name="edit" size={20} color="#7a7677" />;
        } else {
            editTasksBtn = <Text style={{ color: "blue" }}>DONE</Text>;
        }

        let snapPoints = [
            { y: 0, id: "autocalc" },
            { y: this.height * 0.8, id: "normal" }
        ];

        if (this.state.isEditingLabel && this.state.keyboardHeight) {
            snapPoints.push({ y: this.state.keyboardHeight, id: "keyboard" });
        }

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
                                            inputRange: [0, this.height],
                                            outputRange: [0, this.height / 30]
                                        }
                                    )
                                }
                            ]
                        }
                    ]}
                    source={require("../img/ClockBgV2.png")}
                    /* resizeMode="center" */
                />

                {/* This is the animated wrapper for the CLOCK display, and the label shown in Normal */}
                <Animated.View
                    style={[
                        styles.clockContainer,
                        {
                            width: this.width,
                            transform: [
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [0, this.height],
                                            outputRange: [
                                                -this.height / 8,
                                                this.height / 4
                                            ]
                                        }
                                    )
                                }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        onPress={this.onPressClock.bind(this, interactableRef)}
                        style={{
                            alignSelf: "stretch",
                            alignContent: "center"
                        }}
                    >
                        <Text style={[styles.timeText]}>
                            {fWakeUpTime}
                            <Text style={[{ fontSize: scale(40) }]}>
                                {" " + amPmWakeUpTime}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                    <this.AnimatedAlarmLabel
                        placeholder="Enter a label"
                        fieldText={this.state.alarm.label}
                        handleTextInput={this.onChangeLabel}
                        onTextInputBlur={this.onLabelInputBlur}
                        onTextInputFocus={this.onLabelInputFocus}
                        style={{
                            opacity: this._clockTransform.interpolate({
                                inputRange: [0, this.height],
                                outputRange: [0, 1]
                            })
                        }}
                        viewStyle={{
                            position: "absolute",
                            top: "85%",
                            width: this.width,
                            alignSelf: "stretch",
                            paddingLeft: 20,
                            paddingRight: 20,
                            height: 100,
                            flex: 1
                        }}
                        textInputStyle={{
                            fontSize: 16,
                            textAlign: "center",
                            color: "white"
                        }}
                        autoResize={false}
                        numberOfLines={1}
                        multiline={false}
                    />
                    {/* <Text style={{ alignSelf: "flex-end" }}>My profile</Text> */}
                </Animated.View>
                {touchableBackdrop}
                <Interactable.View
                    ref={interactableRef}
                    style={[
                        styles.animatedView,
                        {
                            width: this.width
                            // backgroundColor: "#456729"
                        }
                    ]}
                    verticalOnly={true}
                    snapPoints={snapPoints}
                    animatedValueY={this._clockTransform}
                    onSnap={this.onSnap.bind(this)}
                    initialPosition={{ y: initInterPosition }}
                    dragEnabled={!disableDrag}
                    animatedNativeDriver={true}
                >
                    <TouchableOpacity
                        disabled={
                            this.state.alarm.mode == "normal" ? true : false
                        }
                        onPress={this.onPressClock.bind(this, interactableRef)}
                        style={[styles.interactableHandle, { flex: 0.3 }]}
                    />
                    <View style={[styles.nonClockWrapper, { flex: 0.7 }]}>
                        <Image
                            style={[
                                styles.nonClockBgImage,
                                { height: imageHeight }
                            ]}
                            source={require("../img/NonClockBgV2.png")}
                            /* resizeMode="center" */
                        />

                        <View style={[styles.fieldsContainer]}>
                            <LabeledInput
                                labelText="ALARM LABEL"
                                placeholder="Enter a label"
                                fieldText={this.state.alarm.label}
                                handleTextInput={this.onChangeLabel}
                                onTextInputBlur={this.onLabelInputBlur}
                                separation={2}
                                textInputStyle={{
                                    fontSize: scale(20)
                                }}
                                flex={0.5}
                                autoResize={false}
                                numberOfLines={1}
                                multiline={false}
                            />
                            <View style={{ height: scale(3) }} />
                            <LabeledTimeInput
                                labelText="ARRIVAL TIME"
                                flex={0.5}
                                fieldText={moment
                                    .utc(this.state.alarm.arrivalTime)
                                    .local()
                                    .format("h:mm A")}
                                time={moment
                                    .utc(this.state.alarm.arrivalTime)
                                    .local()
                                    .toDate()}
                                handleArrivalChange={this._onArrivalTimePicked}
                                timePickerPrompt="What time do you need to arrive?"
                                inputFontSize={scale(33)}
                                separation={scaleByFactor(5, 0.3)}
                            />
                            {/* <View style={{ height: 5 }} /> */}
                        </View>
                        {touchableBackdrop}
                        <View style={[styles.taskListContainer]}>
                            <View style={styles.taskListHeader}>
                                <TouchableOpacity
                                    style={{
                                        alignSelf: "center"
                                    }}
                                    onPress={this._onPressEditTasks.bind(this)}
                                    /* onPress={this._CHANGE_CLOCK_FONT.bind(this)} */
                                >
                                    {editTasksBtn}
                                </TouchableOpacity>
                                <View
                                    style={{
                                        justifyContent: "center",
                                        alignItems: "center"
                                    }}
                                >
                                    <Text
                                        style={[
                                            TextStyle.labelText,
                                            { fontSize: 14 }
                                        ]}
                                    >
                                        TASKS
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={{
                                        alignSelf: "center"
                                    }}
                                    onPress={this.onPressAddTask.bind(this)}
                                    /* onPress={this._CHANGE_CLOCK_FONT.bind(this)} */
                                >
                                    <EntypoIcon
                                        name="add-to-list"
                                        size={30}
                                        color="#7a7677"
                                    />
                                </TouchableOpacity>
                            </View>
                            {touchableBackdrop}
                            {taskArea}
                        </View>
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
                                            inputRange: [0, this.height],
                                            outputRange: [
                                                this.height / 3.75,
                                                -this.height / 18
                                            ]
                                        }
                                    )
                                }
                            ]
                        }}
                    />
                </Interactable.View>
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        alignSelf: "flex-end",
                        backgroundColor: "transparent",
                        padding: 20
                    }}
                    onPress={() => {
                        this.props.navigation.navigate("Sounds", {
                            saveSound: this.saveSound.bind(this),
                            currSound: this.state.alarm.sound
                        });
                    }}
                >
                    <SimpleLineIcons
                        name="music-tone"
                        size={22}
                        color="#ECECEC"
                    />
                </TouchableOpacity>
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
        top: -40, // required for image parallax
        width: SCREEN_WIDTH,
        height: 220
    },
    clockContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        height: SCREEN_HEIGHT * 0.5
        // backgroundColor: "#9DD033"
        // top: 20
    },
    interactableHandle: {
        backgroundColor: "transparent"
        // backgroundColor: "#0FF"
    },
    nonClockWrapper: {
        alignItems: "stretch"
    },
    animatedView: {
        // flex: 0.85
        flex: 1
    },
    fieldsContainer: {
        flex: 0.3,
        alignSelf: "stretch",
        alignItems: "flex-start",
        justifyContent: "center",
        // backgroundColor: "yellow",
        padding: scaleByFactor(10, 0.4),
        paddingBottom: 8,
        borderBottomColor: "#e9e9e9",
        borderBottomWidth: 1
    },
    taskListContainer: {
        flex: 0.65,
        padding: scaleByFactor(10, 0.4),
        alignSelf: "stretch"
    },
    taskListHeader: {
        flex: 0.1,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingBottom: 5
    },

    nonClockBgImage: {
        position: "absolute",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        top: -15
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
        color: "#d5d5d5",
        fontSize: scaleByFactor(85, 0.8),
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
