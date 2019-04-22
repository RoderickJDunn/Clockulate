import React, { Component } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import moment from "moment";

import DateTimePicker from "react-native-modal-datetime-picker";

import { TextStyle } from "../styles/text";
import { scaleByFactor } from "../util/font-scale";

class LabeledTimeInput extends Component {
    constructor(props) {
        super(props);
        // console.log(props);
        this.state = {
            isDTPickerVisible: false,
            data: {
                labelText: props.labelText,
                fieldText: props.fieldText
            },
            /* Whether the time display should be hidden (for hrs of sleep setting) */
            hideTime: true // TODO: Check setting in DB
        };
    }

    componentWillReceiveProps(props) {
        // console.debug("Alarms  componentWillReceiveProps");
        if (props.hiderView && !this.props.hiderView) {
            this.setState({ hideTime: true });
        }
    }

    _showDateTimePicker = () => {
        this.props.onOpenModal && this.props.onOpenModal();
        this.setState({ isDTPickerVisible: true });
    };

    _hideDateTimePicker = () => this.setState({ isDTPickerVisible: false });

    _handleDatePicked = time => {
        // console.log("A date has been picked: ", time);

        // This 'time' is in fact a 'Date' object. We must make sure that this date
        // is the next instance of the specified time

        let arrivalDate = moment();
        // console.log("Date right now: " + arrivalDate.toDate());
        let arrivalTime = moment(time);
        // console.log("Selected date/time: " + arrivalTime.toDate());

        arrivalDate
            .set("hour", arrivalTime.hour())
            .set("minute", arrivalTime.minute())
            .set("second", 0);
        // console.log("Applied today's date: " + arrivalDate.toDate());
        // Check if this moment is in the past. If so add 1 day.
        if (arrivalDate.diff(moment()) < 0) {
            arrivalDate.add(1, "days");
        }

        this.props.handleArrivalChange(arrivalDate.toDate());
        this._hideDateTimePicker();
    };

    _toggleHiderView = () => {
        this.setState({ hideTime: !this.state.hideTime });
    };

    render() {
        let fieldText, amPmWakeUpTime;
        if (this.props.fieldText) {
            fieldText = this.props.fieldText;
        } else {
            let timeMoment = moment(this.props.time);
            fieldText = timeMoment.format("h:mm");
            amPmWakeUpTime = (
                <Text style={{ fontSize: scaleByFactor(25, 0.5) }}>
                    {" " + timeMoment.format("A")}
                </Text>
            );
        }

        return (
            <TouchableOpacity
                style={[
                    styles.container,
                    {
                        flex: this.props.flex
                        // height: inputHeight + scaleByFactor(23, 0.5),
                        // backgroundColor: "blue"
                    }
                ]}
                onPress={
                    this.props.behavior == "picker"
                        ? this._showDateTimePicker
                        : this._toggleHiderView
                }
                disabled={this.props.disabled}
            >
                <Text
                    style={[
                        TextStyle.labelText,
                        {
                            // paddingBottom: this.props.separation,
                            textAlign:
                                this.props.textAlign == null
                                    ? "left"
                                    : this.props.textAlign
                        }
                    ]}
                >
                    {this.state.data.labelText}
                </Text>
                <View
                    onPress={
                        this.props.behavior == "picker"
                            ? this._showDateTimePicker
                            : this._toggleHiderView
                    }
                    disabled={this.props.disabled}
                >
                    {this.props.hiderView && this.state.hideTime ? (
                        this.props.hiderView
                    ) : (
                        <Text
                            style={[
                                TextStyle.timeText,
                                {
                                    fontSize: this.props.inputFontSize,
                                    textAlign:
                                        this.props.textAlign == null
                                            ? "left"
                                            : this.props.textAlign
                                    // backgroundColor: "red"
                                }
                            ]}
                        >
                            {fieldText}
                            {amPmWakeUpTime}
                        </Text>
                    )}
                </View>
                <DateTimePicker
                    date={this.props.time} // time has been converted into a Date() for this Component
                    mode={"time"}
                    titleIOS={this.props.timePickerPrompt}
                    isVisible={this.state.isDTPickerVisible}
                    onConfirm={this._handleDatePicked}
                    onCancel={this._hideDateTimePicker}
                />
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        alignSelf: "stretch",
        backgroundColor: "transparent",
        justifyContent: "center"
    }
});

export default LabeledTimeInput;
