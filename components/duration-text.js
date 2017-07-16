/**
 * Created by rdunn on 2017-07-15.
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PropTypes from 'prop-types';

class DurationText extends Component {
    static propTypes = {
        hours: PropTypes.string,
        minutes: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);

    }

    render() {
        return (
            <Text>{this.props.hours ? this.props.hours : "0"}h, {this.props.minutes ? this.props.minutes : "0"}m</Text>
        )
    }
}

export default DurationText;