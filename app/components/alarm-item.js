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
import LinearGradient from "react-native-linear-gradient";

import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { ListStyle, AlarmListStyle } from "../styles/list";
import { scaleByFactor } from "../util/font-scale";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ALARM_STATES } from "../data/constants";
import Pulse from "../components/anim-pulse";

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
        let initAnimProgress = props.alarm.status > ALARM_STATES.OFF ? 0.9 : 0;
        this.state = {
            switchValue: props.alarm.status,
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
    }

    componentWillReceiveProps(props) {
        // console.log("componentWillReceiveProps");
        // console.log("props", props);
        if (this.state.switchValue != props.alarm.status) {
            // console.log("Triggering animation");
            this._triggerAnimation(
                props.alarm.status,
                this.props.onAnimFinished
            );
        }

        if (props.alarm.status == ALARM_STATES.RINGING) {
            // check if we are 0-60 past the alarm wakeUpTime. If so, start 'ringing animation'.
            this.playRingingAnimation();
            this.setState({ isRinging: true });
        } else {
            this._ringingAnimation.stopAnimation();
            this._ringingScaleAnim.stopAnimation();
            this._ringingAnimation.setValue(0);
            Animated.timing(this._ringingScaleAnim, {
                toValue: 1,
                duration: 400,
                isInteraction: false,
                useNativeDriver: true
            }).start();
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

    _triggerAnimation(nextAlarmState, onAnimFinished) {
        let toValue = 0.9;
        let duration = 1000;
        let easing = Easing.linear;
        // console.log("starting animation");

        // if (this.state.animProgress._value == 0.9) {
        //     toValue = 0;
        //     duration = 1000;
        //     easing = Easing.log;
        // }
        toValue = nextAlarmState > ALARM_STATES.OFF ? 0.9 : 0;
        duration = 1000;
        easing = nextAlarmState > ALARM_STATES.OFF ? Easing.linear : Easing.log;

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
        }).start(() => {
            if (
                this.props.onAnimFinished &&
                this.props.alarm.status == ALARM_STATES.SET
            ) {
                console.log("calling prop onAnimFinished");
                this.props.onAnimFinished();
            }
        });
        // if (notifyParentOfToggle) {
        //     this.props.onToggle(this.props.alarm);
        // }
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

        // console.log(this._rotate.rotate._config.outputRange);
        // console.log(this._translateX.translateX._config.outputRange);
        // console.log(this._translateY.translateY._config.outputRange);
    }

    render() {
        console.log("AlarmItem", "- render");
        // console.info("alarm-item props", this.props);
        // console.debug(
        //     `wakeTime: ${this.props.alarm.wakeUpTime} | enabled: ${
        //         this.props.alarm.status
        //     }  | order: ${this.props.alarm.order}         |         (id: ${
        //         this.props.alarm.id
        //     }`
        // );
        // console.log("index", index);

        let { status } = this.props.alarm;
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
        if (status > ALARM_STATES.OFF) {
            textColor = Colors.brandLightOpp;
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
                        backgroundColor: Colors.brandMidGrey,
                        transform: [
                            {
                                translateY: this._appearAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [
                                        duplicationSrcPos,
                                        restingLocation
                                    ]
                                })
                            }
                        ],
                        opacity: this.props.hide ? 0 : 1
                    }
                ]}
            >
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
                                { perspective: 1000 }
                                // {
                                //     scaleX: this._position.interpolate({
                                //         inputRange: [-200, 0],
                                //         outputRange: [1, 0.001],
                                //         extrapolate: "clamp"
                                //     })
                                // },
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
                            style={[AlarmListStyle.deleteBtnText]}
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
                            style={[AlarmListStyle.deleteBtnText]}
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
                    onDrag={event => {
                        // console.log("Snapping");
                        let { state, y, targetSnapPointId } = event.nativeEvent;
                        if (state == "end") {
                            this.props.onSnap(targetSnapPointId);
                        }
                    }}
                >
                    <LinearGradient
                        start={{ x: 0.0, y: 0.25 }}
                        end={{ x: 0.5, y: 1.0 }}
                        locations={[0, 0.5, 1.4]}
                        colors={[
                            Colors.brandDarkGrey,
                            Colors.brandMidLightGrey,
                            Colors.brandDarkGrey
                        ]}
                        style={{ padding: 10 }}
                    >
                        {status == ALARM_STATES.SNOOZED && (
                            <Icon
                                name="sleep"
                                size={23}
                                color={Colors.brandLightOpp}
                                style={{
                                    padding: 7,
                                    position: "absolute"
                                }}
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
                                if (this.props.isActive == true) {
                                    this.props.endMove();
                                }
                            }}
                            style={[
                                {
                                    width: this.width - 20, // subtract padding
                                    flexDirection: "row",
                                    flex: 1,
                                    alignSelf: "stretch"
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
                                onPress={this.props.onToggle.bind(
                                    this,
                                    this.props.alarm
                                )}
                            >
                                {status > ALARM_STATES.OFF &&
                                    status < ALARM_STATES.SNOOZED && (
                                        <Pulse color="#ff6060" />
                                    )}
                                {/* {status > ALARM_STATES.OFF &&
                                    status < ALARM_STATES.SNOOZED && (
                                        <View
                                            style={{
                                                backgroundColor: "red",
                                                position: "absolute",
                                                width: 10,
                                                height: 10,
                                                top: 0,
                                                left: 0,
                                                borderRadius: 10
                                            }}
                                        />
                                    )} */}
                                <Animated.View
                                    onLayout={({ nativeEvent }) => {
                                        let {
                                            x,
                                            y,
                                            width,
                                            height
                                        } = nativeEvent.layout;
                                        // console.log("Lottie Wrapper layout:");
                                        // console.log("width", width);
                                        // console.log("height", height);

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
                                                        (this.width /
                                                            this.height)
                                                ),
                                            // backgroundColor: "green",
                                            alignSelf: "stretch",
                                            alignContent: "center",
                                            justifyContent: "center",
                                            transform: this._ringTransform
                                        }
                                    ]}
                                >
                                    <LottieView
                                        source={require("../img/off-to-clock-lottie.json")}
                                        progress={this.state.animProgress}
                                        resizeMode={"contain"}
                                        style={[StyleSheet.absoluteFill]}
                                        loop={false}
                                        // onAnimationFinish={() => {
                                        //     console.log('onAnimationFinish');
                                        //     if (this.props.onAnimFinished && this.props.alarm.status == ALARM_STATES.SET) {
                                        //         console.log('calling prop onAnimFinished');
                                        //         this.props.onAnimFinished();
                                        //     }
                                        // }}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                            <View style={AlarmListStyle.infoContainer}>
                                {this.props.alarm.mode == "autocalc" && (
                                    <Text
                                        style={[
                                            TextStyle.timeText,
                                            {
                                                alignSelf: "flex-end",
                                                position: "absolute",
                                                fontSize: scaleByFactor(
                                                    23,
                                                    0.3
                                                ),
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
                                                    fontSize: scaleByFactor(
                                                        22,
                                                        0.3
                                                    )
                                                }
                                            ]}
                                        >
                                            {" " + amPmArriveTime}
                                        </Text>
                                    </Text>
                                )}
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
                                            fontFamily: "Gurmukhi MN",
                                            fontSize: scaleByFactor(15, 0.4)
                                        }}
                                        numberOfLines={2}
                                    >
                                        {this.props.alarm.label}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </Interactable.View>
                <View
                    style={{
                        height: 1,
                        backgroundColor: Colors.disabledGrey
                    }}
                />
            </Animated.View>
        );
    }
}
// onPress: this.props.onDelete.bind(this, this.props.alarm),
export default AlarmItem;
