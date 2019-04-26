/**
 * Created by rdunn on 2017-07-16.
 */

import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Easing,
    Animated,
    Dimensions,
    InteractionManager
} from "react-native";
import {
    createStackNavigator,
    createDrawerNavigator,
    SafeAreaView,
    DrawerItems,
    createAppContainer
    // Header,
    // StackViewTransitionConfigs
} from "react-navigation";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import {
    AdMobBanner
    // AdMobInterstitial,
    // PublisherBanner
    // AdMobRewarded
} from "react-native-admob";
import LottieView from "lottie-react-native";
import VersionNumber from "react-native-version-number";

import Alarms from "../screens/Alarms";
import AlarmDetail from "../screens/AlarmDetail";
import TaskDetail from "../screens/TaskDetail";
import Settings from "../screens/SettingsScreen";
import About from "../screens/About";
import Sounds from "../screens/Sounds";
import { UpgradeModal, UpgradeStack } from "../screens/UpgradeContainters";
import { HelpModal, HelpStack } from "../screens/HelpContainers";
import SleepLog from "../screens/SleepLog";
import PickerInputPage from "../screens/PickerInputPage";
import PlainTextScreen from "../screens/PlainTextScreen";
import Help from "../screens/Help";
import LinearGradient from "react-native-linear-gradient";
import { isIphoneX } from "react-native-iphone-x-helper";
import { AdWrapper } from "../services/AdmobService";
import Upgrades from "../config/upgrades";

import Colors from "../styles/colors";
import { scaleByFactor } from "../util/font-scale";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
// export const AlarmTabs = TabNavigator({
//     AlarmDetail: {
//         screen: AlarmDetail,
//         navigationOptions: {
//             tabBarLabel: 'Auto-Calc',
//             tabBarIcon: ({tintColor}) => ( <Icon name="list" size={35} color={tintColor}/> ),
//         },
//     },
// });

let SlideFromBottom = (index, position, height) => {
    const inputRange = [index - 1, index, index + 1];
    const translateY = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [height, 0, 0]
    });

    const SlideFromBottom = { transform: [{ translateY }] };
    return SlideFromBottom;
};

let SlideFromRight = (index, position, width) => {
    const inputRange = [index - 1, index, index + 1];
    const translateX = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [width, 0, 0]
    });
    const slideFromRight = { transform: [{ translateX }] };
    return slideFromRight;
};

const TransitionConfiguration = () => {
    return {
        transitionSpec: {
            duration: 1400,
            timing: Animated.timing,
            easing: Easing.out(Easing.poly(15)),
            useNativeDriver: true
        },
        screenInterpolator: sceneProps => {
            const { layout, position, scene } = sceneProps;
            const width = layout.initWidth;
            const height = layout.initHeight;
            const { index, route } = scene;
            const params = route.params || {};
            const transition = params.transition || "default";
            // console.log("params", params);
            return {
                collapseExpand: SlideFromBottom(index, position, height),
                default: SlideFromRight(index, position, width)
            }[transition];
        }
    };
};

/* Alternative way of doing custom transition. Not using for now */
// const IOS_MODAL_ROUTES = ["TaskDetail"];
// let dynamicModalTransition = (transitionProps, prevTransitionProps) => {
//     const isModal = IOS_MODAL_ROUTES.some(
//         screenName =>
//             screenName === transitionProps.scene.route.routeName ||
//             (prevTransitionProps &&
//                 screenName === prevTransitionProps.scene.route.routeName)
//     );
//     return StackViewTransitionConfigs.defaultTransitionConfig(
//         transitionProps,
//         prevTransitionProps,
//         isModal
//     );
// };

/*
    This is an optional object to be passed into StackNavigator when it is created. It provides
    default configuration for every screen within the StackNavigator. These configurations can then
    be overwritten on a per-screen basis if needed.
 */
const navigationConfig = {
    initialRouteName: "AlarmsList",
    headerMode: "float",
    defaultNavigationOptions: {
        title: "Alarms",
        headerStyle: {
            // Style the header view itself (aka. the nav bar)
            backgroundColor: Colors.brandDarkGrey,
            borderBottomWidth: 0
        },
        headerTitleStyle: {
            // style the Title text of the header
            color: Colors.brandLightOpp
        },
        headerTintColor: Colors.brandLightGrey, // this sets color for 'Back' icon and text
        gesturesEnabled: false
    },
    // this hides the white top-padding in place of header for child screens that are animating
    // in from bottom
    cardStyle: { backgroundColor: "transparent" },
    transitionConfig: TransitionConfiguration
};

