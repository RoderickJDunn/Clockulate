/**
 * Created by rdunn on 2017-07-16.
 */

import React from "react";
import { View, Text, Button, TouchableOpacity } from "react-native";
import { StackNavigator, DrawerNavigator } from "react-navigation";
import { Icon } from "react-native-elements";

import Alarms from "../screens/Alarms";
import AlarmDetail from "../screens/AlarmDetail";
import AlarmDetailBasic from "../screens/AlarmDetailBasic";
import TaskDetail from "../screens/TaskDetail";
import Settings from "../screens/Settings";
import About from "../screens/About";
import Sounds from "../screens/Sounds";

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

function fakePage() {
    return View;
}

const MainStack = StackNavigator(
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

export const DrawerRoot = DrawerNavigator(
    {
        Alarms: {
            screen: MainStack
        },
        Settings: {
            screen: StackNavigator(
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
        About: {
            screen: StackNavigator(
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
        drawerWidth: 250,
        initialRouteName: "Alarms",
        contentOptions: {
            activeTintColor: "#e91e63",
            itemsContainerStyle: {
                marginVertical: 0
            },
            iconContainerStyle: {
                opacity: 1
            }
        },
        headerMode: "screen",
        order: ["Alarms", "Settings", "About"]
    }
);
