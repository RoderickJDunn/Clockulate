/**
 * Created by rdunn on 2017-08-23.
 */

import React, { Component } from "react";
import {
    View,
    TextInput,
    StatusBar,
    TouchableOpacity,
    Text,
    StyleSheet,
    Dimensions,
    Keyboard,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    InteractionManager
} from "react-native";
import EntypoIcon from "react-native-vector-icons/Entypo";
import FAIcon from "react-native-vector-icons/FontAwesome";
import IonIcon from "react-native-vector-icons/Ionicons";
import { NavigationActions, Header } from "react-navigation";
import Autocomplete from "react-native-autocomplete-input";
import { isIphoneX } from "react-native-iphone-x-helper";
import {
    AdMobBanner,
    // AdMobInterstitial,
    PublisherBanner
    // AdMobRewarded
} from "react-native-admob";

import { minuteRange, hourRange } from "../data/constants";
import realm from "../data/DataSchemas";
import LabeledInput from "../components/labeled-input";
import LabeledDurationInput from "../components/labeled-duration-input";
import { TaskModel, AlarmTaskModel } from "../data/models";
import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { scale, scaleByFactor } from "../util/font-scale";
import DurationText from "../components/duration-text";
import CheckBox from "../components/checkbox";
import {
    formatDuration,
    calcWholeHours,
    calcMinutes
} from "../util/date_utils";
import PickerActionSheet from "../components/picker-action-sheet";
import { AdWrapper } from "../services/AdmobService";
import ClkAlert from "../components/clk-awesome-alert";
import Upgrades from "../config/upgrades";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_HEIGHT = Header.HEIGHT;
const AUTOCP_INPUT_HEIGHT = 75;
const isSmallScreen = SCREEN_HEIGHT < 650;
/*
This screen allows user to edit details about a Task: Specifically, its Name, Duration, and Enabled
 */
class TaskDetail extends Component {
    static navigationOptions = ({ navigation }) => {
        const { params } = navigation.state;
        let screenTitle =
            !params || !params.hasOwnProperty("alarmTaskId")
                ? "New Task"
                : "Edit Task";
        return {
            title: screenTitle,
            headerLeft: (
                <TouchableOpacity
                    style={{
                        paddingRight: 25,
                        paddingVertical: 10,
                        paddingLeft: 10
                    }}
                    onPress={() => {
                        params.willNavigateBack();
                        navigation.dispatch(NavigationActions.back());
                    }}
                >
                    {Platform.OS == "ios" ? (
                        <Text
                            style={{
                                color: Colors.brandLightGrey,
                                fontSize: scaleByFactor(13)
                            }}
                        >
                            Cancel
                        </Text>
                    ) : (
                        <IonIcon
                            name="md-close"
                            // name="md-checkmark"
                            // name="playlist-add-check" // MaterialIcons  -- looks like a list with a checkmark at bottom-right
                            size={scaleByFactor(25, 0.3)}
                            color={Colors.brandLightGrey}
                        />
                    )}
                </TouchableOpacity>
            ),
            headerRight: (
                <TouchableOpacity
                    style={{
                        paddingRight: 10,
                        paddingVertical: 10,
                        paddingLeft: 25
                    }}
                    onPress={() => navigation.state.params.handleSave()}
                >
                    {/* <IonIcon
                        name="md-checkmark-circle-outline"
                        // name="md-checkmark"
                        // name="playlist-add-check" // MaterialIcons  -- looks like a list with a checkmark at bottom-right
                        size={scaleByFactor(25, 0.3)}
                        color={Colors.brandOffWhiteBlue}
                    /> */}
                    <Text
                        style={{
                            color: Colors.brandLightGrey,
                            fontSize: scaleByFactor(13)
                        }}
                    >
                        Save
                    </Text>
                </TouchableOpacity>
            )
        };
    };

    nameChanged = false;
    initialName = "";
    currName = "";
    xtraKeyboardHeight = 0;