const alarmListNavOptions = ({ navigation }) => ({
    title: "Alarms",
    drawerLabel: "Alarms",
    headerRight: (
        <MaterialIcon
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
        <MaterialIcon
            name={"menu"}
            color={Colors.brandLightGrey}
            underlayColor={Colors.brandDarkGrey}
            size={28}
            /* "openDrawer" is a built-in navigation function. I did not define it anywhere*/
            onPress={() => {
                navigation.openDrawer();
            }}
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
            color: Colors.brandLightOpp
        },
        headerLeft: (
            <MaterialIcon
                name={"menu"}
                color={Colors.brandLightGrey}
                underlayColor={Colors.brandDarkGrey}
                size={28}
                /* "openDrawer" is a built-in navigation function. I did not define it anywhere*/
                onPress={() => {
                    navigation.openDrawer();
                }}
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
    } else if (type == "MaterialComIcon") {
        return (
            <MaterialComIcon
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
                headerStyle: {
                    backgroundColor: Colors.brandDarkGrey,
                    // backgroundColor: "rgba(19, 7, 39, 0.7)",
                    // backgroundColor: Colors.brandDarkPurple,
                    // backgroundColor: "transparent",
                    borderBottomWidth: 0
                },
                headerTitleStyle: {
                    color: Colors.brandLightOpp
                }
                // headerTransparent: true,
            })
        },
        TaskDetail: {
            screen: TaskDetail,
            navigationOptions: ({ navigation }) => ({
                headerStyle: {
                    backgroundColor: Colors.brandDarkGrey,
                    // This is required, otherwise TaskDetail header has a bottomBorder. Must be something to
                    // do with the custom transition.
                    borderBottomWidth: 0
                },
                // headerTransparent: true,
                headerTitleStyle: {
                    color: Colors.brandLightOpp
                }
            })
        },
        Sounds: {
            screen: Sounds
        }
    },
    navigationConfig
);

const ModalStack = createStackNavigator(
    {
        Main: {
            screen: MainStack
        },
        Upgrade: {
            screen: UpgradeModal
        },
        Help: {
            screen: HelpModal
        }
    },
    {
        mode: "modal",
        headerMode: "none"
    }
);

/* This is the only way I could find to disable drawer-opening on certain screens of 
    the stack navigator */
// NOTE: This is no longer working. Instead I've set all of Mainstack to have drawerLockMode of "locked-closed"
// MainStack.navigationOptions = ({ navigation }) => {
//     let drawerLockMode = "unlocked";
//     if (navigation.state.index > 0) {
//         drawerLockMode = "locked-closed";
//     }
//     return {
//         drawerLockMode
//     };
// };

let screenMenuIcons = [
    { type: "MaterialIcon", name: "access-alarm", size: 24 },
    { type: "FontAwesomeIcon", name: "magic", size: 22 },
    { type: "MaterialComIcon", name: "notebook", size: 24 },
    { type: "MaterialIcon", name: "settings", size: 22 },
    { type: "MaterialIcon", name: "help", size: 22 },
    { type: "FontAwesomeIcon", name: "info-circle", size: 22 }
];
// NICE_COLOR: #234853

_bannerError = e => {
    console.log("_bannerError");
    console.log(e);
};

let menuImage = isIphoneX()
    ? require("../img/menu_header_v16_notch.json")
    : require("../img/menu_header_v13_notchless.json");

const CustomDrawerContentComponent = props => {
    // console.log("props", props);
    const color = props.focused
        ? props.activeTintColor
        : props.inactiveTintColor;

    return (
        <LinearGradient
            start={{ x: 0.8, y: 0 }}
            end={{ x: 0.6, y: 1.96 }}
            colors={[Colors.brandMidPurple, "#000"]}
            style={[
                {
                    flex: 1,
                    overflow: "hidden"
                }
            ]}
        >
            <View
                style={{
                    // height: 95,
                    height: isIphoneX() ? 140 : 100,
                    alignSelf: "stretch",
                    backgroundColor: Colors.brandMidPurple,
                    shadowOpacity: 0.7,
                    shadowRadius: 5,
                    shadowColor: "black",
                    elevation: 3
                }}
            >
                <LottieView
                    source={menuImage}
                    // progress={animate}
                    resizeMode={"cover"}
                    // resizeMode={"contain"}
                    style={[StyleSheet.absoluteFill]}
                    // style={[StyleSheet.absoluteFill]}
                    // style={[
                    //     // StyleSheet.absoluteFill,
                    //     { height: 115, top: 0 }
                    // ]}
                />
            </View>
            <SafeAreaView
                style={{ flex: 1 }}
                forceInset={{
                    top: "never",
                    horizontal: "never",
                    bottom: "always"
                }}
            >
                <DrawerItems
                    {...props}
                    // NOTE: This is not required for current needs. But may come in handy, so leaving commented out
                    // onItemPress={route => {
                    //     console.log("route", route);
                    //     props.onItemPress(route);
                    // }}
                    getLabel={scene => {
                        let { index } = scene;
                        let shade = "transparent";
                        if (index % 2 != 0) {
                            shade = "rgba(255, 255, 255, 0.05)";
                        }
                        // console.log("created icon");
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
                                <View style={{ minWidth: 15 }} />
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
                    bottom: isIphoneX() ? 34 : 15,
                    fontFamily: "Avenir-Black",
                    color: Colors.brandVeryLightPurple
                }}
            >
                {"v" + VersionNumber.appVersion}
            </Text>
        </LinearGradient>
    );
};

