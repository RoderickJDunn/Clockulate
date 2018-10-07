/**
 * Created by rdunn on 2017-08-23.
 */

import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";

import DurationText from "./duration-text";
// import TimePicker from 'react-native-timepicker';
import Picker from "react-native-picker";
import { minuteRange, hourRange } from "../data/constants";
import { calcWholeHours, calcMinutes } from "../util/date_utils";
import { TextStyle } from "../styles/text";

class LabeledDurationInput extends Component {
    constructor(props) {
        super(props);
        // console.log("props", props);
        this.state = {
            data: {
                labelText: props.labelText,
                time: props.time // time is an Int here.
            }
        };
    }

    _createDurationData = () => {
        return hourRange().map(function(hour) {
            return { [hour]: minuteRange() };
        });
    };

    componentWillUnmount() {
        Picker.hide();
    }

    _showTimePicker = () => {
        let hours = calcWholeHours(this.state.data.time);
        let minutes = calcMinutes(this.state.data.time, hours);
        Picker.init({
            pickerData: this._createDurationData(),
            pickerTitleText: "TASK DURATION",
            selectedValue: [hours + " hours", minutes + " minutes"],
            onPickerConfirm: this._onPickerConfirm,
            pickerToolBarFontSize: 16,
            pickerFontSize: 16,
            pickerFontColor: [34, 9, 87, 1],
            pickerCancelBtnColor: [100, 100, 100, 1],
            pickerConfirmBtnColor: [34, 9, 87, 1]
            // onPickerCancel: (pickedValue, pickedIndex) => {
            //     // console.log('duration', pickedValue, pickedIndex);
            // },
            // onPickerSelect: (pickedValue, pickedIndex) => {
            //     // console.log('duration', pickedValue, pickedIndex);
            // }
        });
        Picker.show();
    };

    _onPickerConfirm = (pickedValue, pickedIndex) => {
        let dataTemp = this.state.data;
        dataTemp.time = pickedIndex[0] * 3600 + pickedIndex[1] * 60;

        this.setState({
            data: dataTemp
        });
        this.props.onChange(dataTemp.time);
    };

    componentWillReceiveProps(nextProps) {
        let { data } = this.state;
        data.time = nextProps.time;
        this.setState({ data: data });
    }

    render() {
        // console.log("this.state.data", this.state.data);
        return (
            <TouchableOpacity onPress={this._showTimePicker} style={this.props.style}>
                <Text style={[styles.fieldLabelText, TextStyle.labelText]}>
                    {this.state.data.labelText}
                </Text>
                <View style={{ height: 3 }} />
                <View onPress={this._showTimePicker}>
                    <DurationText
                        duration={this.state.data.time}
                        overLongConfig={{
                            charLimit: 19,
                            fontSize: this.props.inputFontSize - 2
                        }}
                        style={[
                            TextStyle.timeText,
                            { fontSize: this.props.inputFontSize }
                        ]}
                    />
                </View>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignSelf: "stretch",
        justifyContent: "center",
        paddingTop: 10
    },
    fieldLabelText: {
        fontSize: 13
        // paddingBottom: 4
    }
});

export default LabeledDurationInput;
