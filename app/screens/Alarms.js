/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Animated,
    Easing
} from "react-native";
import DeleteButton from "../components/delete-button";
import GestureRecognizer from "react-native-swipe-gestures";
import Svg, { Defs, Circle, RadialGradient, Stop } from "react-native-svg";
import PushNotification from "react-native-push-notification";
import PushController from "../alarmservice/PushController";
import Swipeout from "react-native-swipeout";
import realm from "../data/DataSchemas";
import moment from "moment";

import Colors from "../styles/colors";
import { ListStyle, AlarmListStyle } from "../styles/list";
import { TextStyle } from "../styles/text";

class Alarms extends Component {
    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    constructor() {
        super();
        console.log("Alarm -- Constructor");
        console.log("Fetching Alarms...");
        this.state = {};
        this.state.alarms = this.slideIn = Animated.timing(this.state.slide, {
            toValue: { x: 200, y: 0 },
            duration: 2000,
            delay: 1000,
            easing: Easing.in(Easing.ease)
        });
        this.state = {
            alarms: realm.objects("Alarm"), // TODO: filter by 'visible'=true
            slide: new Animated.ValueXY({ x: 0, y: 0 })
        };
    }

    componentDidMount() {
        console.debug("Alarms --- ComponentDidMount");

        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions
        this.props.navigation.setParams({
            handleAddAlarm: this.handleAddAlarm.bind(this)
        });
    }

