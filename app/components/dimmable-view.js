/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
// import Colors from "../styles/colors";

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// import { isIphoneX } from "react-native-iphone-x-helper";
const DEFAULT_BGD = "rgba(0, 0, 0, 0.7)";
class DimmableView extends React.Component {
    // constructor(props) {
    //     super(props);
    // }

    render() {
        //console.debug("Render dimmable-view");

        return this.props.isDimmed ? (
            <View {...this.props}>
                {this.props.children}
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: DEFAULT_BGD }
                    ]}
                />
            </View>
        ) : (
            this.props.children
        );
    }
}

export default DimmableView;
