import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    Image,
    Animated,
    TouchableWithoutFeedback
} from "react-native";

export default class TouchableBackdrop extends Component {
    DEBUG_VIEW = false;

    render() {
        let bkgColor = this.DEBUG_VIEW ? "#FE9320" : "transparent";
        return (
            <TouchableWithoutFeedback
                style={[
                    {
                        position: "absolute",
                        backgroundColor: bkgColor
                    },
                    this.props.style
                ]}
                {...this.props}
            >
                <View
                    style={[
                        {
                            position: "absolute",
                            backgroundColor: bkgColor
                        },
                        this.props.style
                    ]}
                />
            </TouchableWithoutFeedback>
        );
    }
}
