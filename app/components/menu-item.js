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

        let showSeperator = this.props.showSeperator == false ? false : true;
        // console.log("tasksArr in task-list", tasksArr);
        return (
            <View
                style={[
                    styles.menuOption,
                    {
                        height: 60,
                        alignSelf: "stretch",
                        overflow: "hidden"
                    },
                    this.props.style
                ]}
            >
                {this.props.children || (
                    <TouchableOpacity
                        onPress={() => {
                            this.props.onPressItem();
                        }}
                        style={styles.menuRowBtn}
                    >
                        <View
                            style={{
                                // padding: 8,
                                flexDirection: "row",
                                flex: 1,
                                justifyContent: "center",
                                alignContent: "center",
                                alignItems: "center"
                                // borderColor: "blue",
                                // borderWidth: 1
                            }}
                        >
                            {this.props.left && (
                                <View
                                    style={{
                                        flex: 0.15,
                                        alignContent: "center",
                                        alignItems: "center",
                                        justifyContent: "center"
                                        // backgroundColor: "red"
                                    }}
                                >
                                    {this.props.left}
                                </View>
                            )}
                            {this.props.center && !this.props.centerRight && (
                                <Text
                                    style={[
                                        styles.text,
                                        {
                                            flex: this.props.right ? 0.65 : 0.75
                                        }
                                    ]}
                                >
                                    {this.props.center}
                                </Text>
                            )}
                            {this.props.right && !this.props.centerRight && (
                                <View
                                    style={{
                                        flex: 0.2,
                                        alignContent: "flex-end",
                                        alignItems: "flex-end"
                                    }}
                                >
                                    {this.props.right}
                                </View>
                            )}
                            {this.props.centerRight && (
                                <View
                                    style={{
                                        flex: 0.85
                                        // backgroundColor: "blue"
                                        // alignContent: "flex-end",
                                        // alignItems: "flex-end"
                                    }}
                                >
                                    {this.props.centerRight}
                                </View>
                            )}
                        </View>
                        {/* <View
                    style={{
                        height: 10,
                        width: 10,
                        backgroundColor: "green"
                    }}
                /> */}
                    </TouchableOpacity>
                )}
                {showSeperator && (
                    <View
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: this.props.separatorPosition || 0,
                            right: 0,
                            height: 0.5,
                            backgroundColor: "grey"
                        }}
                    />
                )}
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
        paddingRight: 10,
        alignSelf: "stretch",
        overflow: "hidden",
        backgroundColor: Colors.backgroundGrey
        // backgroundColor: "#FDFDFD"
    },
    menuRowBtn: {
        height: 60,
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center"
        // borderWidth: 1,
        // borderColor: "#487d"
    },
    text: {
        marginTop: 5,
        color: Colors.darkGreyText,
        fontFamily: "Gurmukhi MN"
    }
});

export default MenuItem;
