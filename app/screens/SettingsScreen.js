import React from "react";
import {
    View,
    Text,
    Platform,
    StyleSheet,
    ActivityIndicator
} from "react-native";

import { SettingsScreen, SettingsData } from "react-native-settings-screen";
import Permissions from "react-native-permissions";
import EntypoIcon from "react-native-vector-icons/Entypo";

import Colors from "../styles/colors";
import PickerActionSheet from "../components/picker-action-sheet";
import Settings from "../config/settings";

const fontFamily = Platform.OS === "ios" ? "Avenir" : "sans-serif";

const coolDownOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 60];
const maxLogsOptions = [10, 25, 50, 100, 200, 500, 1000, "Unlimited"];

export default class SettingsScreenCkt extends React.Component {
    /*
    Props: 
     */
    static navigationOptions = () => ({
        title: "Settings",
        headerTintColor: "#000"
    });

    constructor() {
        super();

        console.log("constructor");

        // load Permissions
        Permissions.checkMultiple(["microphone", "notification"]).then(
            response => {
                console.log("response", response);
                let { permissions } = this.state;
                permissions.mic = response.microphone == "authorized";
                permissions.notif = response.notification == "authorized";
                this.setState({ permissions });
            }
        );

        this.state = {
            settings: {
                recCooldown: Settings.recCooldown(),
                maxLogs:
                    Settings.maxLogs() > 0 ? Settings.maxLogs() : "Unlimited"
            },
            permissions: {
                mic: null,
                notif: null
            },
            showCooldownPicker: false,
            showMaxRecsPicker: false
        };
    }

    data: SettingsData = [
        {
            type: "SECTION",
            header: "Sleep Monitoring".toUpperCase(),
            rows: [
                {
                    title: "Recording Cooldown",
                    subtitle: "Min. time between recordings",
                    subtitleStyles: { numberOfLines: 2 },
                    onPress: () => {
                        this.props.navigation.navigate("TextInputScreen", {
                            dataSets: [coolDownOptions],
                            dataLabels: ["minutes"],
                            currValues: [this.state.settings.recCooldown], // TODO: send value currently in Settings table
                            title: "Recording Cooldown",
                            description:
                                "The minimum time allowed between recordings. If 2 or more noises are detected within this time period, only the first will be recorded.",
                            onNavigateBack: this.didSetRecCooldown
                        });
                    },
                    renderAccessory: () => {
                        let { recCooldown } = this.state.settings;
                        return recCooldown != null ? (
                            <Text
                                style={{
                                    color: "#999",
                                    marginRight: 6,
                                    fontSize: 18
                                }}
                            >
                                {typeof recCooldown == "number"
                                    ? recCooldown + " minutes"
                                    : recCooldown}
                            </Text>
                        ) : (
                            <ActivityIndicator />
                        );
                    },
                    showDisclosureIndicator: true
                },
                {
                    title: "Max Logs",
                    subtitle: "Maximum number of logs that will be kept",
                    subtitleStyles: { numberOfLines: 2 },
                    onPress: () => {
                        this.props.navigation.navigate("TextInputScreen", {
                            dataSets: [maxLogsOptions],
                            dataLabels: ["logs"],
                            currValues: [this.state.settings.maxLogs], // TODO: send value currently in Settings table
                            title: "Maximum Logs",
                            description:
                                "The maximum number of logs Clockulate will store. Any logs created above this number, will result in the oldest log being deleted.",
                            onNavigateBack: this.didSetMaxLogs
                        });
                        // this.setState({ showMaxRecsPicker: true });
                    },
                    renderAccessory: () => {
                        let { maxLogs } = this.state.settings;
                        return maxLogs != null ? (
                            <Text
                                style={{
                                    color: "#999",
                                    marginRight: 6,
                                    fontSize: 18
                                }}
                            >
                                {this.state.settings.maxLogs}
                            </Text>
                        ) : (
                            <ActivityIndicator />
                        );
                    },
                    showDisclosureIndicator: true
                }
                // { title: "A non-tappable row" },
                // {
                //     title: "This row has a",
                //     subtitle: "Subtitle",
                //     showDisclosureIndicator: true
                // },
                // {
                //     title: "Long title. So long long long long long long long",
                //     subtitle:
                //         "And so is the subtitle. Even longer longer longer longer longer"
                // },
                // {
                //     title: "Switch",
                //     renderAccessory: () => (
                //         <Switch value onValueChange={() => {}} />
                //     )
                // },
                // {
                //     title: "Custom view",
                //     renderAccessory: () => (
                //         <View
                //             style={{
                //                 width: 30,
                //                 height: 30,
                //                 backgroundColor: "blue"
                //             }}
                //         />
                //     ),
                //     showDisclosureIndicator: true
                // }
            ]
        },
        {
            type: "SECTION",
            header: "Permissions".toUpperCase(),
            rows: [
                {
                    title: "Microphone",
                    subtitle: "Required to monitor sleep and ensure wakeup",
                    renderAccessory: () => {
                        let { mic } = this.state.permissions;
                        // TODO: I need to remove the Switch
                        return mic != null ? (
                            mic == true ? (
                                <EntypoIcon
                                    color={"green"}
                                    name="check"
                                    size={24}
                                />
                            ) : (
                                <EntypoIcon
                                    color={"red"}
                                    name="cross"
                                    size={24}
                                />
                            )
                        ) : (
                            <ActivityIndicator />
                        );
                    },
                    onPress: () => {
                        let { permissions } = this.state;
                        console.log("permissions.mic", permissions.mic);

                        if (permissions.mic == true) {
                            // TODO: Present alert asking if they want to go to Settings
                        } else if (permissions.mic == false) {
                            Permissions.request("microphone").then(status => {
                                console.log("permissions.mic status", status);
                                permissions.mic = status == "authorized";
                                this.setState({ permissions });
                            });
                        }
                    }
                },
                {
                    title: "Notifications",
                    subtitle: "Required to alert you when an Alarm goes off!",
                    renderAccessory: () => {
                        let { notif } = this.state.permissions;
                        return notif != null ? (
                            notif == true ? (
                                <EntypoIcon
                                    color={"green"}
                                    name="check"
                                    size={24}
                                />
                            ) : (
                                <EntypoIcon
                                    color={"red"}
                                    name="cross"
                                    size={24}
                                />
                            )
                        ) : (
                            <ActivityIndicator />
                        );
                    },
                    onPress: () => {
                        let { permissions } = this.state;
                        console.log("permissions.notif", permissions.notif);
                        if (permissions.notif == true) {
                            // TODO: Present alert asking if they want to go to Settings, to remove permission
                        } else if (permissions.notif == false) {
                            Permissions.request("notification").then(status => {
                                console.log(
                                    "permissions.notification status",
                                    status
                                );
                                permissions.notif = status == "authorized";
                                this.setState({ permissions });
                            });
                        }
                    }
                }
                //         {
                //             title: "Dolor Nullam",
                //             showDisclosureIndicator: true
                //         },
                //         {
                //             title: "Nulla vitae elit libero",
                //             renderAccessory: () => (
                //                 <Text
                //                     style={{
                //                         color: "#999",
                //                         marginRight: 6,
                //                         fontSize: 18
                //                     }}
                //                 >
                //                     Dapibus
                //                 </Text>
                //             )
                //         },
                //         {
                //             title: "Ipsum Lorem Venenatis",
                //             subtitle: "Vestibulum Inceptos Fusce Justo",
                //             renderAccessory: () => (
                //                 <Text
                //                     style={{
                //                         color: "#999",
                //                         marginRight: 6,
                //                         fontSize: 18
                //                     }}
                //                 >
                //                     Yes
                //                 </Text>
                //             ),
                //             showDisclosureIndicator: true
                //         },
                //         {
                //             title: "Cras Euismod",
                //             renderAccessory: () => (
                //                 <Icon
                //                     style={{ marginTop: 3, marginRight: 6 }}
                //                     name="colours"
                //                     size={32}
                //                     color="black"
                //                 />
                //             ),
                //             showDisclosureIndicator: true
                //         }
            ]
        },
        // {
        //     type: "SECTION",
        //     header: "My Third Section".toUpperCase(),
        //     rows: [
        //         {
        //             title: "Different title style",
        //             showDisclosureIndicator: true,
        //             titleStyle: {
        //                 color: "red"
        //             }
        //         }
        //     ]
        // },
        {
            type: "CUSTOM_VIEW",
            render: () => (
                <Text
                    style={{
                        alignSelf: "center",
                        fontSize: 18,
                        color: "#999",
                        marginBottom: 40,
                        marginTop: -30,
                        fontFamily
                    }}
                >
                    v1.2.3
                </Text>
            )
        }
    ];

