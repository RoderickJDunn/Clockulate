/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PropTypes from 'prop-types';

class DurationText extends Component {
    static propTypes = {
        hours: PropTypes.string,
        minutes: PropTypes.string,
    };

    constructor(props) {
        super(props);

    }

    formatDuration(hours, minutes) {
        let duration = "";
        if (!hours) {
            duration = minutes ? `${minutes}m` : "0m";
        }
        else if (hours && !minutes) {
            duration = `${hours}h`
        }
        else {
            duration = `${hours}h, ${minutes}m`;
        }
        return duration;
    }

    render() {
        let hours = this.props.hours;
        let minutes = this.props.minutes;

        let duration = this.formatDuration(hours, minutes);


        return (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{fontSize:15}}>
                {duration}
            </Text>
        )
    }
}

export default DurationText;