import React, {Component} from 'react';
import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';

import DateTimePicker from 'react-native-modal-datetime-picker';
import DurationText from "./duration-text";

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

    _showDateTimePicker = () => this.setState({isDTPickerVisible: true});

    _hideDateTimePicker = () => this.setState({isDTPickerVisible: false});

    _handleDatePicked = (date) => {
        console.log('A date has been picked: ', date);
        this.props.handleArrivalChange(data);
        this._hideDateTimePicker();
    };

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.fieldLabelText}>{this.state.data.labelText}</Text>
                <TouchableOpacity style={{height: 5}} onPress={this._showDateTimePicker}>
                    <Text style={[{fontSize: 25}]}>{this.state.data.fieldText}</Text>
                </TouchableOpacity>
                <DateTimePicker
                    mode={'time'}
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
    },
});

export default LabeledTimeInput;