    /*
    Receives data about the Task that was tapped on the previous screen
     */
    constructor(props) {
        super(props);
        // console.log("TaskDetail -- Props: ", props);
        const { params } = props.navigation.state; // same as: " const params = props.navigation.state.params "
        // console.log("nav params", params);

        let taskSuggestions = realm.objects("Task");

        if (isIphoneX()) {
            this.xtraKeyboardHeight = 30;
        }

        if (!params || !params.hasOwnProperty("alarmTaskId")) {
            // We are creating a brand new task. Create a stub TaskAlarm object with default Task values

            let task = new TaskModel();
            this.state = {
                alarmTask: new AlarmTaskModel(task, params.order),
                onSaveState: params.onSaveState, // called when a task is Saved or Deleted
                newTask: true,
                willNavigateBack: params.willNavigateBack,
                onPressDelete: params.onPressDelete,
                suggestions: taskSuggestions,
                filteredSuggestions: [],
                hideSuggestions: true,
                keyboardHeight: 1, // NOTE: starting this off != 0, so that Ad doesn't flash when this screen first renders.
                showDurationInfo: false,
                setAsDefault: false,
                currNameHasMatch: false,
                showDurationPicker: false,
                showProAdUpgradePopup: false,
                forcePro: false
            };
            // console.log(this.state.alarmTask);
        } else {
            let alarmTask = realm.objectForPrimaryKey(
                "AlarmTask",
                params.alarmTaskId
            );
            this.state = {
                // NOTE: We need to construct a new object from the Realm result here, otherwise any modifications to
                // the AlarmTask (duration change, name change, etc) will immediately result in saving to DB. So instead
                // of using the realm object directly, we create an alarmTask model for use within this screen.

                alarmTask: {
                    task: {
                        id: alarmTask.task.id,
                        name: alarmTask.task.name,
                        defaultDuration: alarmTask.task.defaultDuration
                    },
                    id: alarmTask.id,
                    duration: alarmTask.duration,
                    enabled: alarmTask.enabled,
                    order: alarmTask.order
                },
                onSaveState: params.onSaveState, // called when a task is Saved or Deleted
                willNavigateBack: params.willNavigateBack,
                onPressDelete: params.onPressDelete,
                suggestions: taskSuggestions,
                filteredSuggestions: null,
                hideSuggestions: true,
                keyboardHeight: 1, // starting this off != 0, so that Ad doesn't flash when this screen first renders.
                newTask: false,
                showDurationInfo: false,
                setAsDefault: false,
                currNameHasMatch: true,
                showDurationPicker: false,
                forcePro: false
            };
        }

        this.initialName = this.state.alarmTask.task.name;
        this.currName = this.state.alarmTask.task.name;
    }

