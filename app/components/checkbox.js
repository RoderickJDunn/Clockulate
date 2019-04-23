/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../styles/colors";
import FAIcon from "react-native-vector-icons/FontAwesome";

const DEFAULT_BGD = "rgba(0, 0, 0, 0.7)";
class Checkbox extends React.Component {
    // constructor(props) {
    //     super(props);
    // }

    render() {
        //console.debug("Render dimmable-view");

        return (
            <TouchableOpacity
                style={[
                    {
                        height: 25,
                        width: 25,
                        borderRadius: 5,
                        alignContent: "center",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: 8,
                        backgroundColor: Colors.brandLightPurple
                    }
                ]}
                // onPress={this.props.onPress}
                {...this.props}
            >
                {this.props.checked && (
                    <FAIcon name="check" size={15} color={Colors.brandMidOpp} />
                )}
            </TouchableOpacity>
        );
    }
}

export default Checkbox;
