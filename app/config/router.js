/**
 * Created by rdunn on 2017-07-16.
 */

import React from "react";
import { View, Text, Button } from "react-native";
import { StackNavigator, DrawerNavigator } from "react-navigation";
import { Icon } from "react-native-elements";

import Alarms from "../screens/Alarms";
import AlarmDetail from "../screens/AlarmDetail";
import AlarmDetailBasic from "../screens/AlarmDetailBasic";
import TaskDetail from "../screens/TaskDetail";
import Settings from "../screens/Settings";
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

function fakePage() {
    return View;
}

const MainStack = StackNavigator(
    {
        AlarmsList: {
            screen: Alarms,
            navigationOptions: ({ navigation }) => ({
                title: "Alarms",
                drawerLabel: "Close",
                headerRight: (
                    <Icon
                        name={"add"}
                        color={Colors.brandLightGrey}
                        underlayColor={Colors.brandDarkGrey}
                        size={28}
                        onPress={() => navigation.state.params.handleAddAlarm()}
                        hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                        style={{ marginRight: scaleByFactor(8, 0.9) }}
                    />
                ),
                headerLeft: (
                    <Icon
                        name={"menu"}
                        color={Colors.brandLightGrey}
                        underlayColor={Colors.brandDarkGrey}
                        size={28}
                        /* "DrawerOpen" is a built-in navigation function. I did not define it anywhere*/
                        onPress={() => navigation.navigate("DrawerOpen")}
                        navigate={navigation.navigate}
                        hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                        style={{ marginLeft: scaleByFactor(8, 0.9) }}
                    />
                )
            })
        },
        AlarmDetail: {
            screen: AlarmDetail,
            navigationOptions: ({ navigation }) => ({
                drawerLockMode: "locked-closed",
                headerStyle: {
                    backgroundColor: Colors.brandDarkGrey,
                    borderBottomWidth: 0
                },
                headerTitleStyle: {
                    color: Colors.brandLightGrey
                },
                // This is how you define a custom back button. Apart from styling, this also seems like the best way to
                //  perform any additional tasks before executing navigation.goBack(), otherwise, goBack() is called
                //  automatically when the back button is pushed
                headerLeft: (
                    <Icon
                        name={"chevron-left"}
                        color={Colors.brandLightGrey}
                        underlayColor={Colors.brandDarkGrey}
                        size={33}
                        onPress={() => {
                            navigation.state.params.handleBackBtn();
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 0, right: 20 }}
                    />
                )
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
        MainStack: {
            screen: MainStack
        },
        Settings: {
            screen: Settings
        }
    },
    {
        drawerWidth: 250,
        initialRouteName: "MainStack",
        contentOptions: {
            activeTintColor: "#e91e63",
            itemsContainerStyle: {
                marginVertical: 0
            },
            iconContainerStyle: {
                opacity: 1
            }
        },
        order: ["Settings", "MainStack"]
    }
);
