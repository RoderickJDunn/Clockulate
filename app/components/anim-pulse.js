import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated
} from "react-native";
import LabeledInput from "../components/labeled-input";

class AnimatedPulse extends Component {
    _animValue = new Animated.Value(0);

    componentDidMount() {
        Animated.loop(
            Animated.sequence([
                Animated.timing(this._animValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true
                }),
                Animated.timing(this._animValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true
                }),
                Animated.timing(this._animValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true
                })
            ])
        ).start();
    }

    render() {
        return (
            <Animated.View
                style={[
                    styles.pulseCircle,
                    {
                        backgroundColor: this.props.color,
                        opacity: this._animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0]
                        }),
                        transform: [
                            {
                                scale: this._animValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.001, 1]
                                })
                            }
                        ]
                    }
                ]}
            />
        );
    }
}

const styles = StyleSheet.create({
    pulseCircle: {
        position: "absolute",
        left: -45,
        top: -45,
        borderRadius: 100,
        height: 100,
        width: 100
    }
});

export default AnimatedPulse;
