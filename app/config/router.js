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
    Header,
    StackViewTransitionConfigs
} from "react-navigation";
import { Icon } from "react-native-elements";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import {
    AdMobBanner,
    // AdMobInterstitial,
    PublisherBanner
    // AdMobRewarded
} from "react-native-admob";
import LottieView from "lottie-react-native";

import Alarms from "../screens/Alarms";
import AlarmDetail from "../screens/AlarmDetail";
import TaskDetail from "../screens/TaskDetail";
import Settings from "../screens/Settings";
import About from "../screens/About";
import Sounds from "../screens/Sounds";
import Upgrade from "../screens/Upgrade";
import Help from "../screens/Help";
import LinearGradient from "react-native-linear-gradient";
import { isIphoneX } from "react-native-iphone-x-helper";
import { AdWrapper, AdvSvcOnScreenConstructed } from "../services/AdmobService";

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
            duration: 500,
            easing: Easing.out(Easing.poly(15)),
            timing: Animated.timing,
            useNativeDriver: true
        },
        screenInterpolator: sceneProps => {
            const { layout, position, scene } = sceneProps;
            const width = layout.initWidth;
            const height = layout.initHeight;
            const { index, route } = scene;
            const params = route.params || {};
            const transition = params.transition || "default";
            console.log("params", params);
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
            onPress={() => {
                InteractionManager.runAfterInteractions(() => {
                    AdvSvcOnScreenConstructed("MainMenu");
                });
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
            color: Colors.brandLightGrey
        },
        headerLeft: (
            <Icon
                name={"menu"}
                color={Colors.brandLightGrey}
                underlayColor={Colors.brandDarkGrey}
                size={28}
                /* "DrawerOpen" is a built-in navigation function. I did not define it anywhere*/
                onPress={() => {
                    InteractionManager.runAfterInteractions(() => {
                        AdvSvcOnScreenConstructed("MainMenu");
                    });
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
                }
            })
        },
        TaskDetail: {
            screen: TaskDetail,
            navigationOptions: ({ navigation }) => ({
                drawerLockMode: "locked-closed", // this prevents the drawer from opening when user swipes from left of screen to go Back
                headerStyle: {
                    backgroundColor: Colors.brandDarkGrey
                    // backgroundColor: "transparent",
                    // borderBottomWidth: 0 // is this needed?
                },
                // headerTransparent: true,
                headerTitleStyle: {
                    color: Colors.brandLightGrey
                }
            })
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

let menuImage = isIphoneX()
    ? require("../img/menu_header_v9_e20_g1_h3.json")
    : require("../img/menu_header_v10_e1_g1_1_notchless.json");

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
            <View
                style={{
                    // height: 95,
                    height: isIphoneX() ? 115 : 104,
                    alignSelf: "stretch",
                    backgroundColor: "red"
                }}
            >
                <LottieView
                    // source={}
                    source={menuImage}
                    // progress={this.state.animProgress}
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
            {/* <View
                style={[
                    // StyleSheet.absoluteFill,
                    { backgroundColor: "red", height: 115, top: 0 }
                ]}
            /> */}
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
                    getLabel={scene => {
                        let { index } = scene;
                        let shade = "transparent";
                        if (index % 2 != 0) {
                            shade = "rgba(255, 255, 255, 0.05)";
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
                {true && (
                    <AdWrapper
                        borderPosition="top"
                        // borderColor={Colors.brandDarkGrey}
                        style={{
                            // overflow: "hidden",
                            alignSelf: "center",
                            // bottom: 100,
                            height: 300,
                            width: 280,

                            transform: [
                                {
                                    scale: SCREEN_HEIGHT < 660 ? 0.83 : 0.9
                                }
                            ]
                        }}
                    >
                        {SCREEN_HEIGHT < 660 ? (
                            <PublisherBanner
                                adSize="banner"
                                validAdSizes={["banner"]}
                                // adUnitID="ca-app-pub-3940256099942544/6300978111"
                                adUnitID="ca-app-pub-5775007461562122/1503272954"
                                testDevices={[AdMobBanner.simulatorId]}
                                onAdFailedToLoad={this._bannerError}
                                onAdLoaded={() => {
                                    console.log("adViewDidReceiveAd");
                                }}
                                style={{
                                    // flex: 1,
                                    alignSelf: "center"
                                    // bottom: 100,
                                }}
                            />
                        ) : (
                            <PublisherBanner
                                adSize="mediumRectangle"
                                validAdSizes={["mediumRectangle"]}
                                // adUnitID="ca-app-pub-3940256099942544/6300978111"
                                adUnitID="ca-app-pub-5775007461562122/1503272954"
                                testDevices={[AdMobBanner.simulatorId]}
                                onAdFailedToLoad={this._bannerError}
                                onAdLoaded={() => {
                                    console.log("adViewDidReceiveAd");
                                }}
                                style={{
                                    // flex: 1,
                                    alignSelf: "center"
                                    // bottom: 100,
                                }}
                            />
                        )}
                    </AdWrapper>
                )}
            </SafeAreaView>

            <Text
                style={{
                    position: "absolute",
                    alignSelf: "center",
                    bottom: isIphoneX() ? 34 : 15,
                    color: Colors.brandVeryLightPurple
                }}
            >
                v0.2
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
