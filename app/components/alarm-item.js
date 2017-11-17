/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Easing
} from "react-native";
import { createAnimatableComponent } from "react-native-animatable";
import Svg, { Defs, Circle, RadialGradient, Stop } from "react-native-svg";
import realm from "../data/DataSchemas";
import moment from "moment";

import DurationText from "./duration-text";
// import CheckBox from "react-native-check-box";
import { CheckBox } from "native-base";
import Colors from "../styles/colors";
import { TaskListStyle, TaskItemStyle } from "../styles/list";
import { TextStyle } from "../styles/text";
import Swipeout from "react-native-swipeout";
import { ListStyle, AlarmListStyle } from "../styles/list";

const AnimatableSwipeout = createAnimatableComponent(Swipeout);

class AlarmItem extends React.PureComponent {
    /*
    Props: 
     */

    // _onPressItem = item => {
    //     // console.debug("_onPressItem called");

    //     // console.log("showDelete", this.state.showDelete);
    //     if (!("showDelete" in this.state) || isNaN(this.state.showDelete)) {
    //         this.props.navigation.navigate("AlarmDetail", {
    //             alarm: item,
    //             reloadAlarms: this.reloadAlarms
    //         });
    //     } else {
    //         let tempState = this.state;
    //         delete tempState.showDelete;
    //         this.setState(tempState);
    //     }
    // };

    render() {
        console.debug("alarm-item render(): ", this.props.alarm);
        // console.log("index", index);

        const config = {
            velocityThreshold: 0.3,
            directionalOffsetThreshold: 80
        };

        // Handle showing or hiding the delete button
        let deleteButton;
        let touchedOpacity = 0.2;
        // if ("showDelete" in this.state) {
        //     if (index === this.state.showDelete) {
        //         console.log("Delete button is showing");
        //     }
        //     touchedOpacity = 1;
        // }

        // Grab correct colors depending on whether alarm is enabled/disabled
        let textColor, buttonColor;
        if (this.props.alarm.enabled) {
            textColor = Colors.black;
            buttonColor = Colors.buttonOnGreen;
        } else {
            textColor = Colors.disabledGrey;
            buttonColor = Colors.disabledGrey;
        }

        // Format times
        let wakeTimeMoment = moment.utc(this.props.alarm.wakeUpTime).local();
        let fWakeUpTime = wakeTimeMoment.format("h:mm");
        let amPmWakeUpTime = wakeTimeMoment.format("A");

        let arriveTimeMoment = moment.utc(this.props.alarm.arrivalTime).local();
        let fArriveTime = arriveTimeMoment.format("h:mm");
        let amPmArriveTime = arriveTimeMoment.format("A");

        var swipeoutButton = [
            {
                text: "Delete",
                backgroundColor: Colors.deleteBtnRed,
                onPress: this.props.onDelete.bind(this, this.props.alarm)
            }
        ];
        // let { listItemAnimation } = this.state;
        return (
            <AnimatableSwipeout right={swipeoutButton} duration={1000}>
                <TouchableOpacity
                    style={[AlarmListStyle.alarmRow, ListStyle.item]}
                    activeOpacity={touchedOpacity}
                    id={this.props.alarm.id}
                    label={this.props.alarm.label}
                    onPress={this.props.onPress.bind(this, this.props.alarm)}
                >
                    <TouchableOpacity
                        style={AlarmListStyle.toggleButton}
                        onPressOut={this.props.onToggle.bind(
                            this,
                            this.props.alarm
                        )}
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
                        <Text style={{ color: textColor }}>
                            {this.props.alarm.label}
                        </Text>
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
                </TouchableOpacity>
            </AnimatableSwipeout>
        );
    }
}

export default AlarmItem;