    _closePicker = () => {
        this.setState({ showCooldownPicker: false, showMaxRecsPicker: false });
    };

    didSetMaxLogs = newVal => {
        console.log("didSetMaxLogs", newVal);
        let { settings } = this.state;
        settings.maxLogs = newVal;

        if (newVal == "Unlimited") {
            newVal = -1;
        }
        Settings.maxLogs(newVal);

        this.setState({ settings });
    };

    didSetRecCooldown = newVal => {
        console.log("didSetMaxLogs", newVal);
        let { settings } = this.state;
        Settings.recCooldown(newVal);
        settings.recCooldown = newVal;

        this.setState({ settings });
    };

    render() {
        let { showCooldownPicker, showMaxRecsPicker } = this.state;

        return (
            <View style={styles.container}>
                <SettingsScreen
                    data={this.data}
                    globalTextStyle={{ fontFamily }}
                    style={{ backgroundColor: Colors.backgroundBright }}
                />
                {showCooldownPicker && (
                    <PickerActionSheet
                        initialValues={[100]}
                        onValueSelected={this._saveSnoozeTime}
                        onPressedCancel={this._closePicker}
                        dataSets={[coolDownOptions]}
                        dataLabels={["minutes"]}
                        title={"Recording Cooldown Time"}
                        subtitle={
                            "Number of minutes after a recording, where a noise will not trigger another recording."
                        }
                    />
                )}
                {showMaxRecsPicker && (
                    <PickerActionSheet
                        initialValues={[1]}
                        onValueSelected={this._saveSnoozeTime}
                        onPressedCancel={this._closePicker}
                        dataSets={[coolDownOptions]}
                        dataLabels={["days"]}
                        title={"Maximum Number of Logs Kept"}
                    />
                )}
            </View>
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
