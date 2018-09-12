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
    TouchableWithoutFeedback,
    Animated,
    Easing,
    StyleSheet,
    Linking,
    Platform
} from "react-native";
import moment from "moment";
import Interactable from "react-native-interactable";
import LottieView from "lottie-react-native";

import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { ListStyle, AlarmListStyle } from "../styles/list";
import { scaleByFactor } from "../util/font-scale";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
class AlarmItem extends React.PureComponent {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    _position = new Animated.Value(0);
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
        let initAnimProgress = props.alarm.enabled ? 0.9 : 0;
        this.state = {
            switchValue: props.alarm.enabled,
            animProgress: new Animated.Value(initAnimProgress),
            isMoving: false
        };

        this._appearAnim = new Animated.Value(0);

        let count = 0;

        /* DEV-only -- listen to animate value as it changes */
        // this._position.addListener(v => {
        //     count++;
        //     if (count % 10 == 0) console.log(v);
        // });
    }

    componentDidMount() {
        console.log("AlarmItem - Component did mount ");

        if (this.props.animateConfig && this.props.animateConfig.enabled) {
            console.log("AlarmItem - creating duplicate animation");
            Animated.spring(this._appearAnim, {
                toValue: 1,
                // friction: 25,
                // tension: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: true
            }).start(() => {
                // when this animation completes we can re-render the parent view (which currently holds both a FlatList,
                // and this AlarmItem). The re-render will remove this animation-only AlarmItem, and un-hide the newly added
                // AlarmItem that is part of the FlatList
                if (this.props.animateConfig.onComplete) {
                    this.props.animateConfig.onComplete();
                }
            });
        } else {
            this._appearAnim.setValue(1);
        }
    }

    componentWillReceiveProps(props) {
        // console.log("componentWillReceiveProps");
        if (this.state.switchValue != props.alarm.enabled) {
            // console.log("Triggering animation");
            this._triggerAnimation(props.alarm.enabled, false);
        }
    }

    _triggerAnimation(nextAlarmState, notifyParentOfToggle) {
        let toValue = 0.9;
        let duration = 1000;
        let easing = Easing.linear;
        // console.log("starting animation");

        // if (this.state.animProgress._value == 0.9) {
        //     toValue = 0;
        //     duration = 1000;
        //     easing = Easing.log;
        // }
        toValue = nextAlarmState ? 0.9 : 0;
        duration = 1000;
        easing = nextAlarmState ? Easing.linear : Easing.log;

        // console.log(
        //     "this.state.animProgress._value",
        //     this.state.animProgress._value
        // );
        // console.log("toValue", toValue);

        Animated.timing(this.state.animProgress, {
            toValue: toValue,
            duration: duration,
            easing: easing,
            useNativeDriver: true
        }).start(/* () => {
            if (notifyParentOfToggle) {
                this.props.onToggle(this.props.alarm);
            }
        } */);
        if (notifyParentOfToggle) {
            this.props.onToggle(this.props.alarm);
        }
        this.setState({ switchValue: nextAlarmState });
    }

    render() {
        console.log("AlarmItem", "- render");
        // console.debug("alarm-item props", this.props);
        // console.debug(
        //     `wakeTime: ${this.props.alarm.wakeUpTime} | enabled: ${
        //         this.props.alarm.enabled
        //     }  | order: ${this.props.alarm.order}         |         (id: ${
        //         this.props.alarm.id
        //     }`
        // );
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
        //         //console.log("Delete button is showing");
        //     }
        //     touchedOpacity = 1;
        // }

        // Grab correct colors depending on whether alarm is enabled/disabled
        let textColor, buttonColor;
        if (this.props.alarm.enabled) {
            textColor = Colors.darkGreyText;
            buttonColor = "#6bf47b";
        } else {
            textColor = Colors.disabledGrey;
            buttonColor = "#FEFEFE";
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

        let restingLocation = 0;
        let duplicationSrcPos = 0;

        if (this.props.animateConfig && this.props.animateConfig.alarmCount) {
            restingLocation =
                (scaleByFactor(100, 0.2) + 1) * // added '1' for the 1-pixel row separator view
                (this.props.animateConfig.alarmCount - 1);
            duplicationSrcPos =
                (scaleByFactor(100, 0.2) + 1) * // added '1' for the 1-pixel row separator view
                this.props.animateConfig.sourceRow;
        }

        let movingStyle = {};
        if (this.props.isActive) {
            console.log("isActive", "true");
            movingStyle = {
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 3,
                shadowColor: "black"
            };
        } else {
            console.log("isActive", "false");
        }

        return (
            <Animated.View
                style={[
                    this.props.style,
                    {
                        transform: [
                            {
                                translateY: this._appearAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [
                                        duplicationSrcPos,
                                        restingLocation
                                    ]
                                })
                            },
                            { perspective: 1000 }
                        ],
                        opacity: this.props.hide ? 0 : 1
                    }
                ]}
            >
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: Colors.brandLightGrey }
                    ]}
                />
                <Animated.View
                    style={[
                        AlarmListStyle.deleteBtn,
                        {
                            flexWrap: "nowrap",
                            overflow: "hidden",
                            alignContent: "center",
                            alignItems: "center",
                            transform: [
                                {
                                    translateX: this._position.interpolate({
                                        inputRange: [-300, -200, 0],
                                        outputRange: [-100, 0, 35]
                                        // extrapolate: "clamp"
                                    })
                                },
                                // {
                                //     scaleX: this._position.interpolate({
                                //         inputRange: [-200, 0],
                                //         outputRange: [1, 0.001],
                                //         extrapolate: "clamp"
                                //     })
                                // },
                                { perspective: 1000 }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            height: scaleByFactor(100, 0.2),
                            justifyContent: "center"
                        }}
                        onPressOut={alarm => this.props.onDelete(alarm)}
                    >
                        <Text
                            numberOfLines={1}
                            overflow="hidden"
                            ellipsizeMode={
                                Platform.OS == "ios" ? "clip" : "tail"
                            }
                            style={[
                                AlarmListStyle.deleteBtnText
                                // {
                                //     width: 75
                                // }
                            ]}
                        >
                            Delete
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View
                    style={[
                        AlarmListStyle.duplicateBtn,
                        {
                            flexWrap: "nowrap",
                            overflow: "hidden",
                            // width: this._position.interpolate({
                            //     inputRange: [-200, 0],
                            //     outputRange: [100, 0],
                            //     extrapolate: "clamp"
                            // }),
                            // right: this._position.interpolate({
                            //     inputRange: [-200, 0],
                            //     outputRange: [100, 190],
                            //     extrapolate: "clamp"
                            // }),
                            alignContent: "center",
                            alignItems: "center",
                            transform: [
                                {
                                    translateX: this._position.interpolate({
                                        inputRange: [-300, -200, 0],
                                        outputRange: [-200, -100, 0]
                                        // extrapolate: "clamp"
                                    })
                                },
                                // {
                                //     scaleX: this._position.interpolate({
                                //         inputRange: [-200, 0],
                                //         outputRange: [1, 0.001],
                                //         extrapolate: "clamp"
                                //     })
                                // },
                                { perspective: 1000 }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            height: scaleByFactor(100, 0.2),
                            justifyContent: "center"
                        }}
                        onPressOut={alarm => {
                            console.log("pressed duplicate...");
                            this.props.onDuplicate(alarm);
                        }}
                    >
                        <Text
                            numberOfLines={1}
                            overflow="hidden"
                            ellipsizeMode={
                                Platform.OS == "ios" ? "clip" : "tail"
                            }
                            style={[
                                AlarmListStyle.deleteBtnText
                                // {
                                //     width: 75
                                // }
                            ]}
                        >
                            Duplicate
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
                <Interactable.View
                    ref={interactableRef}
                    style={[
                        AlarmListStyle.alarmRow,
                        ListStyle.item,
                        movingStyle
                    ]}
                    horizontalOnly={true}
                    snapPoints={[
                        { x: 0, id: "closed" },
                        { x: -200, id: "active" }
                    ]}
                    dragWithSpring={{ tension: 1000, damping: 0.5 }}
                    animatedNativeDriver={true}
                    animatedValueX={this._position}
                    onSnap={e => {
                        this.props.onSnap(e.nativeEvent.id);
                    }}
                >
                    {this.props.alarm.snoozeCount > 0 && (
                        <Icon
                            name="sleep"
                            size={25}
                            style={{ padding: 7, position: "absolute" }}
                        />
                    )}
                    <TouchableOpacity
                        activeOpacity={touchedOpacity}
                        id={this.props.alarm.id}
                        label={this.props.alarm.label}
                        onStartShouldSetResponder={evt => true}
                        // onPressIn={() => this.setState({ isMoving: true })}
                        onPress={() => {
                            this.props.onPress(this.props.alarm);
                        }}
                        onLongPress={this.props.startMove}
                        // onPressOut={this.props.endMove}
                        onPressOut={() => {
                            console.log("onPressOut");
                            if (this.props.isActive == true) {
                                this.props.endMove();
                            }
                        }}
                        style={[
                            {
                                width: this.width - 20, // subtract padding
                                flexDirection: "row"
                            }
                            // movingStyle
                        ]}
                    >
                        {/* onStartShouldSetResponder: returning true prevents touches from bubbling up further! */}
                        <TouchableOpacity
                            style={[
                                AlarmListStyle.toggleButton,
                                {
                                    alignContent: "center",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "row"
                                }
                            ]}
                            onStartShouldSetResponder={evt => true}
                            onPress={this._triggerAnimation.bind(
                                this,
                                !this.state.switchValue,
                                true
                            )}
                        >
                            <View
                                style={[
                                    {
                                        flex:
                                            2.0 *
                                            Math.exp(
                                                -1.46 *
                                                    (this.width / this.height)
                                            ),
                                        // backgroundColor: "green",
                                        alignSelf: "stretch",
                                        alignContent: "center",
                                        justifyContent: "center"
                                    }
                                ]}
                            >
                                <LottieView
                                    source={require("../img/off-to-clock-lottie.json")}
                                    progress={this.state.animProgress}
                                    resizeMode={"contain"}
                                    style={[StyleSheet.absoluteFill]}
                                />
                            </View>
                        </TouchableOpacity>
                        <View style={AlarmListStyle.infoContainer}>
                            <Text
                                style={[
                                    TextStyle.timeText,
                                    {
                                        alignSelf: "flex-end",
                                        position: "absolute",
                                        fontSize: scaleByFactor(23, 0.3),
                                        top: 0,
                                        right: 0,
                                        color: textColor
                                    }
                                ]}
                            >
                                {fArriveTime}
                                <Text
                                    style={[
                                        {
                                            fontSize: scaleByFactor(22, 0.3)
                                        }
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
                            {this.props.alarm.label.length > 0 && (
                                <Text
                                    style={{
                                        color: textColor,
                                        fontSize: scaleByFactor(15, 0.4)
                                    }}
                                    numberOfLines={2}
                                >
                                    {this.props.alarm.label}
                                </Text>
                            )}
                            <View
                                style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    justifyContent: "center",
                                    alignItems: "flex-end"
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                        padding: 5,
                                        backgroundColor: "#47d35a",
                                        borderRadius: 5,
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
                                    hitSlop={{
                                        top: 10,
                                        bottom: 10,
                                        left: 20,
                                        right: 0
                                    }}
                                    onPress={() => {
                                        /* Before launching SleepCycle, disable the current Alarm (if its enabled), so that we don't get conflicts */

                                        if (this.props.alarm.enabled) {
                                            // this will disable the alarm and clear notifications
                                            this.props.onToggle(
                                                this.props.alarm
                                            );
                                        }

                                        Linking.openURL("fb162575247235://1900")
                                            .then(() => {
                                                console.log(
                                                    "Opening Sleep Cycle"
                                                );
                                            })
                                            .catch(() => {
                                                console.log(
                                                    "Failed to launch Sleep Cycle"
                                                );
                                            });
                                    }}
                                    onLongPress={() => {
                                        this.setState({ isMoving: true });
                                    }}
                                >
                                    <Text
                                        style={{ fontSize: 18, color: "white" }}
                                    >
                                        SC
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Interactable.View>
                <View
                    style={{
                        height: 1,
                        backgroundColor: Colors.backgroundGrey
                    }}
                />
            </Animated.View>
        );
    }
}
// onPress: this.props.onDelete.bind(this, this.props.alarm),
export default AlarmItem;
