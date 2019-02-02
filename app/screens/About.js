import React from "react";
import {
    Text,
    View,
    Dimensions,
    Platform,
    StyleSheet,
    SafeAreaView
} from "react-native";
import VersionNumber from "react-native-version-number";
import { SettingsScreen, SettingsData } from "react-native-settings-screen";
import privacyPolicyElm from "../strings/privacy_policy";
import Colors from "../styles/colors";

const fontFamily = Platform.OS === "ios" ? "Avenir" : "sans-serif";

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
            header: "     ",
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
        }
    ];

    render() {
        return (
            <SafeAreaView style={{ flex: 1 }}>
                <SettingsScreen
                    data={this.data}
                    globalTextStyle={{ fontFamily }}
                    style={{ backgroundColor: Colors.backgroundBright }}
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
    }
});
