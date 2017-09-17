import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";

import DateTimePicker from "react-native-modal-datetime-picker";

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
        console.debug("Alarms  componentWillReceiveProps");
    }

    _showDateTimePicker = () => this.setState({ isDTPickerVisible: true });

    _hideDateTimePicker = () => this.setState({ isDTPickerVisible: false });

    _handleDatePicked = time => {
        console.log("A date has been picked: ", time);
        this.props.handleArrivalChange(time);
        this._hideDateTimePicker();
    };

    render() {
        let test = "Hello log wrap";
        return (
            <View style={styles.container}>
                <Text style={styles.fieldLabelText}>
                    {this.state.data.labelText}
                </Text>
                <TouchableOpacity
                    style={{ height: 5 }}
                    onPress={this._showDateTimePicker}
                >
                    <Text style={[{ fontSize: 25 }]}>
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
        flex: 1
    },
    fieldLabelText: {
        fontSize: 13,
        paddingBottom: 3
    }
});

export default LabeledTimeInput;
