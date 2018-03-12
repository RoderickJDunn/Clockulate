/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";
import { calcWholeHours, calcMinutes } from "../util/date_utils";
class DurationText extends Component {
    static propTypes = {
        seconds: PropTypes.number
    };

    constructor(props) {
        super(props);
        // console.log(props);
    }

    formatDuration(seconds) {
        if (!seconds) {
            seconds = 0;
        }
        let hours = calcWholeHours(seconds);
        let minutes = calcMinutes(seconds, hours);

        let hourUnit = this.props.short ? "h" : "hours";
        let minUnit = this.props.short ? "m" : "minutes";

        let duration = "";
        if (!hours) {
            duration = minutes ? `${minutes}m` : "0m";
        } else if (hours && !minutes) {
            duration = `${hours} ${hourUnit}`;
        } else {
            duration = `${hours} ${hourUnit}, ${minutes} ${minUnit}`;
        }
        return duration;
    }

    render() {
        // console.log('rendering duration-text');
        let duration = this.formatDuration(this.props.duration);
        // console.log(duration);
        // console.log(this.props.style);
        return (
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={this.props.style}
            >
                {duration}
            </Text>
        );
    }
}

export default DurationText;
