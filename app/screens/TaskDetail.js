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
    Button,
    Dimensions,
    Keyboard
} from "react-native";
import { Icon } from "react-native-elements";
import EntypoIcon from "react-native-vector-icons/Entypo";
import IonIcon from "react-native-vector-icons/Ionicons";
import { NavigationActions } from "react-navigation";
import Autocomplete from "react-native-autocomplete-input";
import { isIphoneX } from "react-native-iphone-x-helper";

import realm from "../data/DataSchemas";
import LabeledInput from "../components/labeled-input";
import LabeledDurationInput from "../components/labeled-duration-input";
import { TaskModel, AlarmTaskModel } from "../data/models";
import ScreenStyles from "../styles/screens";
import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { scale, scaleByFactor } from "../util/font-scale";
import DurationText from "../components/duration-text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_HEIGHT = 20;
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
            drawerLockMode: "locked-closed",
            headerStyle: {
                backgroundColor: Colors.brandDarkGrey
            },
            headerTitleStyle: {
                color: Colors.brandLightGrey
            },
            headerRight: (
                <TouchableOpacity
                    style={{ marginRight: 15 }}
                    onPress={() => navigation.state.params.handleSave()}
                >
                    <IonIcon
                        name="md-done-all"
                        size={30}
                        color={Colors.brandOffWhiteBlue}
                    />
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
        console.log("nav params", params);

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
                suggestions: taskSuggestions,
                hideSuggestions: true,
                keyboardHeight: null
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
                suggestions: taskSuggestions,
                hideSuggestions: true,
                keyboardHeight: null,
                newTask: false
            };
        }

        this.initialName = this.state.alarmTask.task.name;
        this.currName = this.state.alarmTask.task.name;
    }

    componentWillMount() {
        console.debug("TaskDetail --- ComponentDidMount");
        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions
        console.log("Binding handleSave task");
        this.props.navigation.setParams({
            handleSave: this.handleSave.bind(this)
        });
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

    keyboardWillShow = event => {
        console.log("keyboardWillShow -------");
        console.log(event.endCoordinates);
        console.log(SCREEN_HEIGHT);
        this.setState({ keyboardHeight: event.endCoordinates.height });
        // setTimeout(() => {
        //     this.interactiveRef.snapTo({ index: 2 }); // snap to "keyboard" snapPoint.
        // }, 0);
        // }
    };

    keyboardWillHide = event => {
        console.log("keyboardWillHide");
        this.setState({ keyboardHeight: null, hideSuggestions: true });
    };

    handleSave() {
        // Determine whether we need to create a new AlarmTask+Task, create a new AlarmTask for an existing task, or Update an existing AlarmTask
        // There are several things to think about:
        // 1. Does the current task-name already exist in the DB as a 'Task'?
        // 2. Is this a new AlarmTask (user pushed 'Add New Task' button)?, or is it an existing AlarmTask that is being edited?

        console.log("TaskDetail:handleSave: this.state", this.state);

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
        let duration =
            prevAlarmTask.duration != null
                ? prevAlarmTask.duration
                : prevAlarmTask.task.defaultDuration;

        // Check if a Task exists in the DB with the current name (this.currName)
        let taskLookup = realm
            .objects("Task")
            .filtered(`name = "${this.currName}"`);

        if (taskLookup.length == 1) {
            console.log("Found 1 task with name: " + this.currName);
            console.log("taskLookup[0]", taskLookup[0]);

            prevAlarmTask.task = taskLookup[0];

            /* Even though we just found an existing Task with the set name, its duration probably differs from
                that shown in the UI. Its possible that the UI is displaying the 'defaultDuration' of the old Task.
                Therefore, apply the UI duration to the duration property of the AlarmTask being edited, otherwise 
                the duration being displayed will be lost/ignored.
            */
            prevAlarmTask.duration = duration;
        } else if (taskLookup.length == 0) {
            console.log("No tasks found with name: " + this.currName);
            newTask = new TaskModel();

            newTask.name = this.currName; // apply current name to new Task

            // apply currently set duration to new Task's 'defaultDuration'
            newTask.defaultDuration = duration;
        } else {
            console.warn(
                "ERROR: Found more than 1 task with name: " + this.currName
            );
            // FIXME: Apparently this occurs in some situations... for now just ignore and grab the first one.
            prevAlarmTask.task = taskLookup[0];
        }

        if (newTask) {
            // Create a new Task, and depending on whether this 'isNewAlarmTask':
            //  - false: update the alarmTask with the new Task
            //  - true: create a new AlarmTask and Task

            // console.log(this.state);
            console.log(
                "Creating new Task. 'isNewAlarmTask': " + isNewAlarmTask
            );
            prevAlarmTask.task = newTask;
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
                console.log("Creating a new AlarmTask");
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
                    existingTask.defaultDuration = prevAlarmTask.duration
                        ? prevAlarmTask.duration
                        : prevAlarmTask.task.defaultDuration
                            ? prevAlarmTask.task.defaultDuration
                            : 600;

                    let newAlarmTask = new AlarmTaskModel(
                        existingTask,
                        orderOfAlmTask
                    );

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
                console.log("Updating existing AlarmTask");
                realm.write(() => {
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
        let alarmTaskRlmObject = realm.objectForPrimaryKey(
            "AlarmTask",
            this.state.alarmTask.id
        );
        if (alarmTaskRlmObject) {
            realm.write(() => {
                realm.delete(alarmTaskRlmObject);
            });
        }
        this.state.onSaveState();
        this.state.willNavigateBack();
        this.props.navigation.dispatch(NavigationActions.back());
    }

    _onTaskNameChange(text) {
        this.currName = text;
        // const updatedAlmTask = this.state.alarmTask;
        // updatedAlmTask.task.name = text;
        // this.setState({ alarmTask: updatedAlmTask });
        if (this.initialName !== text) {
            this.nameChanged = true;
        }
        this.setState({ hideSuggestions: false });
    }

    _onTaskDurationChanged(duration) {
        // console.debug("Task duration changed: ", duration);
        const updatedAlmTask = this.state.alarmTask;
        updatedAlmTask.duration = duration;
        this.setState({ alarmTask: updatedAlmTask });
    }

    /* Creates a new AlarmTask for the Task selected from the selection dropdown, then updates the UI
        with the necessary info. */
    _loadTaskFromSuggestions(task) {
        console.log("_loadTaskFromSuggestions");
        let { alarmTask } = this.state;
        alarmTask.task.name = task.name;
        alarmTask.task.id = task.id;
        alarmTask.task.defaultDuration = task.defaultDuration;

        this.currName = alarmTask.task.name;
        this.setState({ alarmTask: alarmTask, hideSuggestions: true });
    }

    _renderAutoCompInput = props => {
        return (
            <View>
                <TextInput
                    style={[
                        Styles.fieldText,
                        TextStyle.editableText,
                        props.textInputStyle,
                        {
                            // height: inputHeight + scaleByFactor(23, 0.5),
                            paddingVertical: 2,
                            margin: 0,
                            borderWidth: 0,
                            borderColor: "transparent",
                            paddingHorizontal: 0
                            // backgroundColor: "#ededed"
                            // borderRadius: 5
                        }
                    ]}
                    textAlign={"left"}
                    // underlineColorAndroid="transparent"
                    placeholder={props.placeholder}
                    onChangeText={props.onChangeText}
                    defaultValue={props.defaultValue}
                    // onBlur={e => {
                    //     // console.log("TextInput blurred: " + e.nativeEvent.text);
                    //     this._onBlur(this);
                    //     if (onBlur != null) onBlur(e);
                    // }}
                    // onFocus={() => {
                    //     this._onFocus.bind(this);
                    //     if (onFocus != null) onFocus();
                    // }}
                    blurOnSubmit={true}
                    // onContentSizeChange={e =>
                    //     this.updateSize(e.nativeEvent.contentSize.height)
                    // }
                    multiline={false}
                    underlineColorAndroid="transparent"
                />
                {this.currName != "" && (
                    <TouchableOpacity
                        onPress={() => {
                            this.currName = "";
                            this.setState(this.state);
                        }}
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
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
        let { name, defaultDuration } = task;
        return (
            <TouchableOpacity
                onPress={() => {
                    console.log("onPress");
                    this._loadTaskFromSuggestions(task);
                }}
                style={Styles.suggestionItemWrapper}
            >
                <Text style={[Styles.suggestionText, { fontSize: 20 }]}>
                    {name}
                </Text>
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
    };

    render() {
        console.log("Render TaskDetail.");
        // console.log("this.state", this.state);

        // console.log("this.currName", this.currName);
        let filteredSuggestions = this.state.suggestions.filtered(
            `name CONTAINS[c] "${this.currName}"`
        );

        // for (let index = 0; index < this.state.suggestions.length; index++) {
        //     const element = this.state.suggestions[index];
        //     console.log("element", element);
        // }
        return (
            <View style={ScreenStyles.TaskScreen}>
                <View>
                    <Text style={[TextStyle.labelText, Styles.fieldLabelText]}>
                        TASK NAME
                    </Text>
                    <Autocomplete
                        placeholder="Enter a task name"
                        defaultValue={this.currName}
                        data={
                            this.currName && filteredSuggestions.length > 0
                                ? Array.from(filteredSuggestions)
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
                            backgroundColor: Colors.backgroundGrey,
                            elevation: 3,
                            margin: 0,
                            borderLeftWidth: 0,
                            borderRightWidth: 0,
                            maxHeight:
                                SCREEN_HEIGHT -
                                HEADER_HEIGHT -
                                110 -
                                this.xtraKeyboardHeight -
                                this.state.keyboardHeight
                        }}
                        // listStyle={[Styles.suggestionsContainer]}
                    />

                    <LabeledDurationInput
                        labelText="DURATION"
                        time={
                            this.state.alarmTask.duration
                                ? this.state.alarmTask.duration
                                : this.state.alarmTask.task.defaultDuration
                        }
                        onChange={this._onTaskDurationChanged.bind(this)}
                        inputFontSize={scaleByFactor(37, 0.55)}
                        separation={7}
                        style={{
                            position: "absolute",
                            top: SCREEN_HEIGHT * 0.1,
                            left: 0
                        }}
                    />
                    <TouchableOpacity
                        style={Styles.DeleteButton}
                        onPress={this._onDeleteTask.bind(this)}
                    >
                        <Text style={{ color: "white", fontSize: 18 }}>
                            Delete
                        </Text>
                    </TouchableOpacity>
                    <View />
                </View>
            </View>
        );
    }
}

export default TaskDetail;

const Styles = StyleSheet.create({
    DeleteButton: {
        padding: 10,
        backgroundColor: Colors.deleteBtnRed,
        alignSelf: "stretch",
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: SCREEN_HEIGHT * 0.2,
        right: 0,
        left: 0
    },
    fieldLabelText: {
        // paddingBottom: 0,
        backgroundColor: "transparent"
    },
    fieldText: {
        fontSize: scaleByFactor(25, 0.6)
    },
    autocompleteContainer: {
        flex: 1,
        left: 0,
        position: "absolute",
        right: 0,
        top: 20,
        paddingHorizontal: 0,
        zIndex: 1,
        borderWidth: 0,
        borderColor: "transparent"
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
        zIndex: 999
    },
    suggestionItemWrapper: {
        flexDirection: "row",
        height: 55,
        justifyContent: "space-between",
        padding: 5,
        alignContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: Colors.disabledGrey,
        // backgroundColor: "#dfdee0"
        backgroundColor: Colors.backgroundGrey
    },
    suggestionDurationText: {
        fontSize: 18
    },
    suggestionText: {
        textAlign: "center",
        textAlignVertical: "center"
    }
});