    componentDidMount() {
        // console.log("TaskDetail -- componentDidMount");

        // InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
            this.addKeyboardListeners();
            this.props.navigation.setParams({
                handleSave: this.handleSave.bind(this)
            });
            if (this._nameInputRef) this._nameInputRef.focus();
            // if (this._nameInputRef) setTimeout(this._nameInputRef.focus, 1400);
        }, 1000);
    }

    componentWillUnmount() {
        console.debug("TaskDetail: componentWillUnmount");
        this.removeKeyboardListeners();
    }

    _createDurationData = () => {
        return hourRange().map(function(hour) {
            return { [hour]: minuteRange() };
        });
    };

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
        if (this.keyboardWillShowSub) this.keyboardWillShowSub.remove();
        if (this.keyboardWillHideSub) this.keyboardWillHideSub.remove();
    }

    keyboardWillShow = event => {
        console.log("keyboardWillShow -------");
        // console.log(event.endCoordinates);
        // console.log(SCREEN_HEIGHT);
        this.setState({ keyboardHeight: event.endCoordinates.screenY });
    };

    keyboardWillHide = event => {
        console.log("keyboardDidHide");
        // console.log("this.currName", this.currName);

        let exactMatch = [];
        if (this.state.suggestions.length > 0) {
            exactMatch = this.state.suggestions.filtered(
                "name = $0",
                this.currName
            );
        }

        // console.log("exactMatch", exactMatch);
        let hasMatch = exactMatch.length > 0;
        this.setState({
            keyboardHeight: 0,
            hideSuggestions: true,
            currNameHasMatch: hasMatch
        });
    };

    handleSave() {
        // Determine whether we need to create a new AlarmTask+Task, create a new AlarmTask for an existing task, or Update an existing AlarmTask
        // There are several things to think about:
        // 1. Does the current task-name already exist in the DB as a 'Task'?
        // 2. Is this a new AlarmTask (user pushed 'Add New Task' button)?, or is it an existing AlarmTask that is being edited?

        // console.log("TaskDetail:handleSave: this.state", this.state);

        /* isNewAlarmTask:
            Simple flag indicating whether user entered TaskDetail by tapping the add button (isNewAlarmTask == true)
            or by tapping an existing AlarmTask (isNewAlarmTask == false)
        */
        let isNewAlarmTask = this.state.newTask;

        // Check if newTask
        let alarmTaskRlm;
        let prevAlarmTask = this.state.alarmTask;
        let newTask = null;

        // store the duration currently showing on the UI
        let duration = prevAlarmTask.duration;

        // Check if a Task exists in the DB with the current name (this.currName)
        let taskLookup = realm
            .objects("Task")
            .filtered("name = $0", this.currName);

        if (taskLookup.length == 1) {
            // console.log("Found 1 task with name: " + this.currName);
            // console.log("taskLookup[0]", taskLookup[0]);

            prevAlarmTask.task = taskLookup[0];

            /* Even though we just found an existing Task with the set name, its duration probably differs from
                that shown in the UI. Its possible that the UI is displaying the 'defaultDuration' of the old Task.
                Therefore, apply the UI duration to the duration property of the AlarmTask being edited, otherwise 
                the duration being displayed will be lost/ignored.
            */
            prevAlarmTask.duration = duration;
        } else if (taskLookup.length == 0) {
            // console.log("No tasks found with name: " + this.currName);
            newTask = new TaskModel();

            newTask.name = this.currName; // apply current name to new Task

            // apply currently set duration to new Task's 'defaultDuration'
            newTask.defaultDuration = duration;
        } else {
            console.error(
                "ERROR: Found more than 1 task with name: " + this.currName
            );
            // FIXME: This should never happen. Does it still happen?
        }

        if (newTask) {
            // Create a new Task, and depending on whether this 'isNewAlarmTask':
            //  - false: update the alarmTask with the new Task
            //  - true: create a new AlarmTask and Task

            // console.log(this.state);
            // console.log(
            //     "Creating new Task. 'isNewAlarmTask': " + isNewAlarmTask
            // );
            prevAlarmTask.task = newTask;

            prevAlarmTask.enabled = true; // since this AlarmTask has been edited and saved, it should be automatically enabled.
            // prevAlarmTask = this.state.alarmTask;
            realm.write(() => {
                // NOTE: even though we need both a new Task and AlarmTask, we just need to create the AlarmTask,
                //        and the Task is automatically created by Realm framework. In fact, creating the Task then trying to create the
                //        corresponding AlarmTask afterward gives an error (duplicate primary key).
                alarmTaskRlm = realm.create(
                    "AlarmTask",
                    prevAlarmTask,
                    !isNewAlarmTask // 3rd parameter: pass 'true' if this is an Update op.
                );
            });
        } else {
            // A Task with this name already exists in the DB (it is currently stored in prevAlarmTask.task)

            if (isNewAlarmTask) {
                /* Create the new AlarmTask. 
                    We only get here if user has tapped "Add new AlarmTask" AND we have found an existing Task
                    in the DB with the name provided by the user
                */
                // console.log("Creating a new AlarmTask");
                realm.write(() => {
                    // let idToDelete = prevAlarmTask.id; // get Id of AlarmTask to delete
                    // console.log("idToDelete", idToDelete);
                    let orderOfAlmTask = prevAlarmTask.order; // store the Order of AlarmTask to be deleted, to apply to the new one
                    // realm.delete(
                    //     realm.objectForPrimaryKey("AlarmTask", idToDelete)
                    // ); // delete the AlarmTask by ID

                    // Create new AlarmTask for the new task
                    const existingTask = new TaskModel();
                    existingTask.name = prevAlarmTask.task.name;
                    existingTask.id = prevAlarmTask.task.id;
                    existingTask.defaultDuration =
                        prevAlarmTask.task.defaultDuration;

                    if (this.state.setAsDefault) {
                        // only change the existing Task's default duration if 'Set as Default' is checked.
                        existingTask.defaultDuration = prevAlarmTask.duration;
                    }
                    // ? prevAlarmTask.duration
                    // : prevAlarmTask.task.defaultDuration
                    //     ? prevAlarmTask.task.defaultDuration
                    //     : 600;

                    let newAlarmTask = new AlarmTaskModel(
                        existingTask,
                        orderOfAlmTask
                    );

                    // This is a new AlarmTask, so apply the duration showing in the UI to the newAlarmTask object.
                    newAlarmTask.duration = prevAlarmTask.duration;

                    console.log("new alarmTask", newAlarmTask);
                    alarmTaskRlm = realm.create(
                        "AlarmTask",
                        newAlarmTask,
                        true
                    );
                });
            } else {
                /* Update the AlarmTask with the new duration. We only get here if user tapped an existing AlarmTask for editing,
                    AND we have found an existing Task in the DB with the name provided by the user. All that could have changed
                    is the duration of the AlarmTask being edited. 
                */
                // console.log("Updating existing AlarmTask");
                realm.write(() => {
                    // only change the existing Task's default duration if 'Set as Default' is checked.
                    if (this.state.setAsDefault) {
                        prevAlarmTask.task.defaultDuration =
                            prevAlarmTask.duration;
                    }

                    prevAlarmTask.enabled = true; // since this AlarmTask has been edited and saved, it should be automatically enabled.

                    // NOTE: Here we are updating the AlarmTask in the DB by passing 'true' as the 3rd param of create()
                    //        This param specifies that it should be an update operation, rather than a creation.
                    // console.log('alarmTask', this.state.alarmTask);
                    realm.create("AlarmTask", prevAlarmTask, true);
                });
            }
        }

        this.state.onSaveState(isNewAlarmTask ? alarmTaskRlm : null);

        this.state.willNavigateBack();
        this.props.navigation.dispatch(NavigationActions.back());
    }

    _onDeleteTask() {
        console.log("TaskDetail: _onDeleteTask");
        console.log("this.state.alarmTask", this.state.alarmTask);

        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                {
                    text: "Delete",
                    onPress: () => {
                        this.state.onPressDelete(this.state.alarmTask);
                        this.state.onSaveState();
                        this.state.willNavigateBack();
                        this.props.navigation.dispatch(
                            NavigationActions.back()
                        );
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
                // { text: "OK", onPress: () => console.log("OK Pressed") }
            ],
            { cancelable: false }
        );
    }

    _onTaskNameChange(text) {
        this.currName = text;
        // console.log("Task name typing: this.currName", this.currName);
        // const updatedAlmTask = this.state.alarmTask;
        // updatedAlmTask.task.name = text;
        // this.setState({ alarmTask: updatedAlmTask });
        if (this.initialName !== text) {
            this.nameChanged = true;
        }

        let filteredSuggestions = this.state.suggestions.filtered(
            "name CONTAINS[c] $0",
            this.currName
        );

        this.setState({
            hideSuggestions: false,
            filteredSuggestions: filteredSuggestions
        });
    }

    _onTaskDurationChanged(duration) {
        console.debug("Task duration changed: ", duration);
        const updatedAlmTask = this.state.alarmTask;
        updatedAlmTask.duration = duration;
        this.setState({ alarmTask: updatedAlmTask, showDurationPicker: false });
    }

    /* Updates the AlarmTask model on this screen using the Task selected from the selection dropdown, then updates the UI
        with the necessary info. */
    _loadTaskFromSuggestions(task) {
        console.log("_loadTaskFromSuggestions");
        let { alarmTask } = this.state;
        alarmTask.task.name = task.name;
        alarmTask.task.id = task.id;
        alarmTask.task.defaultDuration = task.defaultDuration;
        alarmTask.duration = task.defaultDuration;

        this.currName = alarmTask.task.name;
        this.setState({ alarmTask: alarmTask, hideSuggestions: true });
    }

    _renderAutoCompInput = props => {
        return (
            <View style={{ flexDirection: "row" }}>
                <TextInput
                    style={[
                        Styles.fieldText,
                        TextStyle.editableText,
                        {
                            // height: inputHeight + scaleByFactor(23, 0.5),
                            paddingVertical: 2,
                            margin: 0,
                            borderWidth: 0,
                            borderColor: "transparent",
                            paddingHorizontal: 0,
                            // backgroundColor: "green",
                            flex: 0.95

                            // borderRadius: 5
                        }
                    ]}
                    textAlign={"left"}
                    // underlineColorAndroid="transparent"
                    placeholder={props.placeholder}
                    placeholderTextColor={Colors.disabledGrey}
                    onChangeText={props.onChangeText}
                    defaultValue={props.defaultValue}
                    // onBlur={e => {
                    //     // console.log("TextInput blurred: " + e.nativeEvent.text);
                    //     this._onBlur(this);
                    //     if (onBlur != null) onBlur(e);
                    // }}
                    onFocus={() => {
                        if (this._adWrapRef) {
                            this._adWrapRef.fadeOut();
                        }
                    }}
                    ellipsizeMode="tail"
                    blurOnSubmit={true}
                    // onContentSizeChange={e =>
                    //     this.updateSize(e.nativeEvent.contentSize.height)
                    // }
                    multiline={false}
                    underlineColorAndroid="transparent"
                    ref={el => (this._nameInputRef = el)}
                />
                {this.currName != "" && (
                    <TouchableOpacity
                        onPress={() => {
                            this.currName = "";
                            this.setState(this.state);
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
                )}
            </View>
        );
    };

    _renderSuggestionItem = task => {
        // if (task.fake) {
        //     return (
        //         <View
        //             style={[
        //                 Styles.suggestionItemWrapper,
        //                 { backgroundColor: "blue" }
        //             ]}
        //         />
        //     );
        // } else {
        let { name, defaultDuration } = task;
        return (
            <TouchableOpacity
                onPress={() => {
                    console.log("onPress");
                    this._loadTaskFromSuggestions(task);
                }}
                style={Styles.suggestionItemWrapper}
            >
                <View style={Styles.suggestionTextWrap}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={"tail"}
                        style={[Styles.suggestionText, { fontSize: 20 }]}
                    >
                        {name}
                    </Text>
                </View>
                <DurationText
                    duration={defaultDuration}
                    short={true}
                    style={[
                        Styles.suggestionText,
                        Styles.suggestionDurationText
                    ]}
                />
            </TouchableOpacity>
        );
        // }
    };

    _onTapCheckBox = value => {
        // console.log("_onTapCheckBox -> value", value);
        this.setState({ setAsDefault: value });
    };

    _onPickerConfirm = pickedValues => {
        let durationSecs = pickedValues[0] * 3600 + pickedValues[1] * 60;
        this._onTaskDurationChanged(durationSecs);
    };

    _bannerError = e => {
        console.log("_bannerError");
        console.log(e);
        this.setState({ forcePro: true });
    };

    render() {
        console.log("Render TaskDetail.");
        // console.log("this.state", this.state);

        let statusBarHeight =
            Platform.OS == "android" ? StatusBar.currentHeight : 20;
        let maxHeight_autocomplete =
            this.state.keyboardHeight -
            statusBarHeight -
            HEADER_HEIGHT -
            AUTOCP_INPUT_HEIGHT;

        // console.log("maxHeight", maxHeight_autocomplete);

        let hours = calcWholeHours(this.state.alarmTask.duration);
        let minutes = calcMinutes(this.state.alarmTask.duration, hours);
        // console.log("this.currName", this.currName);

        let durationDisplayed =
            this.state.alarmTask.duration != null
                ? this.state.alarmTask.duration
                : this.state.alarmTask.task.defaultDuration;
        return (
            <ScrollView
                contentContainerStyle={{
                    flex: 1,
                    backgroundColor: Colors.backgroundGrey,
                    alignSelf: "stretch",
                    flexGrow: 1
                    // backgroundColor: "red"
                }}
                // NOTE: Must be 'always' instead of 'handled', otherwise keyboard is sometimes
                //       dismissed while scrolling Suggestions list
                keyboardShouldPersistTaps="always"
                scrollEnabled={false}
            >
                <View style={{ flex: 1, backgroundColor: Colors.brandMidGrey }}>
                    <KeyboardAvoidingView
                        behavior="padding"
                        // style={{ flex: 1 }}
                        style={StyleSheet.absoluteFill}
                        keyboardVerticalOffset={
                            Platform.OS == "ios"
                                ? Header.HEIGHT + 20
                                : Header.HEIGHT + 20 - 500 // NOTE: -500 is for Android-specific quirk
                        }
                    >
                        <View
                            style={{
                                flex: 1
                            }}
                        >
                            <View style={[Styles.deleteWrapper]}>
                                <TouchableOpacity
                                    style={Styles.DeleteButton}
                                    onPress={this._onDeleteTask.bind(this)}
                                >
                                    <Text
                                        style={{ color: "white", fontSize: 18 }}
                                    >
                                        Delete
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                    <View
                        style={{
                            backgroundColor: Colors.brandMidGrey,
                            margin: scaleByFactor(10, 0.5)
                        }}
                    >
                        <Text
                            style={[TextStyle.labelText, Styles.fieldLabelText]}
                        >
                            Task
                        </Text>
                        <Autocomplete
                            placeholder="Take a shower..."
                            defaultValue={this.currName}
                            data={
                                this.currName &&
                                this.state.filteredSuggestions != null &&
                                this.state.filteredSuggestions.length > 0
                                    ? Array.from(this.state.filteredSuggestions)
                                    : []
                            }
                            onChangeText={this._onTaskNameChange.bind(this)}
                            renderItem={this._renderSuggestionItem.bind(this)}
                            containerStyle={Styles.autocompleteContainer}
                            hideResults={this.state.hideSuggestions}
                            renderTextInput={this._renderAutoCompInput}
                            inputContainerStyle={{
                                borderColor: "transparent",
                                paddingHorizontal: 0
                            }}
                            listContainerStyle={[Styles.suggestionsContainer]}
                            listStyle={{
                                backgroundColor: Colors.brandMidGrey,
                                elevation: 3,
                                margin: 0,
                                borderLeftWidth: 0,
                                borderRightWidth: 0,
                                maxHeight: maxHeight_autocomplete
                            }}
                        />

                        <View
                            style={{
                                flexDirection: "row",
                                alignContent: "center",
                                alignItems: "center",
                                position: "absolute",
                                top: scaleByFactor(35, 0.6) + 35,
                                backgroundColor: Colors.brandMidGrey

                                // borderRadius: 7,
                                // backgroundColor: "#c8d6e5",
                                // padding: 5,
                                // borderWidth: 1

                                // backgroundColor: "green"
                            }}
                        >
                            <LabeledDurationInput
                                labelText="Duration"
                                time={durationDisplayed}
                                onChange={this._onTaskDurationChanged.bind(
                                    this
                                )}
                                inputFontSize={scaleByFactor(36, 0.55)}
                                separation={7}
                                style={{
                                    backgroundColor: "transparent",
                                    // backgroundColor: "red",
                                    flex: 2
                                }}
                                showDurationPicker={() => {
                                    this._nameInputRef.blur();
                                    this.setState({ showDurationPicker: true });
                                }}
                            />
                            {this.state.currNameHasMatch &&
                                this.state.alarmTask.duration !=
                                    this.state.alarmTask.task
                                        .defaultDuration && (
                                    <View
                                        style={{
                                            flex: 1,
                                            alignSelf: "stretch",
                                            alignContent: "flex-end",
                                            alignItems: "flex-end",
                                            flexDirection: "row",
                                            justifyContent: "flex-end",
                                            // paddingLeft: 10,
                                            paddingBottom: 7
                                            // borderBottomColor: "black",
                                            // borderBottomWidth: 1
                                            // backgroundColor: "green"
                                        }}
                                    >
                                        <View style={{ width: scale(8) }} />
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 10,
                                                flexDirection: "row"
                                                // backgroundColor: "blue",
                                                // flex: 1
                                            }}
                                            onPress={() => {
                                                this.setState({
                                                    showDurationInfo: true
                                                });
                                            }}
                                        >
                                            {/* <EntypoIcon
                                                name="info-with-circle"
                                                size={15}
                                            />
                                            <View style={{ width: 5 }} /> */}
                                            <Text style={[TextStyle.labelText]}>
                                                Set as default
                                            </Text>
                                        </TouchableOpacity>
                                        <CheckBox
                                            onPress={() => {
                                                this._onTapCheckBox(
                                                    !this.state.setAsDefault
                                                );
                                            }}
                                            checked={this.state.setAsDefault}
                                            hitSlop={{
                                                top: 15,
                                                bottom: 15,
                                                left: 5,
                                                right: 15
                                            }}
                                        />
                                    </View>
                                )}
                        </View>
                    </View>
                    {Upgrades.pro != true && this.state.keyboardHeight == 0 && (
                        <AdWrapper
                            animate={true}
                            delay={250}
                            screen={"TaskDetail"}
                            forcePro={this.state.forcePro}
                            style={{
                                position: "absolute",
                                top: SCREEN_HEIGHT * 0.25,
                                alignSelf: "center"
                            }}
                            proAdvStyle={{
                                height: SCREEN_WIDTH * 0.8,
                                width: SCREEN_WIDTH * 0.8
                            }}
                            hide={this.state.keyboardHeight != 0}
                            navigation={this.props.navigation}
                            pubBannerProps={{
                                adSize: "mediumRectangle",
                                // adUnitID: "ca-app-pub-3940256099942544/6300978111",
                                adUnitID:
                                    "ca-app-pub-5775007461562122/9954191195",
                                testDevices: [AdMobBanner.simulatorId],
                                onAdFailedToLoad: this._bannerError,
                                onAdLoaded: () => {
                                    console.log("adViewDidReceiveAd");
                                },
                                style: {
                                    alignSelf: "center",
                                    height: SCREEN_WIDTH * 0.8,
                                    width: SCREEN_WIDTH * 0.8
                                }
                            }}
                            onPressProAdv={() =>
                                this.setState({ showProAdUpgradePopup: true })
                            }
                            ref={elem => (this._adWrapRef = elem)}
                            // borderColor={Colors.brandDarkGrey}
                        />
                    )}
                </View>
                {this.state.showDurationPicker && (
                    <PickerActionSheet
                        initialValues={[hours, minutes]}
                        onValueSelected={this._onPickerConfirm}
                        onPressedCancel={() =>
                            this.setState({ showDurationPicker: false })
                        }
                        dataSets={[hourRange(), minuteRange()]}
                        dataLabels={["hours", "min"]}
                        title={"Duration"}
                    />
                )}
                {this.state.showProAdUpgradePopup && (
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
                        headerTextStyle={{ color: Colors.brandLightOpp }}
                        bodyText={
                            "Upgrade to Clockulate Pro to unlock more features!\n\n" +
                            "Would you like to learn more?"
                        }
                        dismissConfig={{
                            onPress: () => {
                                console.log("Dismissed Upgrade popup");
                                this.setState({ showProAdUpgradePopup: false });
                            },
                            text: "Dismiss"
                        }}
                        confirmConfig={{
                            onPress: () => {
                                console.log(
                                    "Confirmed Upgrade popup: Going to Upgrades screen"
                                );
                                this.setState({ showProAdUpgradePopup: false });
                                this.props.navigation.navigate("Upgrade");
                            },
                            text: "Go to Upgrades"
                        }}
                    />
                )}
                {/* <View style={{ position: "absolute", height: 1, backgroundColor: "black", left: 0, right:0, top: 140 }} /> */}
                {this.state.showDurationInfo && (
                    <ClkAlert
                        contHeight={"small"}
                        dismissConfig={{
                            onPress: () => {
                                console.log("Dismissed Plugin popup");
                                this.setState({ showDurationInfo: false });
                            },
                            text: "Got it!"
                        }}
                        title="Default Durations"
                        headerTextStyle={{ color: Colors.brandLightOpp }}
                        bodyText={`Check this box if you would like new tasks with this name to be created with the current duration (${formatDuration(
                            durationDisplayed
                        )})`}
                        headerIcon={
                            <EntypoIcon
                                name="info"
                                size={33}
                                // color={Colors.brandLightOpp}
                                color={Colors.brandLightPurple}
                            />
                        }
                    />
                )}
            </ScrollView>
        );
    }
}

