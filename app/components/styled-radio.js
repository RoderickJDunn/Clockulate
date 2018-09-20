import React, { Component } from "react";
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    TouchableOpacity,
    Text
} from "react-native";
import Colors from "../styles/colors";

class StyledRadio extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedIdx: null
        };
    }

    componentWillReceiveProps(props) {
        console.log("componentWillReceiveProps");
        this.setState({ selectedIdx: props.selectedIdx });
    }

    render() {
        return (
            <View
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
                        this.setState({ selectedIdx: 0 });
                        this.props.onSelect(0);
                    }}
                >
                    <Text style={{ alignSelf: "center" }}>
                        {this.props.options[0].name}
                    </Text>
                    {this.state.selectedIdx == 0 && (
                        <View style={[styles.underscore]} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 0.33,
                        alignContent: "center",
                        justifyContent: "center",
                        paddingBottom: 10
                    }}
                    onPress={() => {
                        this.setState({ selectedIdx: 1 });
                        this.props.onSelect(1);
                    }}
                >
                    <Text style={{ alignSelf: "center" }}>
                        {this.props.options[1].name}
                    </Text>
                    {this.state.selectedIdx == 1 && (
                        <View style={[styles.underscore]} />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flex: 0.33,
                        alignContent: "center",
                        justifyContent: "center",
                        paddingBottom: 10
                    }}
                    onPress={() => {
                        this.setState({ selectedIdx: 2 });
                        this.props.onSelect(2);
                    }}
                >
                    <Text style={{ alignSelf: "center" }}>
                        {this.props.options[2].name}
                    </Text>
                    {this.state.selectedIdx == 2 && (
                        <View style={[styles.underscore]} />
                    )}
                </TouchableOpacity>
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
        right: 0,
        bottom: 10
    }
});

export default StyledRadio;
