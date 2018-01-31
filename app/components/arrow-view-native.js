import React, { Component } from "react";

import { requireNativeComponent, StyleSheet } from "react-native";
import PropTypes from "prop-types";

var ArrowViewNative = requireNativeComponent("ArrowView", ArrowView);

export default class ArrowView extends Component {
    constructor() {
        super();
        // let av = ArrowViewNative();
        // av.printHello();
        console.log("ArrowViewNative:");
        console.log(ArrowViewNative);
    }
    render() {
        return <ArrowViewNative {...this.props} />;
    }
}

const arrayOfLength = function(expectedLength, props, propName, componentName) {
    const arrayPropLength = props[propName].length;
    if (arrayPropLength !== expectedLength) {
        return new Error(
            `Invalid array length ${arrayPropLength} (expected ${expectedLength}) for prop ${propName} supplied to ${componentName}. Validation failed.`
        );
    }
};

ArrowView.propTypes = {
    shape: PropTypes.shape({
        start: arrayOfLength.bind(null, 2).isRequired,
        end: arrayOfLength.bind(null, 2).isRequired,
        curve: PropTypes.number,
        skew: PropTypes.number,
        spread: PropTypes.number
    }).isRequired
};

/*
{
    shape: {
        start: {
            x: 0,
            y: 0
        },
        end: {
            x: 0,
            y: 0
        },
        curve: 0,
        skew: 0,
        spread: 0
    },
    color: processColor?,
    head: "arrow",
    drawIn: true
}
*/