const DrawerRoot = createDrawerNavigator(
    {
        Alarms: {
            screen: ModalStack,
            navigationOptions: {
                drawerLockMode: "locked-closed"
            }
        },
        UpgradeStack: {
            screen: createStackNavigator(
                {
                    UpgradeScreen: {
                        screen: UpgradeStack
                    }
                },
                {
                    defaultNavigationOptions: otherDrawerNavOptions("Upgrade")
                }
            ),
            navigationOptions: {
                drawerLabel: "Upgrade"
            }
        },
        SleepLog: {
            screen: createStackNavigator(
                {
                    SleepLogScreen: {
                        screen: SleepLog
                    }
                },
                {
                    defaultNavigationOptions: otherDrawerNavOptions("Sleep Log")
                }
            ),
            navigationOptions: {
                drawerLabel: "Sleep Log"
            }
        },
        Settings: {
            screen: createStackNavigator({
                SettingsScreen: {
                    screen: Settings,
                    navigationOptions: otherDrawerNavOptions("Settings")
                },
                PickerInputScreen: {
                    screen: PickerInputPage,
                    navigationOptions: {
                        headerStyle: {
                            // Style the header view itself (aka. the nav bar)
                            backgroundColor: Colors.brandDarkGrey,
                            borderBottomWidth: 0
                        },
                        headerTintColor: Colors.brandLightOpp,
                        headerTitleStyle: {
                            // style the Title text of the header
                            color: Colors.brandLightOpp
                        }
                    }
                }
            })
        },
        HelpStack: {
            screen: createStackNavigator(
                {
                    HelpScreen: {
                        screen: HelpStack
                    }
                },
                {
                    defaultNavigationOptions: otherDrawerNavOptions("Help")
                }
            ),
            navigationOptions: {
                drawerLabel: "Help"
            }
        },
        About: {
            screen: createStackNavigator(
                {
                    AboutScreen: {
                        screen: About,
                        navigationOptions: otherDrawerNavOptions("About")
                    },
                    PlainTextScreen: {
                        screen: PlainTextScreen,
                        navigationOptions: {
                            headerStyle: {
                                // Style the header view itself (aka. the nav bar)
                                backgroundColor: Colors.brandDarkGrey,
                                borderBottomWidth: 0
                            },
                            headerTintColor: Colors.brandLightOpp,
                            headerTitleStyle: {
                                // style the Title text of the header
                                color: Colors.brandLightOpp
                            }
                        }
                    }
                }
                // {
                //     defaultNavigationOptions: otherDrawerNavOptions("About")
                // }
            )
        }
    },
    {
        // drawerWidth: 250,
        initialRouteName: "Alarms", // DEV: change back to 'Alarms'
        contentOptions: {
            activeBackgroundColor: "transparent",
            activeTintColor: Colors.brandLightPurple,
            itemsContainerStyle: {
                marginVertical: 0,
                backgroundColor: Colors.brandDarkPurple
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
        /* NOTE: While the backgroundColor will theoretically not be shown since I'm using a custom 
            contentComponent, if I don't set this I see a white flickering on the drawer's edge
          during the drawer animation - only confirmed on real iPhone XR. */
        drawerBackgroundColor: Colors.brandDarkPurple,
        headerMode: "screen",
        order: [
            "Alarms",
            "UpgradeStack",
            "SleepLog",
            "Settings",
            "HelpStack",
            "About"
        ],
        contentComponent: CustomDrawerContentComponent
    }
);

export const AppContainer = createAppContainer(DrawerRoot);
