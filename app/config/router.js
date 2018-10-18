/**
 * Created by rdunn on 2017-07-16.
 */

import React from "react";
import { View, Text, Button, ScrollView, Image } from "react-native";
import {
    createStackNavigator,
    createDrawerNavigator,
    SafeAreaView,
    DrawerItems
} from "react-navigation";
import { Icon } from "react-native-elements";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";

import Alarms from "../screens/Alarms";
import AlarmDetail from "../screens/AlarmDetail";
import AlarmDetailBasic from "../screens/AlarmDetailBasic";
import TaskDetail from "../screens/TaskDetail";
import Settings from "../screens/Settings";
import About from "../screens/About";
import Sounds from "../screens/Sounds";
import Upgrade from "../screens/Upgrade";
import Help from "../screens/Help";
import LinearGradient from "react-native-linear-gradient";
import { isIphoneX } from "react-native-iphone-x-helper";
import MenuItem from "../components/menu-item";

import Colors from "../styles/colors";
import { scale, scaleByFactor } from "../util/font-scale";

// export const AlarmTabs = TabNavigator({
//     AlarmDetail: {
//         screen: AlarmDetail,
//         navigationOptions: {
//             tabBarLabel: 'Auto-Calc',
//             tabBarIcon: ({tintColor}) => ( <Icon name="list" size={35} color={tintColor}/> ),
//         },
//     },
// });

/*
    This is an optional object to be passed into StackNavigator when it is created. It provides
    default configuration for every screen within the StackNavigator. These configurations can then
    be overwritten on a per-screen basis if needed.
 */
const navigationConfig = {
    initialRouteName: "AlarmsList",
    headerMode: "float",
    navigationOptions: {
        title: "Alarms",
        headerStyle: {
            // Style the header view itself (aka. the nav bar)
            backgroundColor: Colors.brandDarkGrey,
            borderBottomWidth: 0
        },
        headerTitleStyle: {
            // style the Title text of the header
            color: Colors.brandLightGrey
        },
        headerTintColor: Colors.brandLightGrey // this sets color for 'Back' icon and text
    }
};

const alarmListNavOptions = ({ navigation }) => ({
    title: "Alarms",
    drawerLabel: "Alarms",
    headerRight: (
        <Icon
            name={"add"}
            color={Colors.brandLightGrey}
            underlayColor={Colors.brandDarkGrey}
            size={28}
            onPress={() => navigation.state.params.handleAddAlarm()}
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
            style={{ paddingLeft: 20, marginRight: scaleByFactor(8, 0.9) }}
        />
    ),
    headerLeft: (
        <Icon
            name={"menu"}
            color={Colors.brandLightGrey}
            underlayColor={Colors.brandDarkGrey}
            size={28}
            /* "DrawerOpen" is a built-in navigation function. I did not define it anywhere*/
            onPress={navigation.openDrawer}
            navigate={navigation.navigate}
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
            style={{ marginLeft: scaleByFactor(8, 0.9) }}
        />
    )
});

const otherDrawerNavOptions = title => {
    return ({ navigation }) => ({
        title: title,
        drawerLabel: title,
        headerStyle: {
            // Style the header view itself (aka. the nav bar)
            backgroundColor: Colors.brandDarkGrey,
            borderBottomWidth: 0
        },
        headerTitleStyle: {
            // style the Title text of the header
            color: Colors.brandLightGrey
        },
        headerLeft: (
            <Icon
                name={"menu"}
                color={Colors.brandLightGrey}
                underlayColor={Colors.brandDarkGrey}
                size={28}
                /* "DrawerOpen" is a built-in navigation function. I did not define it anywhere*/
                onPress={navigation.openDrawer}
                navigate={navigation.navigate}
                hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                style={{ marginLeft: scaleByFactor(8, 0.9) }}
            />
        )
    });
};

function renderMenuIcon({ type, name, size }) {
    if (type == "MaterialIcon") {
        return (
            <MaterialIcon
                name={name}
                color={Colors.brandVeryLightPurple}
                underlayColor={Colors.brandDarkGrey}
                size={size}
                // style={{ flex: 0.1 }}
            />
        );
    } else if (type == "FontAwesomeIcon") {
        return (
            <FontAwesomeIcon
                name={name}
                color={Colors.brandVeryLightPurple}
                underlayColor={Colors.brandDarkGrey}
                size={size}
                // style={{ flex: 0.1 }}
            />
        );
    }
}

const MainStack = createStackNavigator(
    {
        AlarmsList: {
            screen: Alarms,
            navigationOptions: alarmListNavOptions
        },
        AlarmDetail: {
            screen: AlarmDetail,
            navigationOptions: ({ navigation }) => ({
                drawerLockMode: "locked-closed", // this prevents the drawer from opening when user swipes from left of screen to go Back
                headerStyle: {
                    backgroundColor: Colors.brandDarkGrey,
                    // backgroundColor: "transparent",
                    borderBottomWidth: 0
                },
                headerTitleStyle: {
                    color: Colors.brandLightGrey
                },
                headerBackTitle: null
            })
        },
        TaskDetail: {
            screen: TaskDetail
        },
        Sounds: {
            screen: Sounds
        }
    },
    navigationConfig
);

let screenMenuIcons = [
    { type: "MaterialIcon", name: "access-alarm", size: 24 },
    { type: "FontAwesomeIcon", name: "magic", size: 22 },
    { type: "MaterialIcon", name: "settings", size: 22 },
    { type: "MaterialIcon", name: "help", size: 22 },
    { type: "FontAwesomeIcon", name: "info-circle", size: 22 }
];
// NICE_COLOR: #234853

