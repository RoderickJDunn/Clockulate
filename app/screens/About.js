import React from "react";
import {
    Text,
    View,
    Dimensions,
    Platform,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Linking
} from "react-native";
import VersionNumber from "react-native-version-number";
import { SettingsScreen, SettingsData } from "react-native-settings-screen";
import privacyPolicyElm from "../strings/privacy_policy";
import Colors from "../styles/colors";
import FAIcon from "react-native-vector-icons/FontAwesome5";
import { TextStyle } from "../styles/text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const fontFamily = Platform.OS === "ios" ? "Avenir" : "sans-serif";

// TEST:
// TODO: FIXME: Its very likely that the appID in these links doesn't work. I need to test it once I have an AppStore AppID......
// TODO: If the links turn out to be wrong, make sure to add the corrected links in Info.plist under LSApplicationQueriesSchemes
const link =
    "itms-apps://itunes.apple.com/app/viewContentsUserReviews?id=9SXQK8L2Q6.org.reactjs.native.example.Alarm-AutoSet";
const backupLink =
    "itms-apps://itunes.apple.com/app/id=9SXQK8L2Q6.org.reactjs.native.example.Alarm-AutoSet";

const contactLink = "http://www.clockulate.ca/contact";
const supportLink = "http://www.clockulate.ca/support";

// export var APP_VERSION = VersionNumber.appVersion;
// TODO:
export default class About extends React.Component {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    data: SettingsData = [
        {
            type: "SECTION",
            header: " ",
            rows: [
                {
                    title: "Attributions",
                    onPress: () => {
                        this.props.navigation.navigate("PlainTextScreen", {
                            title: "Attributions",
                            text: "MyAttributions Text"
                        });
                    },
                    showDisclosureIndicator: true
                },
                {
                    title: "Privacy Policy",
                    onPress: () => {
                        this.props.navigation.navigate("PlainTextScreen", {
                            title: "Privacy Policy",
                            text: privacyPolicyElm
                        });
                    },
                    showDisclosureIndicator: true
                }
            ]
        },
        {
            type: "SECTION",
            header: "",
            rows: [
                {
                    title: "Support",
                    showDisclosureIndicator: true,
                    onPress: () => {
                        Linking.openURL(supportLink).catch(err => {
                            alert(
                                "An error occurred. Unable to open Clockulate support page."
                            );
                        });
                    }
                },
                {
                    title: "Contact Us",
                    showDisclosureIndicator: true,
                    onPress: () => {
                        Linking.openURL(contactLink).catch(err => {
                            alert(
                                "An error occurred. Unable to open Clockulate contact page."
                            );
                        });
                    }
                },
                {
                    title: "Version",
                    showDisclosureIndicator: false,
                    renderAccessory: () => {
                        return (
                            <Text
                                style={{
                                    alignSelf: "center",
                                    fontSize: 18,
                                    color: "#999"
                                }}
                            >
                                {VersionNumber.appVersion}
                            </Text>
                        );
                    }
                }
            ]
        },
        {
            type: "CUSTOM_VIEW",
            key: "rate_me",
            render: this.renderRateMeBtn.bind(this) // the bind here is required for the RateMe button to get correct context
        }
    ];

    launchAppStoreWithLink = (link, onFailure) => {
        Linking.canOpenURL(link).then(
            supported => {
                if (supported) {
                    Linking.openURL(link).catch(err => {
                        if (onFailure) onFailure(err);
                        else {
                            console.log("Failed to open link.");
                        }
                    });
                } else {
                    console.log("Link not supported");
                    onFailure && onFailure();
                }
            },
            err => {
                console.log("err", err);
                onFailure && onFailure(err);
            }
        );
    };

    renderRateMeBtn() {
        return (
            <View style={styles.rateMeCont}>
                <View style={styles.ratingTextCont}>
                    <Text style={[styles.ratingText, TextStyle.plainText]}>
                        We'd love to hear what you think of Clockulate!
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => {
                        this.launchAppStoreWithLink(link, err => {
                            console.log("err", err);
                            this.launchAppStoreWithLink(backupLink, err => {
                                console.log("err", err);
                                alert(
                                    "An error occurred. Unable to launch App Store."
                                );
                            });
                        });
                    }}
                >
                    <View style={styles.appStoreIconCont}>
                        <FAIcon
                            name="app-store"
                            size={40}
                            color={Colors.brandLightOpp}
                        />
                    </View>
                    <Text style={styles.rateBtnText}>
                        Rate Us on the {"\n"} App Store
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    render() {
        return (
            <SafeAreaView
                style={{ flex: 1, backgroundColor: Colors.backgroundGrey }}
            >
                <SettingsScreen
                    data={this.data}
                    globalTextStyle={{ fontFamily }}
                    // style={{ backgroundColor: Colors.backgroundBright }}
                    style={{ backgroundColor: Colors.backgroundGrey }}
                />
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 10,
        backgroundColor: Colors.backgroundBright
    },
    rateMeCont: {
        // marginTop: 40,
        // marginBottom: 50,
        // paddingVertical: 20,
        // justifyContent: "flex-start",
        alignItems: "center",
        marginBottom: 20
        // backgroundColor: 'white',
        // borderTopWidth: StyleSheet.hairlineWidth,
        // borderBottomWidth: StyleSheet.hairlineWidth,
    },
    appStoreIconCont: {
        flex: 0.25,
        alignContent: "center",
        alignItems: "center"
    },
    ratingTextCont: {
        marginHorizontal: SCREEN_WIDTH * 0.09,
        marginBottom: SCREEN_HEIGHT * 0.03
    },
    ratingText: {
        textAlign: "center",
        fontSize: 16,
        color: Colors.darkGreyText
    },
    btn: {
        // bottom: 50,
        // paddingVertical: 10,
        // paddingHorizontal: 15,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: 280,
        width: SCREEN_WIDTH * 0.75,
        height: 90,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowColor: "#000",
        elevation: 5,
        backgroundColor: Colors.brandLightPurple,
        borderRadius: 45,
        flexDirection: "row"
    },
    rateBtnText: {
        color: Colors.brandLightOpp,
        fontSize: 30,
        fontFamily: "Quesha",
        letterSpacing: 1,
        flex: 0.6,
        textAlign: "center"
    }
});
