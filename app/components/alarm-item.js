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

let shakeAnimMap = new Map([
    [0, 0],
    [0.1, -15],
    [0.2, -26],
    [0.3, -33],
    [0.35, 33],
    [0.4, -29],
    [0.45, 25],
    [0.5, -22],
    [0.55, 19],
    [0.6, -16],
    [0.65, 13],
    [0.7, 10],
    [0.75, -8],
    [0.8, 6],
    [0.85, -4],
    [0.9, 3],
    [0.95, -2],
    [1, 0]
]);
// let shakeAnimMap = new Map([
//     [0, 0],
//     [0.025, 10],
//     [0.05, 20],
//     [0.075, 30],
//     [0.1, 40],
//     [0.125, 50],
//     [0.15, 60],
//     [0.175, 70],
//     [0.2, 80],
//     [0.225, 90],
//     [0.25, 100],
//     [0.275, 110],
//     [0.3, 120],
//     [0.325, 130],
//     [0.35, 140],
//     [0.375, 150],
//     [0.4, 160],
//     [0.425, 170],
//     [0.45, 180],
//     [0.475, 190],
//     [0.5, 200],
//     [0.525, 210],
//     [0.55, 220],
//     [0.575, 230],
//     [0.6, 240],
//     [0.625, 250],
//     [0.65, 260],
//     [0.675, 270],
//     [0.7, 280],
//     [0.725, 290],
//     [0.75, 300],
//     [0.775, 310],
//     [0.8, 320],
//     [0.825, 330],
//     [0.85, 340],
//     [0.875, 350],
//     [0.9, 360],
//     [0.925, 360],
//     [0.95, 360],
//     [0.975, 360],
//     [1, 360]
// ]);

let anchorPoint = [];
function getTransformXForRotation(rotationMap) {}
class AlarmItem extends React.PureComponent {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    _position = new Animated.Value(0);

    _ringingAnimation = new Animated.Value(0);
    _ringingScaleAnim = new Animated.Value(1);

    _ringTransform = [];
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
            isMoving: false,
            isRinging: false
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

