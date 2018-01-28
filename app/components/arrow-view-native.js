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

ArrowView.propTypes = {
    points: PropTypes.number
};