export default TaskDetail;

const Styles = StyleSheet.create({
    deleteWrapper: {
        alignSelf: "stretch",
        position: "absolute",
        bottom: isIphoneX() ? 34 : 0,
        right: 0,
        left: 0
    },
    DeleteButton: {
        padding: 10,
        marginHorizontal: scaleByFactor(10, 0.5),
        backgroundColor: Colors.deleteBtnRed,
        alignSelf: "stretch",
        height: 50,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center"
    },
    fieldLabelText: {
        // paddingBottom: 0,
        backgroundColor: "transparent"
    },
    fieldText: {
        fontSize: scaleByFactor(33, 0.55)
    },
    autocompleteContainer: {
        flex: 1,
        left: 0,
        position: "absolute",
        right: 0,
        top: 17,
        minHeight: scaleByFactor(35, 0.6),
        paddingHorizontal: 0,
        zIndex: 1,
        borderWidth: 0,
        borderColor: "transparent",
        backgroundColor: Colors.brandMidGrey
    },
    suggestionsContainer: {
        shadowOffset: {
            height: 5,
            width: 0
        },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3,
        shadowColor: "black",
        backgroundColor: "red",
        zIndex: 999
    },
    suggestionItemWrapper: {
        flexDirection: "row",
        height: 55,
        justifyContent: "space-between",
        padding: 5,
        alignContent: "center",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: Colors.disabledGrey,
        // backgroundColor: "#dfdee0"
        backgroundColor: Colors.brandMidGrey
    },
    suggestionDurationText: {
        fontSize: 16,
        fontFamily: "Gurmukhi MN",
        textAlign: "right"
    },
    suggestionTextWrap: {
        flexBasis: 1,
        flexGrow: 1,
        alignSelf: "stretch",
        justifyContent: "space-around"
    },
    suggestionText: {
        textAlign: "left",
        textAlignVertical: "center",
        fontFamily: "Gurmukhi MN",
        color: Colors.brandLightOpp
    }
});
