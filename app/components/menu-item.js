/**
 * Created by rdunn on 2017-07-15.
 */

import React, { Component } from "react";
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    TouchableOpacity,
    Text
} from "react-native";
import Colors from "../styles/colors";

class MenuItem extends React.Component {
    // constructor() {
    //     super();
    // }

    render() {
        // console.debug("Render MenuItem");
        // console.debug("props: ", this.props);

        // console.log("tasksArr in task-list", tasksArr);
        return (
            <View
                style={[
                    styles.menuOption,
                    {
                        height: this.props.open ? 60 : 0,
                        alignSelf: "stretch",
                        overflow: "hidden"
                    }
                ]}
            >
                <TouchableOpacity
                    onPress={() => {
                        alert("not implemented");
                    }}
                    style={styles.menuRowBtn}
                >
                    <View style={{ padding: 8, flexDirection: "row" }}>
                        {this.props.icon && (
                            <View style={{ flex: 0.2 }}>{this.props.icon}</View>
                        )}
                        <Text style={[styles.text, { flex: 0.8 }]}>
                            {this.props.title}
                        </Text>
                    </View>
                    {/* <View
                    style={{
                        height: 10,
                        width: 10,
                        backgroundColor: "green"
                    }}
                /> */}
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    menuHeader: {
        fontWeight: "bold",
        alignSelf: "stretch",
        fontSize: 15,
        padding: 10,
        paddingBottom: 5
    },
    menuOption: {
        // justifyContent: "center",
        // height: scale(50, 0.5),
        // padding: 10,
        alignSelf: "stretch",
        overflow: "hidden",
        backgroundColor: Colors.backgroundGrey
        // backgroundColor: "#FDFDFD"
    },
    menuRowBtn: {
        height: 60,
        paddingLeft: 10,
        justifyContent: "center"
    },
    text: {
        color: Colors.darkGreyText
    }
});

export default MenuItem;
