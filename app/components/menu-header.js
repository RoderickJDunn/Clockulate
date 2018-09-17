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

class MenuHeader extends React.Component {
    // constructor() {
    //     super();
    // }

    render() {
        // console.debug("Render MenuHeader");
        // console.debug("props: ", this.props);

        // console.log("tasksArr in task-list", tasksArr);
        return (
            <View
                style={[
                    styles.menuHeader,
                    {
                        height: this.props.open ? 30 : 0,
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
                    <View style={{ padding: 8 }}>
                        <Text style={styles.text}>{this.props.title}</Text>
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
        alignSelf: "stretch",
        overflow: "hidden",
        height: 60,
        backgroundColor: Colors.backgroundGrey
        // backgroundColor: "#FDFDFD"
    },
    menuRowBtn: {
        height: 60
    },
    text: {
        fontWeight: "bold",
        color: Colors.darkGreyText
    }
});

export default MenuHeader;
