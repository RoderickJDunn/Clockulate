import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";

import DateTimePicker from "react-native-modal-datetime-picker";

import { TextStyle } from "../styles/text";

class LabeledTimeInput extends Component {
    constructor(props) {
        super(props);
        // console.log(props);
        this.state = {
            isDTPickerVisible: false,
            data: {
                labelText: props.labelText,
                fieldText: props.fieldText
            }
        };
    }

    componentWillReceiveProps() {
        // console.debug("Alarms  componentWillReceiveProps");
    }

    _showDateTimePicker = () => this.setState({ isDTPickerVisible: true });

    _hideDateTimePicker = () => this.setState({ isDTPickerVisible: false });

    _handleDatePicked = time => {
        console.log("A date has been picked: ", time);
        this.props.handleArrivalChange(time);
        this._hideDateTimePicker();
    };

    render() {
        return (
            <View style={[styles.container, { flex: this.props.flex }]}>
                <Text
                    style={[
                        TextStyle.labelText,
                        { paddingBottom: this.props.separation || 2 }
                    ]}
                >
                    {this.state.data.labelText}
                </Text>
                <TouchableOpacity onPress={this._showDateTimePicker}>
                    <Text
                        style={[
                            TextStyle.timeText,
                            { fontSize: this.props.inputFontSize }
                        ]}
                    >
                        {this.props.fieldText}
                    </Text>
                </TouchableOpacity>
                <DateTimePicker
                    date={this.props.time} // time has been converted into a Date() for this Component
                    mode={"time"}
                    titleIOS={this.props.timePickerPrompt}
                    isVisible={this.state.isDTPickerVisible}
                    onConfirm={this._handleDatePicked}
                    onCancel={this._hideDateTimePicker}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        alignSelf: "stretch",
        backgroundColor: "transparent"
    }
});

export default LabeledTimeInput;