    reloadAlarms = () => {
        // console.debug("Reloading alarms list");
        this.setState({ alarms: realm.objects("Alarm") }); // TODO: filter by 'visible'=true
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
    handleAddAlarm() {
        // console.log("Adding alarm");
        this.props.navigation.navigate("AlarmDetail", {
            newAlarm: true,
            reloadAlarms: this.reloadAlarms
        });
    }

    _keyExtractor = item => {
        return item.id;
    };

    _onPressItem = item => {
        // console.debug("_onPressItem called");

        // console.log("showDelete", this.state.showDelete);
        if (!("showDelete" in this.state) || isNaN(this.state.showDelete)) {
            this.props.navigation.navigate("AlarmDetail", {
                alarm: item,
                reloadAlarms: this.reloadAlarms
            });
        } else {
            let tempState = this.state;
            delete tempState.showDelete;
            this.setState(tempState);
        }
    };

    _onPressDelete = (item, event) => {
        // console.log("onPressDelete: ", item);
        realm.write(() => {
            realm.delete(item);
        });
        let tempState = this.state;
        delete tempState.showDelete;
        this.setState(tempState);
    };

    _onSwipeLeft(alarmIndex, state) {
        // console.log("You swiped left! Showing delete button");
        this.setState({ showDelete: alarmIndex });
    }

    _onAlarmToggled = alarm => {
        // console.log("alarm toggled: ", alarm);
        realm.write(() => {
            alarm.enabled = !alarm.enabled;
        });

        if (alarm.enabled) {
            console.log("Setting alarm");
            PushNotification.localNotificationSchedule({
                message: "wake up ho!", // (required)
                date: new Date(Date.now() + 30 * 1000) // in 60 secs
            });
        }

        // console.log("this.state", this.state);
        this.setState(this.state);
    };

    // _makeDeleteButton(item) {
    //     const slideStyle = this.state.slide.transform;
    //     return (
    //         <Animated.View
    //             style={[
    //                 {
    //                     position: "absolute",
    //                     height: 120,
    //                     width: 100,
    //                     backgroundColor: Colors.deleteBtnRed,
    //                     right: 0,
    //                     alignSelf: "center",
    //                     justifyContent: "center",
    //                     borderColor: "black",
    //                     shadowColor: "black",
    //                     zIndex: 1
    //                 },
    //                 slideStyle
    //             ]}
    //         >
    //             <TouchableOpacity
    //                 onPress={this._onPressDelete.bind(this, item)}
    //             >
    //                 <Text
    //                     style={{
    //                         textAlign: "center",
    //                         color: "white",
    //                         fontSize: 17
    //                     }}
    //                 >
    //                     Delete
    //                 </Text>
    //             </TouchableOpacity>
    //         </Animated.View>
    //     );
    // }

    _makeOverlay() {
        return (
            <TouchableOpacity
                style={{
                    position: "absolute",
                    height: this.height,
                    width: this.width,
                    backgroundColor: "transparent",
                    left: 0,
                    top: 0,
                    alignSelf: "center",
                    justifyContent: "center"
                }}
                onPress={() => {
                    let tempState = this.state;
                    delete tempState.showDelete;
                    this.setState(tempState);
                }}
            />
        );
    }

    _renderItem = ({ item, index }) => {
        // console.debug("alarm: ", item);
        // console.log("index", index);
        const config = {
            velocityThreshold: 0.3,
            directionalOffsetThreshold: 80
        };

        // Handle showing or hiding the delete button
        let deleteButton;
        let touchedOpacity = 0.2;
        if ("showDelete" in this.state) {
            if (index === this.state.showDelete) {
                console.log("Delete button is showing");
            }
            touchedOpacity = 1;
        }

        // Grab correct colors depending on whether alarm is enabled/disabled
        let textColor, buttonColor;
        if (item.enabled) {
            textColor = Colors.black;
            buttonColor = Colors.buttonOnGreen;
        } else {
            textColor = Colors.disabledGrey;
            buttonColor = Colors.disabledGrey;
        }

        // Format times
        let wakeTimeMoment = moment.utc(item.wakeUpTime).local();
        let fWakeUpTime = wakeTimeMoment.format("h:mm");
        let amPmWakeUpTime = wakeTimeMoment.format("A");

        let arriveTimeMoment = moment.utc(item.arrivalTime).local();
        let fArriveTime = arriveTimeMoment.format("h:mm");
        let amPmArriveTime = arriveTimeMoment.format("A");

        var swipeoutButton = [
            {
                text: "Delete",
                backgroundColor: Colors.deleteBtnRed,
                onPress: this._onPressDelete.bind(this, item)
            }
        ];
        return (
            <Swipeout right={swipeoutButton}>
                <TouchableOpacity
                    style={[AlarmListStyle.alarmRow, ListStyle.item]}
                    activeOpacity={touchedOpacity}
                    id={item.id}
                    label={item.label}
                    onPress={this._onPressItem.bind(this, item)}
                >
                    <TouchableOpacity
                        style={AlarmListStyle.toggleButton}
                        onPressOut={this._onAlarmToggled.bind(this, item)}
                    >
                        <Svg height="100" width="70">
                            <Defs>
                                <RadialGradient
                                    id="mainGrad"
                                    cx="35"
                                    cy="35"
                                    rx="50"
                                    ry="50"
                                    fx="23"
                                    fy="47"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <Stop
                                        offset="0"
                                        stopColor={buttonColor}
                                        stopOpacity="1"
                                    />
                                    <Stop
                                        offset="1"
                                        stopColor={Colors.brandDarkGrey}
                                        stopOpacity="1"
                                    />
                                </RadialGradient>
                            </Defs>

                            <Circle
                                cx="25"
                                cy="45"
                                r="22"
                                fill="url(#mainGrad)"
                            />
                        </Svg>
                    </TouchableOpacity>
                    <View style={AlarmListStyle.infoContainer}>
                        <Text
                            style={[
                                AlarmListStyle.timeText,
                                TextStyle.timeText,
                                { color: textColor }
                            ]}
                        >
                            {fWakeUpTime}
                            <Text style={TextStyle.AmPm}>
                                {" " + amPmWakeUpTime}
                            </Text>
                        </Text>
                        <Text style={{ color: textColor }}>{item.label}</Text>
                        <Text
                            style={[
                                {
                                    alignSelf: "flex-end",
                                    fontSize: 17,
                                    color: textColor
                                },
                                TextStyle.timeText
                            ]}
                        >
                            {fArriveTime}
                            <Text
                                style={[{ fontSize: 12 }, TextStyle.timeText]}
                            >
                                {" " + amPmArriveTime}
                            </Text>
                        </Text>
                    </View>
                    {/* {deleteButton} */}
                </TouchableOpacity>
            </Swipeout>
        );
    };

    render() {
        console.debug("AlarmsList Render");
        // console.debug(this.state);
        let overlay;
        if ("showDelete" in this.state) {
            overlay = this._makeOverlay();
        }
        return (
            <View style={ListStyle.container}>
                <PushController />
                {overlay}
                <FlatList
                    data={this.state.alarms}
                    renderItem={this._renderItem}
                    keyExtractor={this._keyExtractor}
                    extraData={this.state}
                />
            </View>
        );
    }
}

export default Alarms;
