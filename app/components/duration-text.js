/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PropTypes from 'prop-types';

class DurationText extends Component {
    static propTypes = {
        seconds: PropTypes.number,
    };

    constructor(props) {
        super(props);
        this.state = {
            data: {
                duration: props.duration
            }
        }

    }

    calcHours(seconds) {
        return Math.trunc(seconds / 3600);
    }

    calcMinutes(seconds, hours) {
        seconds = seconds - hours*3600;
        return Math.trunc(seconds / 60);
    }

    formatDuration(seconds) {
        let hours = this.calcHours(seconds);
        let minutes = this.calcMinutes(seconds, hours);

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
        // console.log(this.props.duration);
        let duration = this.formatDuration(this.props.duration);


        return (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{fontSize:15}}>
                {duration}
            </Text>
        )
    }
}

export default DurationText;