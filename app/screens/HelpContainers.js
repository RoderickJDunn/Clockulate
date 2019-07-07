import React from "react";
import {
    TouchableOpacity,
    Text,
    Button,
    Animated,
    StyleSheet,
    Platform,
    View,
    LayoutAnimation
} from "react-native";
import { createStackNavigator } from "react-navigation";
import FAIcon from "react-native-vector-icons/FontAwesome";
import FeatherIcon from "react-native-vector-icons/Feather";

import Help from "./Help";
// import upgrades from "../config/upgrades";
import { scaleByFactor } from "../util/font-scale";
import Colors from "../styles/colors";

let _menuAnim = new Animated.Value(0);

export class HelpStack extends React.Component {
    static navigationOptions = ({
        navigation,
        navigationOptions,
        screenProps
    }) => {
        // console.log("navigationOptions", navigationOptions);
        // console.log("navigation", navigation);
        // console.log("screenProps", screenProps);
        // let navOpts = getActiveChildNavigationOptions(navigation, screenProps);
        // console.log("navOpts", navOpts);
        let { state: { params } = {} } = navigation;

        let menuIsOpen = params && params.menuIsOpen;
        let title = menuIsOpen ? "Help Topics" : "Help";

        let emptyHeaderLeft = { headerLeft: null };

        return {
            headerStyle: {
                // Style the header view itself (aka. the nav bar)
                backgroundColor: Colors.brandDarkGrey,
                borderBottomWidth: 0
            },
            // NOTE: This is how to conditionally include properties in an object using the spread operator
            ...(menuIsOpen && emptyHeaderLeft),
            headerTitle: (
                <View style={{ paddingHorizontal: 20 }}>
                    <Text style={styles.navTitleText}>{title}</Text>
                </View>
            ),
            headerRight: (
                <TouchableOpacity
                    onPress={() => {
                        params.setMenuState && params.setMenuState(!menuIsOpen);
                    }}
                    style={{
                        alignSelf: "flex-end",
                        paddingLeft: 20,
                        paddingRight: 10
                        // height: Header.HEIGHT - 20
                    }}
                    hitSlop={{
                        top: 10,
                        bottom: 10,
                        left: 20,
                        right: 0
                    }}
                >
                    <Animated.View
                        style={{
                            alignSelf: "center",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            transform: [
                                {
                                    rotate: _menuAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "-90deg"]
                                    })
                                },
                                { perspective: 1000 }
                            ]
                        }}
                    >
                        <FeatherIcon
                            name={"more-vertical"}
                            color={Colors.brandLightGrey}
                            underlayColor={Colors.brandDarkGrey}
                            size={24}
                        />
                    </Animated.View>
                </TouchableOpacity>
            )
        };
    };

    render() {
        return (
            <Help
                // screenProps={{
                //     SP_stack: "Hello, I'm a SCREEN PROP from Help STACK!"
                // }}
                screenType={"stack"}
                menuAnim={_menuAnim}
                {...this.props}
            />
        );
    }
}

export class HelpModal extends React.Component {
    static navigationOptions = ({ navigation }) => {
        // console.log("navigationOptions", navigationOptions);
        // console.log("navigation", navigation);
        // console.log("screenProps", screenProps);
        // let navOpts = getActiveChildNavigationOptions(navigation, screenProps);
        // console.log("navOpts", navOpts);

        return {
            header: () => null
        };
    };

    render() {
        return (
            <Help
                // screenProps={{
                //     SP_stack: "Hello, I'm a SCREEN PROP from Help MODAL!!!!!!!!!!!!"
                // }}
                screenType={"modal"}
                {...this.props}
            />
        );
    }
}

const styles = StyleSheet.create({
    navTitleText: {
        color: Colors.brandLightOpp,
        fontSize: Platform.OS === "ios" ? 17 : 20,
        fontWeight: Platform.OS === "ios" ? "600" : "500"
    }
});
