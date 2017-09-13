/**
 * Created by rdunn on 2017-08-23.
 */

import React, {Component} from 'react';
import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';

import moment from 'moment';
// import DateTimePicker from 'react-native-modal-datetime-picker';
import DurationText from "./duration-text";
// import TimePicker from 'react-native-timepicker';
import Picker from 'react-native-picker';
import { minuteRange, hourRange } from '../data/constants'
import { calcWholeHours, calcMinutes, hour_min_toSec } from '../util/date_utils';

class LabeledTimeInput extends Component {

    constructor(props) {
        super(props);
        // console.log(props);
        this.state = {
            data: {
                labelText: props.labelText,
                time: props.time  // time is an Int here.
            },
        };
    }

    _createDurationData = () => {
        return hourRange().map(function(hour) {
            return { [hour]: minuteRange() };
        });
    };

    _showTimePicker = () => {
        let hours = calcWholeHours(this.state.data.time);
        let minutes = calcMinutes(this.state.data.time, hours);
        Picker.init({
            pickerData: this._createDurationData(),
            selectedValue: [hours + " hours", minutes + " minutes"],
            pickerToolBarFontSize: 16,
            pickerFontSize: 16,
            pickerFontColor: [255, 0, 0, 1],
            onPickerConfirm: this._onPickerConfirm,
            onPickerCancel: (pickedValue, pickedIndex) => {
                console.log('duration', pickedValue, pickedIndex);
            },
            onPickerSelect: (pickedValue, pickedIndex) => {
                console.log('duration', pickedValue, pickedIndex);
            }
        });
        Picker.show();
    };

    _onPickerConfirm = (pickedValue, pickedIndex) => {
        let dataTemp = this.state.data;
        dataTemp.time = pickedIndex[0]*3600 + pickedIndex[1]*60;

        this.setState({
            data: dataTemp
        });
        this.props.onChange(dataTemp.time);
    };


    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.fieldLabelText}>{this.state.data.labelText}</Text>
                <TouchableOpacity onPress={this._showTimePicker}>
                    <DurationText duration={this.state.data.time} style={{fontSize: 23}}/>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
    },
    fieldLabelText: {
        fontSize: 13,
        paddingBottom: 3
    },
});


export default LabeledTimeInput;


