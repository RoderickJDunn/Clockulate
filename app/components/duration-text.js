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
        let duration = formatDuration(this.props.duration, this.props.short);
        // console.log(duration);
        // console.log(this.props.style);

        let longFontSize = null;
        if (this.props.overLongConfig) {
            if (duration.length > this.props.overLongConfig.charLimit) {
                longFontSize = {
                    fontSize: this.props.overLongConfig.fontSize
                };
            }
        }

        return (
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[this.props.style, longFontSize]}
            >
                {duration}
            </Text>
        );
    }
}

export default DurationText;
