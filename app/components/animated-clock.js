import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated
} from "react-native";
import LabeledInput from "../components/labeled-input";

class AnimatedClock extends Component {
    render() {
        const AnimatedAlarmLabel = Animated.createAnimatedComponent(
            LabeledInput
        );
        return (
            <Animated.View
                style={[styles.clockTextContainer, this.props.style]}
            >
                <Text style={[styles.timeText]}>
                    {fWakeUpTime}
                    <Text style={{ fontSize: 50 }}>{" " + amPmWakeUpTime}</Text>
                </Text>
                <AnimatedAlarmLabel
                    placeholder="Enter a label"
                    fieldText={this.state.alarm.label}
                    handleTextInput={this.onChangeLabel}
                    onTextInputBlur={this.onLabelInputBlur}
                    separation={2}
                    style={this.props.labelStyle}
                    flex={1}
                />
                {/* <Text style={{ alignSelf: "flex-end" }}>My profile</Text> */}
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    clockContainer: {
        backgroundColor: "transparent",
        flex: 4,
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center"
    },
    clockBackground: {
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: -40,
        width: 450,
        height: 220
    },
    clockTextContainer: {
        position: "absolute",
        top: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent"
    },
    interactableHandle: {
        flex: 4,
        backgroundColor: "transparent"
    },
    nonClockWrapper: {
        flex: 11
    },
    animatedView: {
        flex: 1,
        // top: -600,
        width: window.width // FIXME: this is not imported. Seems to not be used though.
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
        justifyContent: "center",
        alignItems: "center",
        width: 450,
        height: 500,
        top: -15
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

export default AnimatedClock;
