import React, { Component } from "react";
import {
    View,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet,
    InteractionManager,
    Platform
} from "react-native";

import EntypoIcon from "react-native-vector-icons/Entypo";
import MatComIcon from "react-native-vector-icons/MaterialCommunityIcons";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

import AwesomeAlert from "../components/rn-awesome-alerts/AwesomeAlert";

import Colors from "../styles/colors";
import { scaleByFactor } from "../util/font-scale";
import { isIphoneX } from "react-native-iphone-x-helper";

const LARGE_HEIGHT = scaleByFactor(320, 1);
const MID_HEIGHT = scaleByFactor(250, 1);
const SMALL_HEIGHT = scaleByFactor(200, 1);

export default class ClkAlert extends Component {
    render() {
        let {
            flexibleHeader,
            headerContent,
            title,
            headerTextStyle,
            bodyText,
            contHeight,
            dismissConfig,
            confirmConfig,
            headerIcon
        } = this.props;

        let headerStyle, bodyStyle;
        if (flexibleHeader) {
            headerStyle = styles.headerAreaLarge;
            bodyStyle = styles.contentAreaSmall;
        } else {
            headerStyle = styles.headerAreaSmall;
            bodyStyle = styles.contentAreaLarge;
        }

        if (contHeight == "large") {
            contHeight = styles.contHeightLarge;
        } else if (contHeight == "mid") {
            contHeight = styles.contHeightMid;
        } else {
            contHeight = styles.contHeightSmall;
        }

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
                overlayStyle={{
                    height: SCREEN_HEIGHT,
                    width: SCREEN_WIDTH
                    // top: isIphoneX() ? -88 : -64
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
                    <View
                        style={[
                            styles.outerWrapper,
                            { height: contHeight.height + 90 }
                        ]}
                    >
                        <View style={[styles.container, contHeight]}>
                            <View
                                style={[
                                    headerStyle,
                                    styles.centered,
                                    this.props.headerStyle
                                ]}
                            >
                                {headerContent || (
                                    <View
                                        style={{
                                            flex: 1,
                                            alignSelf: "stretch",
                                            justifyContent: headerIcon
                                                ? "flex-end"
                                                : "center",
                                            marginBottom: headerIcon ? 10 : 0
                                            // backgroundColor: "green"
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.titleText,
                                                headerTextStyle
                                            ]}
                                        >
                                            {title}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View
                                style={[
                                    styles.centered,
                                    bodyStyle,
                                    {
                                        alignSelf: "stretch"
                                        // backgroundColor: "green"
                                    }
                                ]}
                            >
                                <Text
                                    style={[
                                        flexibleHeader
                                            ? styles.titleText
                                            : styles.bodyText
                                        // { backgroundColor: "red" }
                                    ]}
                                >
                                    {flexibleHeader ? title : bodyText}
                                </Text>
                            </View>
                            {dismissConfig && confirmConfig ? (
                                <View style={styles.buttonArea}>
                                    <TouchableOpacity
                                        onPress={dismissConfig.onPress}
                                        style={[
                                            styles.buttonDouble,
                                            styles.centered
                                            // {
                                            //     backgroundColor:
                                            //         Colors.brandMidLightGrey
                                            // }
                                        ]}
                                    >
                                        <Text style={[styles.buttonText]}>
                                            {dismissConfig.text}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={confirmConfig.onPress}
                                        style={[
                                            styles.buttonDouble,
                                            styles.centered,
                                            {
                                                borderLeftWidth:
                                                    StyleSheet.hairlineWidth,
                                                borderLeftColor:
                                                    Colors.brandLightGrey
                                                // backgroundColor:
                                                //     Colors.brandGreen
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.buttonText]}>
                                            {confirmConfig.text}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.buttonArea}>
                                    <TouchableOpacity
                                        onPress={dismissConfig.onPress}
                                        style={[
                                            styles.buttonSingle,
                                            styles.centered
                                            // {
                                            //     backgroundColor:
                                            //         Colors.brandLightGrey
                                            // }
                                        ]}
                                    >
                                        <Text style={[styles.buttonText]}>
                                            {dismissConfig.text}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        {headerIcon && (
                            <View style={styles.headerIconContainer}>
                                <View
                                    style={[
                                        styles.headerIconInnerWrap,
                                        this.props.headerIconStyle
                                    ]}
                                >
                                    {headerIcon}
                                </View>
                            </View>
                        )}
                    </View>
                }
            />
        );
    }
}

const styles = StyleSheet.create({
    outerWrapper: {
        width: "100%",
        backgroundColor: "transparent",
        borderRadius: 12,
        justifyContent: "center"
        // backgroundColor: "blue"
    },
    headerIconContainer: {
        borderRadius: 80,
        position: "absolute",
        top: 0,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        width: 90,
        height: 90,
        backgroundColor: Colors.brandLightPurple
    },
    /* NOTE: This inner wrap is a work-around whereby I avoid setting a borderWidth on the iconContainer, and instead 
        use this nested circle to give the appearance of a border. This was necessary because when I used the border properties 
        and I set the color to match that of Title background, there was a thin white line around the outside of the border. 
        It looked quite bad. Regardless, this workaround results in a clean appearance of the headerIcon boundaries. */
    headerIconInnerWrap: {
        borderRadius: 80,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        width: 76,
        height: 76,
        backgroundColor: Colors.brandVeryLightPurple
    },
    contHeightLarge: {
        height: LARGE_HEIGHT
    },
    contHeightMid: {
        height: MID_HEIGHT
    },
    contHeightSmall: {
        height: SMALL_HEIGHT
    },
    container: {
        // backgroundColor: "red",
        // height: "auto",
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
    headerAreaLarge: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "stretch",
        overflow: "hidden",
        backgroundColor: Colors.brandLightPurple
    },
    headerAreaSmall: {
        height: 85,
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
        justifyContent: "flex-end",
        fontFamily: "Gurmukhi MN"
    },
    bodyText: {
        color: Colors.brandDarkGrey,
        textAlign: "center",
        fontSize: scaleByFactor(12, 1),
        marginTop: 5,
        fontFamily: "Avenir"
    },
    contentAreaSmall: {
        height: 90
    },
    contentAreaLarge: {
        flex: 1,
        paddingHorizontal: 20
    },
    buttonArea: {
        height: 50,
        flexDirection: "row",
        justifyContent: "space-around",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.brandLightGrey
    },
    buttonDouble: {
        flex: 0.5,
        height: 50
    },
    buttonSingle: {
        flex: 1,
        alignSelf: "flex-end",
        height: 50,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.brandLightGrey
    },
    buttonText: {
        color: Colors.darkGreyText,
        textAlign: "center",
        fontSize: scaleByFactor(12, 0.7),
        fontFamily: "Avenir-Black"
    }
});
