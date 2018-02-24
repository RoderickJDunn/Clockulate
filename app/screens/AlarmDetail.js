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
    Animated
} from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
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
// TODO: Remove after we're done choosing fonts
import { fontPreview } from "../styles/text.js";
class AlarmDetail extends Component {
    static navigationOptions = () => ({
        title: "Edit Alarm"
    });

    _calculatedWakeUpTime;

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
                    path: `M74.5,218.5 C114.817,218.5 147.5,185.817 147.5,145.5
                    C147.5,65.419 114.369,0.5 73.5,0.5 C33.183,0.5 0.5,
                    65.419 0.5,145.5 C0.5,185.817 33.183,218.5 73.5,218.5 Z`,
                    segmentCount: 50,
                    animationDuration: 3000
                };
                // this.state.alarm.mode = "normal"; // FIXME: this is to hack in normal mode for testing
            });
        } else {
            // console.log("We are editing an existing alarm: ", params);
            this.state = {
                alarm: params.alarm,
                isDatePickerVisible: false,
                // path: `M 156 155 Q 352 195 312 3`,
                path: `M 180 125 Q 346 161 313 7 L 330 17 L 301 23 L 313 7`,
                // path: `M74.5,218.5 C114.817,218.5 147.5,185.817 147.5,145.5
                // C147.5,65.419 114.369,0.5 73.5,0.5 C33.183,0.5 0.5,
                // 65.419 0.5,145.5 C0.5,185.817 33.183,218.5 73.5,218.5 Z`,
                segmentCount: 50,
                animationDuration: 3000
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
    //     // setTimeout(() => {  // Temporarily disabled to save resources. (set back to setInterval).
    //     //     // console.log("Updating time and date");
    //     //     this.setState({
    //     //         time: moment().format("LT"),
    //     //         date: moment().format("LL"),
    //     //     });
    //     // }, 1000);
    // }

    componentDidMount() {
        // console.debug("AlarmDetail --- ComponentDidMount");
        this.props.navigation.setParams({
            handleBackBtn: this.handleBackPress.bind(this)
        });
    }

    _setAnimatedViewRef(ref) {
        this._animatedView = ref;
    }

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
        // this.props.navigation.state.params.reloadAlarms();
        this.props.navigation.goBack();
        setTimeout(this.props.navigation.state.params.reloadAlarms, 0);
    }

    onPressAddTask() {
        let nextTaskPosition = this.state.alarm.tasks.length;
        this.props.navigation.navigate("TaskDetail", {
            onSaveState: this.onTaskListChanged.bind(this),
            order: nextTaskPosition
        });
    }

    onTaskListChanged(newTask) {
        // console.log("Task modified", newTask);
        // Check if Task is defined. This callback contains the newly created alarmTask,
        // or nothing if an existing alarmTask was updated.
        if (newTask) {
            realm.write(() => {
                this.state.alarm.tasks.push(newTask);
            });
        }
        this.setState(this.state);
    }

    /*
    Called by a 'bubble-up' type functionality, since a reference to this function was passed as a prop to 'TaskList',
    which in turn passes the fx reference to each 'TaskItem' in that list.
    IMPORTANT: It is vital to either use an arrow function here (which uses the outer-scope 'this'), or if it is a
        regular function, bind the fx to 'this' in the outer scope (the screen) so that it has access to this.props.navigation.
     */
    _onPressTask = task => {
        // console.debug("AlarmDetail: onPressTask -- task: ", task);

        // Need to use a workaround to delete the object, otherwise app will crash due to Realm bug when navigating after deleting passed Object:
        // Pass TaskAlarm ID instead of TaskAlarm object.
        const params = {
            alarmTaskId: task.id,
            onSaveState: this.onTaskListChanged.bind(this)
        };

        this.props.navigation.navigate("TaskDetail", params);
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
        let tempAlarm = this.state.alarm;
        realm.write(() => {
            tempAlarm.label = text;
        });
        this.setState({ alarm: tempAlarm });
    };

    onLabelInputBlur = () => {
        console.log("Label text lost focus: ");
    };

    onChangeTaskEnabled = (taskToUpdate, enabled) => {
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
        let alarmState = this.state.alarm;
        let snapId = event.nativeEvent.id;
        if (snapId != alarmState.mode) {
            realm.write(() => {
                if (event.nativeEvent.id == "normal") {
                    alarmState.mode = "normal";
                } else {
                    alarmState.mode = "autocalc";
                }
                this.setState({ alarm: alarmState });
            });
        }
    };

    onPressClock = ref => {
        console.log("onPressClock");
        if (this.state.alarm.mode == "autocalc") {
            this.interactiveRef.snapTo({ index: 1 });
        }
        this._showDateTimePicker();
    };

    _onArrivalTimePicked = time => {
        console.log("Arrival Time textInput changed: ", time);
        console.log("Arrival Time textInput changed: ", moment(time).unix());
        let { alarm } = this.state;
        realm.write(() => {
            alarm.arrivalTime = moment(time).unix() * 1000;
        });
        this.setState({
            alarm: alarm
        });
    };

    _onWakeTimePicked = time => {
        console.log("A date has been picked: ", time);
        let { alarm } = this.state;
        realm.write(() => {
            alarm.wakeUpTime = moment(time).unix() * 1000;
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
        this._calculatedWakeUpTime =
            this.state.alarm.arrivalTime - totalTaskDurations;

        return this._calculatedWakeUpTime;
    };

    render() {
        console.debug("AlarmDetail render - ");
        console.debug("AlarmDetail render - this.state: ", this.state);
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

        const { path, segmentCount } = this.state;
        let taskArea = null;
        if (sortedTasks.length == 0) {
            // taskArea = <TaskPlaceHolder />;
            // taskArea = (
            //     <AnimatedView
            //         ref={this._setAnimatedViewRef}
            //         path={path}
            //         segmentCount={segmentCount}
            //         animationDuration={this.state.animationDuration}
            //     />
            // );
            taskArea = (
                <View
                    style={{
                        flex: 1
                    }}
                >
                    <ArrowView
                        style={{
                            alignSelf: "flex-start",
                            position: "absolute",
                            width: 300,
                            height: 300
                        }}
                        shape={{
                            start: [180, 160],
                            end: [350, 20],
                            curve: 0.9,
                            spread: -0.1
                        }}
                    />
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "column",
                            justifyContent: "center"
                        }}
                    >
                        <Text
                            style={{
                                alignSelf: "center",
                                justifyContent: "center",
                                position: "absolute",
                                textAlign: "center",
                                color: Colors.labelText
                            }}
                        >
                            ADD TASKS TO THIS ALARM
                        </Text>
                    </View>
                </View>
            );
        } else {
            taskArea = (
                <TaskList
                    onPressItem={this._onPressTask.bind(this)}
                    onPressItemCheckBox={this.onChangeTaskEnabled}
                    data={sortedTasks}
                />
            );
        }

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

        return (
            <View style={styles.screenContainer}>
                {/* <StatusBar style={{ backgroundColor: Colors.brandDarkGrey }} /> */}
                <Animated.Image
                    style={[
                        styles.clockBackground,
                        { height: imageHeight },
                        {
                            transform: [
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [0, 450],
                                            outputRange: [0, 15]
                                        }
                                    )
                                }
                            ]
                        }
                    ]}
                    source={require("../img/ClockBgV2.png")}
                    /* resizeMode="center" */
                />
                <Animated.View
                    style={[
                        styles.clockContainer,
                        {
                            width: this.width,
                            transform: [
                                {
                                    scale: this._clockTransform.interpolate({
                                        inputRange: [-150, -150, 0, 0],
                                        outputRange: [0.3, 0.3, 1, 1]
                                    })
                                },
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [0, 450],
                                            outputRange: [0, 210]
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
                            alignSelf: "stretch"
                        }}
                    >
                        <Text style={[styles.timeText]}>
                            {fWakeUpTime}
                            <Text style={[{ fontSize: 50 }]}>
                                {" " + amPmWakeUpTime}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                    <this.AnimatedAlarmLabel
                        placeholder="Enter a label"
                        fieldText={this.state.alarm.label}
                        handleTextInput={this.onChangeLabel}
                        onTextInputBlur={this.onLabelInputBlur}
                        separation={2}
                        style={{
                            marginTop: 60,
                            fontSize: 16,
                            color: "#d5d5d5",
                            textAlign: "center",
                            alignSelf: "stretch",
                            opacity: this._clockTransform.interpolate({
                                inputRange: [200, 450],
                                outputRange: [0, 1]
                            })
                        }}
                        flex={1}
                    />
                    {/* <Text style={{ alignSelf: "flex-end" }}>My profile</Text> */}
                </Animated.View>

                <Interactable.View
                    ref={interactableRef}
                    style={[styles.animatedView, { width: this.width }]}
                    verticalOnly={true}
                    snapPoints={[
                        { y: 0, id: "autocalc" },
                        { y: 460, id: "normal" }
                    ]}
                    animatedValueY={this._clockTransform}
                    onSnap={this.onSnap.bind(this)}
                    initialPosition={{ y: initInterPosition }}
                >
                    <TouchableOpacity
                        disabled={
                            this.state.alarm.mode == "normal" ? true : false
                        }
                        onPress={this.onPressClock.bind(this, interactableRef)}
                        style={[styles.interactableHandle]}
                    />
                    <View style={[styles.nonClockWrapper]}>
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
                                height={15}
                                separation={2}
                                style={{ fontSize: 22 }}
                                flex={1}
                            />
                            <LabeledTimeInput
                                labelText="ARRIVAL TIME"
                                flex={1}
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
                                inputFontSize={29}
                            />
                            {/* <View style={{ height: 5 }} /> */}
                        </View>
                        <View style={[styles.taskListContainer]}>
                            <View style={styles.taskListHeader}>
                                <Text
                                    style={[
                                        TextStyle.labelText,
                                        { alignSelf: "center" }
                                    ]}
                                >
                                    TASKS
                                </Text>
                                <TouchableOpacity
                                    style={{ alignSelf: "flex-start" }}
                                    onPress={this.onPressAddTask.bind(this)}
                                    /* onPress={this._CHANGE_CLOCK_FONT.bind(this)} */
                                >
                                    <EntypoIcon
                                        name="add-to-list"
                                        size={30}
                                        color={Colors.brandLightPurple}
                                    />
                                </TouchableOpacity>
                            </View>
                            {taskArea}
                        </View>
                    </View>
                    <this.AnimatedHandle
                        name="drag-handle"
                        size={25}
                        color={Colors.disabledGrey}
                        style={{
                            position: "absolute",
                            left: this.width / 2 - 12.5,
                            backgroundColor: "transparent",
                            transform: [
                                {
                                    translateY: this._clockTransform.interpolate(
                                        {
                                            inputRange: [0, 450],
                                            outputRange: [160, 120]
                                        }
                                    )
                                }
                            ]
                        }}
                    />
                </Interactable.View>
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
        justifyContent: "center",
        alignItems: "center",
        alignContent: "stretch",
        backgroundColor: Colors.backgroundGrey
    },

    clockBackground: {
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -40,
        width: 450,
        height: 220
    },
    clockContainer: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        top: 20
    },
    interactableHandle: {
        flex: 4,
        backgroundColor: "transparent"
    },
    nonClockWrapper: {
        flex: 11,
        alignItems: "stretch"
    },
    animatedView: {
        flex: 1
    },
    fieldsContainer: {
        flex: 3,
        alignSelf: "stretch",
        alignItems: "flex-start",
        // backgroundColor: "yellow",
        padding: 10,
        paddingBottom: 8,
        borderBottomColor: "#e9e9e9",
        borderBottomWidth: 1
    },
    taskListContainer: {
        flex: 8,
        padding: 10,
        paddingTop: 10,
        alignSelf: "stretch"
        // backgroundColor: "#dbd6dd"
    },
    taskListHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    nonClockBgImage: {
        position: "absolute",
        width: 450,
        height: 500,
        top: -15
        // borderColor: "red",
        // borderWidth: 2
    },
    clockBackgroundNotImage: {
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -40,
        width: 450,
        height: 195,
        backgroundColor: "#220957"
    },
    timeText: {
        color: "#d5d5d5",
        fontSize: 95,
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
