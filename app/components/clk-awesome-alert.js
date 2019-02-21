import React, { Component } from "react";
import {
    View,
    FlatList,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet,
    InteractionManager,
    Platform
} from "react-native";

import AwesomeAlert from "react-native-awesome-alerts";
import EntypoIcon from "react-native-vector-icons/Entypo";
import MatComIcon from "react-native-vector-icons/MaterialCommunityIcons";

import Colors from "../styles/colors";
import { scaleByFactor } from "../util/font-scale";

export default class ClkAlert extends Component {
    render() {
        return (
            <AwesomeAlert
                alertContainerStyle={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 0,
                    margin: 0,
                    width: "auto",
                    backgroundColor: "rgba(0,0,0,0.8)"
                }}
                contentContainerStyle={{
                    backgroundColor: "transparent",
                    padding: 0,
                    margin: 0,
                    width: "100%"
                }}
                show={true}
                showProgress={false}
                // title="Please Plug in Your Device"
                titleStyle={{
                    backgroundColor: Colors.brandLightPurple
                }}
                // message={""}
                messageStyle={{ textAlign: "center" }}
                closeOnTouchOutside={true}
                closeOnHardwareBackPress={false}
                // {...other}
                confirmButtonColor="#54c0ff"
                onConfirmPressed={() => {
                    // this.setState({ showNoRecAlert: false });
                    // this.props.navigation.navigate("Settings");
                    alert(
                        "not implemented (should navigate to Settings Screen)"
                    );
                }}
                onCancelPressed={() => {
                    this.setState({ showChargeWarning: false });
                }}
                onDismiss={() => {
                    this.setState({ showChargeWarning: false });
                }}
                customView={
                    <View style={[styles.container]}>
                        <View style={[styles.titleArea, styles.centered]}>
                            {Platform.OS == "ios" ? (
                                <MatComIcon
                                    name="cellphone-iphone"
                                    size={scaleByFactor(100)}
                                    color={Colors.backgroundLightGrey}
                                />
                            ) : (
                                <MatComIcon
                                    name="cellphone-android"
                                    size={100}
                                    color={Colors.backgroundLightGrey}
                                />
                            )}
                            <View
                                style={{
                                    flexDirection: "row",
                                    marginLeft: 65
                                }}
                            >
                                <View
                                    style={{
                                        // backgroundColor: "blue",
                                        transform: [
                                            {
                                                rotateX: "180deg"
                                            }
                                        ],
                                        alignSelf: "flex-start"
                                    }}
                                >
                                    <EntypoIcon
                                        name="power-plug"
                                        size={35}
                                        color={Colors.backgroundLightGrey}
                                    />
                                </View>
                                <View
                                    style={{
                                        // backgroundColor: "blue",
                                        transform: [
                                            {
                                                rotateY: "40deg"
                                            },
                                            {
                                                skewY: "40deg"
                                            }
                                        ],
                                        marginTop: 5,
                                        alignSelf: "flex-start"
                                    }}
                                >
                                    <MatComIcon
                                        name="power-socket-us"
                                        size={35}
                                        color={Colors.backgroundLightGrey}
                                    />
                                </View>
                            </View>
                        </View>
                        <View style={[styles.centered, styles.contentArea]}>
                            <Text style={[styles.titleText]}>
                                {this.props.title}
                            </Text>
                        </View>
                        <View style={styles.buttonArea}>
                            <TouchableOpacity
                                onPress={this.props.onDismiss}
                                style={[
                                    styles.button,
                                    styles.centered,
                                    {
                                        backgroundColor:
                                            Colors.brandMidLightGrey
                                    }
                                ]}
                            >
                                <Text style={[styles.buttonText]}>Dismiss</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={this.props.onConfirm}
                                style={[
                                    styles.button,
                                    styles.centered,
                                    { backgroundColor: Colors.brandGreen }
                                ]}
                            >
                                <Text style={[styles.buttonText]}>
                                    Don't Show Again
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
            />
        );
    }
}

const styles = StyleSheet.create({
    container: {
        // backgroundColor: "red",
        height: scaleByFactor(300, 1),
        width: "100%",
        backgroundColor: Colors.brandLightOpp,
        overflow: "hidden",
        borderRadius: 12
    },
    centered: {
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center"
    },
    titleArea: {
        flex: 0.65,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "stretch",
        overflow: "hidden",
        backgroundColor: Colors.brandLightPurple
    },
    titleText: {
        color: Colors.brandDarkGrey,
        textAlign: "center",
        fontSize: scaleByFactor(15, 1),
        marginTop: 5,
        fontFamily: "Gurmukhi MN"
    },
    contentArea: {
        flex: 0.2
    },
    buttonArea: {
        flex: 0.15,
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-around"
    },
    button: {
        flex: 0.4,
        borderRadius: 30,
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
        shadowColor: "black"
    },
    buttonText: {
        color: Colors.brandLightOpp,
        textAlign: "center",
        fontSize: scaleByFactor(12, 0.7),
        fontFamily: "Avenir-Black"
    }
});