        if (this.props.alarm.enabled) {
            console.log("alarm is enabled");

            // setTimeout(this._ringingAnimation.stopAnimation, 5000);
        }
    }

    componentWillReceiveProps(props) {
        // console.log("componentWillReceiveProps");
        if (this.state.switchValue != props.alarm.enabled) {
            // console.log("Triggering animation");
            this._triggerAnimation(props.alarm.enabled, false);
        }

        let shouldStopAnimation = false;
        if (props.alarm.enabled == true) {
            // check if we are 0-60 past the alarm wakeUpTime. If so, start 'ringing animation'.

            let secSinceAlarm =
                (moment() - moment(props.alarm.wakeUpTime)) / 1000;

            if (secSinceAlarm > 0 && secSinceAlarm < 60) {
                // only play "ringing" animation, if it has been <60 sec since alarm fired.
                this.playRingingAnimation();
                this.setState({ isRinging: true });
            } else {
                shouldStopAnimation = true;
            }
        } else {
            shouldStopAnimation = true;
        }

        if (shouldStopAnimation) {
            this._ringingAnimation.stopAnimation();
            Animated.parallel([
                Animated.timing(this._ringingAnimation, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true
                }),
                Animated.timing(this._ringingScaleAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true
                })
            ]);
        }
    }

    playRingingAnimation() {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(this._ringingAnimation, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true
                    }),
                    Animated.timing(this._ringingAnimation, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true
                    }),
                    Animated.timing(this._ringingAnimation, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true
                    })
                ]),
                Animated.sequence([
                    Animated.timing(this._ringingScaleAnim, {
                        toValue: 0.9,
                        duration: 450,
                        useNativeDriver: true,
                        easing: Easing.quad
                    }),
                    Animated.timing(this._ringingScaleAnim, {
                        toValue: 1.2,
                        duration: 300,
                        useNativeDriver: true,
                        easing: Easing.quad
                    }),
                    Animated.timing(this._ringingScaleAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true
                    }),
                    Animated.spring(this._ringingScaleAnim, {
                        toValue: 1,
                        bounciness: 20,
                        useNativeDriver: true
                    }),
                    Animated.timing(this._ringingScaleAnim, {
                        toValue: 1,
                        duration: 900,
                        useNativeDriver: true
                    })
                ])
            ])
        ).start();
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

    _calcShakeAnim() {
        // rad = angle * Math.PI / 180
        // transformX(Math.cos(angle) * dx - Math.sin(angle) * dy)
        // transformY(Math.sin(angle) * dx + Math.cos(angle) * dy)
        // rotate(angle+"deg")
        this._ringTransform = [];

        this._ringTransform.push({
            scale: this._ringingScaleAnim
        });

        this._rotate = {
            rotate: this._ringingAnimation.interpolate({
                inputRange: Array.from(shakeAnimMap.keys()),
                outputRange: Array.from(shakeAnimMap.values()).map(angle => {
                    return angle + "deg";
                })
            })
        };

        let CENTER = { x: 34, y: 42 };
        let NEW_CENTER = { x: 37.16, y: 44.66 };

        this._translateX = {
            translateX: this._ringingAnimation.interpolate({
                inputRange: Array.from(shakeAnimMap.keys()),
                outputRange: Array.from(shakeAnimMap.values()).map(angle => {
                    let rad = (angle * Math.PI) / 180;

                    let rPoint = { x: 0, y: 0 };
                    rPoint.x =
                        CENTER.x +
                        (NEW_CENTER.x - CENTER.x) * Math.cos(rad) -
                        (NEW_CENTER.y - CENTER.y) * Math.sin(rad);
                    // rPoint.x =
                    //     32.83 +
                    //     (36.83 - 32.83) * Math.cos(rad) -
                    //     (44.33 - 41.5) * Math.sin(rad);
                    // let quadrantFactor = 1;
                    // return Math.cos(rad) * 5.5 - Math.sin(rad) * 1;
                    // return 4.4 - 2.69 * Math.cos(rad);

                    // return rPoint.x;
                    return -1 * (rPoint.x - NEW_CENTER.x);
                })
            })
        };

        this._translateY = {
            translateY: this._ringingAnimation.interpolate({
                inputRange: Array.from(shakeAnimMap.keys()),
                outputRange: Array.from(shakeAnimMap.values()).map(angle => {
                    let rad = (angle * Math.PI) / 180;
                    // let quadrantFactor = 1;

                    // return Math.sin(rad) * 5.5 - Math.cos(rad) * 1;
                    // return 1 + 2.69 * Math.sin(rad);

                    let rPoint = { x: 0, y: 0 };
                    rPoint.y =
                        CENTER.y +
                        (NEW_CENTER.x - CENTER.x) * Math.sin(rad) +
                        (NEW_CENTER.y - CENTER.y) * Math.cos(rad);

                    return -1 * (rPoint.y - NEW_CENTER.y);
                    // return rPoint.y;
                })
            })
        };
        this._ringTransform.push(this._translateY);
        this._ringTransform.push(this._translateX);
        this._ringTransform.push(this._rotate);

        console.log(this._rotate.rotate._config.outputRange);
        console.log(this._translateX.translateX._config.outputRange);
        console.log(this._translateY.translateY._config.outputRange);
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
                            // onPress={e => {
                            //     console.log(e.nativeEvent);
                            // }}
                            onPress={this._triggerAnimation.bind(
                                this,
                                !this.state.switchValue,
                                true
                            )}
                        >
                            <Animated.View
                                onLayout={({ nativeEvent }) => {
                                    let {
                                        x,
                                        y,
                                        width,
                                        height
                                    } = nativeEvent.layout;
                                    console.log("Lottie Wrapper layout:");
                                    console.log("width", width);
                                    console.log("height", height);

                                    this._lottieCenterX = width / 2;
                                    this._lottieCenterY = height / 2;

                                    this._lottiePivotX =
                                        this._lottieCenterX + 20;
                                    this._lottiePivotY = this._lottieCenterY;
                                    this._calcShakeAnim();
                                    // this.setState(this.state);
                                }}
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
                                        justifyContent: "center",
                                        transform: this._ringTransform
                                        // transform: [
                                        //     { translateX: 2.5 },
                                        //     { translateY: -1.8 },
                                        //     { rotate: "45deg" }
                                        // ]
                                        // transform: [
                                        //     { translateX: 5.5 },
                                        //     { translateY: -1.1 },
                                        //     { rotate: "90deg" }
                                        // ]
                                        // transform: [
                                        //     { translateX: 7 },
                                        //     { translateY: 4 },
                                        //     { rotate: "180deg" }
                                        // ]
                                        // transform: [
                                        //     { translateX: 1.1 },
                                        //     { translateY: 5.5 },
                                        //     { rotate: "270deg" }
                                        // ]

                                        // [
                                        //     this._rotate
                                        // {
                                        //     translateY: this._ringingAnimation.interpolate(
                                        //         {
                                        //             inputRange: Array.from(
                                        //                 shakeAnimMap.keys()
                                        //             ),
                                        //             outputRange: [
                                        //                 0,
                                        //                 -1,
                                        //                 1,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0
                                        //             ]
                                        //         }
                                        //     )
                                        // },
                                        // {
                                        //     translateX: this._ringingAnimation.interpolate(
                                        //         {
                                        //             inputRange: Array.from(
                                        //                 shakeAnimMap.keys()
                                        //             ),
                                        //             outputRange: [
                                        //                 0,
                                        //                 2,
                                        //                 -2,
                                        //                 1,
                                        //                 -1,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0,
                                        //                 0
                                        //             ]
                                        //         }
                                        //     )
                                        // }
                                        //     {
                                        //         scale: this._ringingScaleAnim
                                        //     }
                                        // ]
                                    }
                                ]}
                            >
                                {/* <View
                                    style={{
                                        position: "absolute",
                                        left: "50%", // 32.83
                                        width: 1,
                                        height: 80,
                                        backgroundColor: "red"
                                    }}
                                />
                                <View
                                    style={{
                                        position: "absolute",
                                        left: 35.5,
                                        width: 1,
                                        height: 80,
                                        backgroundColor: "red"
                                    }}
                                />
                                <View
                                    style={{
                                        position: "absolute",
                                        top: "50%", // 41.5
                                        width: 60,
                                        height: 1,
                                        backgroundColor: "red"
                                    }}
                                />
                                <View
                                    style={{
                                        position: "absolute",
                                        top: 43,
                                        width: 60,
                                        height: 1,
                                        backgroundColor: "red"
                                    }}
                                /> */}
                                <LottieView
                                    source={require("../img/off-to-clock-lottie.json")}
                                    progress={this.state.animProgress}
                                    resizeMode={"contain"}
                                    style={[StyleSheet.absoluteFill]}
                                />
                            </Animated.View>
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
