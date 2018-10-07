import React, { Component } from "react";
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    TouchableOpacity,
    Text,
    Animated
} from "react-native";
import Colors from "../styles/colors";

class StyledRadio extends React.Component {
    _isAnimating = false;
    constructor(props) {
        super(props);
        // console.log("StyledRadio constructor ");
        // console.log("props", props);
        this.state = {
            selectedIdx: props.initialIdx,
            width: null
        };

        this._underscorAnim = new Animated.Value(props.initialIdx);
    }

    componentWillReceiveProps(props) {
        // console.log("componentWillReceiveProps");
        // console.log("props.selectedIdx", props.selectedIdx);
        // console.log("this.props.selectedIdx", this.props.selectedIdx);
        if (props.selectedIdx != this.props.selectedIdx) {
            if (!this._isAnimating) {
                this._underscorAnim.setValue(props.selectedIdx);
            }
            this.setState({ selectedIdx: props.selectedIdx });
        }
    }

    onLayout = event => {
        const { width } = event.nativeEvent.layout;
        this.setState({ width: width });
    };

    _onSelectItem(idx) {
        this.setState({ selectedIdx: idx });
        this._isAnimating = true;
        Animated.spring(this._underscorAnim, {
            toValue: idx,
            tension: 300,
            friction: 11,
            useNativeDriver: true
        }).start(() => {
            this._isAnimating = false;
            this._underscorAnim.setValue(this.state.selectedIdx);
        });
        this.props.onSelect(idx);
    }

    render() {
        let { width } = this.state;
        // console.log("Styled Radio");
        // console.log("this.props", this.props);
        // console.log("this.state", this.state);
        return (
            <View
                onLayout={this.onLayout}
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    flex: 1
                    // backgroundColor: "green"
                }}
            >
                <TouchableOpacity
                    style={{
                        flex: 0.33,
                        alignContent: "center",
                        justifyContent: "center",
                        paddingBottom: 10
                    }}
                    onPress={() => {
                        this._onSelectItem(0);
                    }}
                >
                    <Text style={{ alignSelf: "center" }}>
                        {this.props.options[0].name}
                    </Text>
                    {/* {this.state.selectedIdx == 0 && (
                        <View style={[styles.underscore]} />
                    )} */}
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 0.33,
                        alignContent: "center",
                        justifyContent: "center",
                        paddingBottom: 10
                    }}
                    onPress={() => {
                        this._onSelectItem(1);
                    }}
                >
                    <Text style={{ alignSelf: "center" }}>
                        {this.props.options[1].name}
                    </Text>
                    {/* {this.state.selectedIdx == 1 && (
                        <View style={[styles.underscore]} />
                    )} */}
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 0.33,
                        alignContent: "center",
                        justifyContent: "center",
                        paddingBottom: 10
                    }}
                    onPress={() => {
                        this._onSelectItem(2);
                    }}
                >
                    <Text style={{ alignSelf: "center" }}>
                        {this.props.options[2].name}
                    </Text>
                    {/* {this.state.selectedIdx == 2 && (
                        <View style={[styles.underscore]} />
                    )} */}
                </TouchableOpacity>
                <Animated.View
                    style={[
                        styles.underscore,
                        {
                            transform: [
                                {
                                    translateX: this._underscorAnim.interpolate(
                                        {
                                            inputRange: [0, 1, 2],
                                            outputRange: [
                                                width * 0.01,
                                                width * 0.335,
                                                width * 0.67
                                            ]
                                        }
                                    )
                                }
                            ]
                        }
                    ]}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    main: {
        padding: 10
    },
    underscore: {
        backgroundColor: "#9c75f0",
        position: "absolute",
        height: 2,
        left: 0,
        // right: 0,
        width: "32%",
        bottom: 10,
        shadowColor: "#9c75f0",
        shadowRadius: 5,
        shadowOpacity: 0.5
    }
});

export default StyledRadio;
