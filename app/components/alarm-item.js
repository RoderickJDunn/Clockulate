/**
 * Created by rdunn on 2017-07-15.
 */

import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback
} from "react-native";
import Svg, { Defs, Circle, RadialGradient, Stop } from "react-native-svg";
import moment from "moment";
import Interactable from "react-native-interactable";

import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { ListStyle, AlarmListStyle } from "../styles/list";
import { scaleByFactor } from "../util/font-scale";

class AlarmItem extends React.PureComponent {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    // _onPressItem = item => {
    //     // console.debug("_onPressItem called");

    //     // //console.log("showDelete", this.state.showDelete);
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

    constructor(props) {
        super(props);
        console.log("AlarmItem", "- constructor");
        this.state = {
            switchValue: false
        };
    }

    componentDidMount() {
        console.log("AlarmItem - Component did mount ");
    }

    render() {
        console.log("AlarmItem", "- render");
        // console.debug("alarm-item render(): ", this.props);
        // //console.log("index", index);

        const config = {
            velocityThreshold: 0.3,
            directionalOffsetThreshold: 80
        };

        // Handle showing or hiding the delete button
        let deleteButton;
        let touchedOpacity = 0.2;
        // if ("showDelete" in this.state) {
        //     if (index === this.state.showDelete) {
        //         //console.log("Delete button is showing");
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
        // let wakeTimeMoment = moment.utc(this.props.alarm.wakeUpTime).local();
        let wakeTimeMoment = moment(this.props.alarm.wakeUpTime).local();
        let fWakeUpTime = wakeTimeMoment.format("h:mm");
        let amPmWakeUpTime = wakeTimeMoment.format("A");

        // let arriveTimeMoment = moment.utc(this.props.alarm.arrivalTime).local();
        let arriveTimeMoment = moment(this.props.alarm.arrivalTime).local();
        let fArriveTime = arriveTimeMoment.format("h:mm");
        let amPmArriveTime = arriveTimeMoment.format("A");

        let interactableRef = el => (this.interactiveRef = el);

        if (this.props.close == true) {
            setTimeout(() => {
                if (this.interactiveRef) {
                    this.interactiveRef.snapTo({ index: 0 });
                }
            }, 0);
        }

        // let { listItemAnimation } = this.state;
        return (
            <View
                style={{
                    borderBottomColor: Colors.disabledGrey,
                    borderBottomWidth: 1
                }}
            >
                <Interactable.View
                    ref={interactableRef}
                    style={[AlarmListStyle.alarmRow, ListStyle.item]}
                    horizontalOnly={true}
                    snapPoints={[
                        { x: 0, id: "closed" },
                        { x: -100, id: "active" }
                    ]}
                    dragWithSpring={{ tension: 1000, damping: 0.5 }}
                    animatedNativeDriver={true}
                    onSnap={e => {
                        this.props.onSnap(e.nativeEvent.id);
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={touchedOpacity}
                        id={this.props.alarm.id}
                        label={this.props.alarm.label}
                        onPress={() => this.props.onPress(this.props.alarm)}
                        style={{
                            width: this.width - 20, // subtract padding
                            flexDirection: "row"
                        }}
                    >
                        {/* onStartShouldSetResponder: returning true prevents touches from bubbling up further! */}
                        <View
                            style={[AlarmListStyle.toggleButton]}
                            onStartShouldSetResponder={evt => true}
                        >
                            <Switch
                                value={this.props.alarm.enabled}
                                onValueChange={val => {
                                    console.log("Pressed switch");
                                    this.props.onToggle(this.props.alarm);
                                }}
                                onTintColor={"rgba(50, 163, 50, 1)"}
                                tintColor={"rgba(200, 200, 200, 1)"}
                            />
                        </View>
                        <View style={AlarmListStyle.infoContainer}>
                            <Text
                                style={[
                                    {
                                        alignSelf: "flex-end",
                                        position: "absolute",
                                        fontSize: scaleByFactor(25, 0.3),
                                        top: 0,
                                        right: 0,
                                        color: textColor
                                    },
                                    TextStyle.timeText
                                ]}
                            >
                                {fArriveTime}
                                <Text
                                    style={[
                                        { fontSize: scaleByFactor(22, 0.3) },
                                        TextStyle.timeText
                                    ]}
                                >
                                    {" " + amPmArriveTime}
                                </Text>
                            </Text>
                            <Text
                                style={[
                                    AlarmListStyle.timeText,
                                    TextStyle.timeText,
                                    {
                                        color: textColor,
                                        backgroundColor: "transparent"
                                    }
                                ]}
                            >
                                {fWakeUpTime}
                                <Text style={TextStyle.AmPm}>
                                    {" " + amPmWakeUpTime}
                                </Text>
                            </Text>
                            <Text
                                style={{
                                    color: textColor,
                                    fontSize: scaleByFactor(10, 0.4)
                                }}
                                numberOfLines={2}
                            >
                                {this.props.alarm.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[AlarmListStyle.deleteBtn]}
                        onPressOut={alarm => this.props.onDelete(alarm)}
                    >
                        <Text style={AlarmListStyle.deleteBtnText}>DELETE</Text>
                    </TouchableOpacity>
                </Interactable.View>
            </View>
        );
    }
}
// onPress: this.props.onDelete.bind(this, this.props.alarm),
export default AlarmItem;
