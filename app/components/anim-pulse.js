import React, { Component } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Animatable from "react-native-animatable";
import LabeledInput from "../components/labeled-input";

class AnimatedPulse extends Component {
    // _animValue = new Animated.Value(0);

    render() {
        return (
            <Animatable.View
                animation={"fadeIn"}
                duration={2000}
                delay={1500}
                style={[styles.pulseCircle]}
            />
        );
    }
}

const styles = StyleSheet.create({
    pulseCircle: {
        position: "absolute",
        backgroundColor: "red",
        width: 10,
        height: 10,
        top: 0,
        left: 0,
        borderRadius: 10
    }
});

export default AnimatedPulse;
