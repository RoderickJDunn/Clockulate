/**
 * Created by rdunn on 2017-08-23.
 */

import React, {Component} from 'react';
import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';

import moment from 'moment';
import DateTimePicker from 'react-native-modal-datetime-picker';
import DurationText from "./duration-text";

class LabeledTimeInput extends Component {

    state = {
        isDTPickerVisible: false,
    };

    constructor(props) {
        super(props);
        // console.log(props);
        this.state = {
            data: {
                labelText: props.labelText,
                fieldText: props.fieldText
            }
        };
    }

    _showDateTimePicker = () => this.setState({isDTPickerVisible: true});

    _hideDateTimePicker = () => this.setState({isDTPickerVisible: false});

    _handleDatePicked = (date) => {
        console.log('A date has been picked: ', date);
        this._hideDateTimePicker();
    };

    render() {
        return (
            <View>
                <Text style={styles.fieldLabelText}>{this.state.data.labelText}</Text>
                <TouchableOpacity onPress={this._showDateTimePicker}>
                    <DurationText duration={this.state.data.fieldText} style={[{flexGrow: 1}]}/>
                </TouchableOpacity>
                <DateTimePicker
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
        alignSelf: 'stretch',
        paddingBottom: 4,
    },
    fieldLabelText: {
        fontSize: 13,
        paddingBottom: 15

    },
    fieldText: {
        fontSize: 23,
    },

});


export default LabeledTimeInput;


