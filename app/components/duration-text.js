/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";
import { formatDuration } from "../util/date_utils";
class DurationText extends Component {
    static propTypes = {
        seconds: PropTypes.number
    };

    constructor(props) {
        super(props);
        // console.log(props);
    }

   

    render() {
        // console.log('rendering duration-text');
        let duration = formatDuration(
            this.props.duration,
            this.props.short
        );
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
