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
                    /* NOTE: isInteraction -> false  causes InteractionManager to ignore this animation. 
                        i.e. It won't consider this animation to be an interaction, so will therefore not wait 
                        for the animation to complete before running runAfterInteraction().
                        This is important for when we navigate into AlarmDetail, and there is currently
                        an Alarm set (since this animation plays whenever an Alarm is set.)
                    */
                    isInteraction: false,
                    useNativeDriver: true
                }),
                Animated.timing(this._animValue, {
                    toValue: 1,
                    duration: 1500,
                    isInteraction: false,
                    useNativeDriver: true
                }),
                Animated.timing(this._animValue, {
                    toValue: 0,
                    duration: 0,
                    isInteraction: false,
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