const CustomDrawerContentComponent = props => {
    // console.log("props", props);
    const color = props.focused
        ? props.activeTintColor
        : props.inactiveTintColor;

    let spacer = <View style={{ minWidth: 15 }} />;

    return (
        <LinearGradient
            start={{ x: 0.8, y: 0 }}
            end={{ x: 0.6, y: 1.96 }}
            // colors={["rgba(255, 255, 0, 1)", "rgba(255, 255, 150, 1)"]}
            // colors={[Colors.brandLightPurple, "#FFFFFF"]}
            colors={[Colors.brandDarkPurple, "#000"]}
            style={[
                {
                    flex: 1
                }
            ]}
        >
            <SafeAreaView
                style={{ flex: 1 }}
                forceInset={{
                    top: "never",
                    horizontal: "never",
                    bottom: "always"
                }}
            >
                <LinearGradient
                    start={{ x: 0.8, y: -4 }}
                    end={{ x: 0.6, y: 1.0 }}
                    // colors={[
                    //     "rgba(255, 255, 150, 0.7)",
                    //     "rgba(255, 255, 50, 0.8)"
                    // ]}
                    colors={[Colors.brandLightPurple, "#FFFFFF"]}
                    // colors={["rgba(255, 255, 25, 0.9)", "#FFFFFF"]}
                    style={[
                        {
                            padding: 15
                            // backgroundColor: "rgba(255, 255, 25, 0.9)",
                            // backgroundColor: "rgba(255, 255, 255, 0.1)"
                            // backgroundColor: Colors.brandDarkPurple
                            // backgroundColor: Colors.brandDarkGrey
                            // opacity: 0.5
                            // paddingTop: 30,
                            // height: 90
                        }
                    ]}
                    // overflow="hidden"
                >
                    {isIphoneX() ? (
                        <View
                            style={{
                                height: 30
                            }}
                        />
                    ) : null}
                    <View
                        style={{
                            height: 65,
                            justifyContent: "flex-end"
                            // alignItems: "center"
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 33,
                                // color: "#D9D9D9",
                                color: "#272727",
                                // color: "yellow",
                                fontFamily: "Quesha",
                                fontWeight: "bold",
                                letterSpacing: 3,
                                opacity: 1,
                                textShadowColor: "black",
                                textShadowOffset: { width: 10, height: 5 }
                            }}
                        >
                            {/*  cloc
                            <Text style={{ fontSize: 55 }}>k</Text>
                            ulate */}
                            Clockulate
                        </Text>
                        {/* <Image
                            style={{
                                height: 65,
                                width: 65,
                                position: "absolute",
                                right: 10,
                                top: 30
                                // transform: [{ rotate: "25deg" }]
                            }}
                            source={require("../img/AppIcon_NoBgd_Clockulate.png")}
                        /> */}
                    </View>
                </LinearGradient>
                <DrawerItems
                    {...props}
                    getLabel={scene => {
                        let { index } = scene;
                        let shade = "transparent";
                        if (index % 2 != 0) {
                            shade = "rgba(230, 0, 230, 0.03)";
                        }
                        console.log("created icon");
                        return (
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: shade,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    height: 50,
                                    paddingLeft: 10
                                }}
                            >
                                <View
                                    style={{
                                        flex: 0.15,
                                        alignContent: "center",
                                        alignItems: "center"
                                    }}
                                >
                                    {renderMenuIcon(screenMenuIcons[index])}
                                </View>
                                {spacer}
                                <Text
                                    style={[
                                        { color },
                                        props.labelStyle,
                                        props.extraLabelStyle,
                                        { flex: 0.85 }
                                    ]}
                                >
                                    {props.getLabel(scene)}
                                </Text>
                            </View>
                        );
                    }}
                />
            </SafeAreaView>

            <Text
                style={{
                    position: "absolute",
                    alignSelf: "center",
                    bottom: isIphoneX() ? 25 : 15,
                    color: Colors.brandVeryLightPurple
                }}
            >
                Version 0.2
            </Text>
        </LinearGradient>
    );
};

export const DrawerRoot = createDrawerNavigator(
    {
        Alarms: {
            screen: MainStack
        },
        Upgrade: {
            screen: createStackNavigator(
                {
                    SettingsScreen: {
                        screen: Upgrade
                    }
                },
                {
                    navigationOptions: otherDrawerNavOptions("Upgrade")
                }
            )
        },
        Settings: {
            screen: createStackNavigator(
                {
                    SettingsScreen: {
                        screen: Settings
                    }
                },
                {
                    navigationOptions: otherDrawerNavOptions("Settings")
                }
            )
        },
        Help: {
            screen: createStackNavigator(
                {
                    SettingsScreen: {
                        screen: Help
                    }
                },
                {
                    navigationOptions: otherDrawerNavOptions("Help")
                }
            )
        },
        About: {
            screen: createStackNavigator(
                {
                    AboutScreen: {
                        screen: About
                    }
                },
                {
                    navigationOptions: otherDrawerNavOptions("About")
                }
            )
        }
    },
    {
        // drawerWidth: 250,
        initialRouteName: "Alarms",
        contentOptions: {
            activeBackgroundColor: "transparent",
            activeTintColor: Colors.brandLightPurple,
            itemsContainerStyle: {
                marginVertical: 0
            },
            iconContainerStyle: {
                opacity: 1
            },
            labelStyle: {
                fontFamily: "Quesha",
                fontSize: 25,
                letterSpacing: 2,
                // color: "#D9D9D9",
                color: Colors.brandVeryLightPurple
            }
        },
        headerMode: "screen",
        order: ["Alarms", "Upgrade", "Settings", "Help", "About"],
        contentComponent: CustomDrawerContentComponent
    }
);
