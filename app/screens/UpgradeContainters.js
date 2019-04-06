import React from "react";
import { TouchableOpacity, Text, Button } from "react-native";
import { createStackNavigator } from "react-navigation";

import Upgrade from "./Upgrade";
import upgrades from "../config/upgrades";
import { scaleByFactor } from "../util/font-scale";
import Colors from "../styles/colors";

export class UpgradeStack extends React.Component {
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
        // let { state: { params } = {} } = navigation;

        return {
            headerStyle: {
                // Style the header view itself (aka. the nav bar)
                backgroundColor: Colors.brandDarkGrey,
                borderBottomWidth: 0
            },
            headerRight:
                upgrades.pro != true ? (
                    <TouchableOpacity
                        onPress={() => {
                            navigation.state.params.onPressRestore();
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                        style={{
                            paddingLeft: 20,
                            marginRight: scaleByFactor(8, 0.9)
                        }}
                    >
                        <Text
                            style={{
                                color: Colors.brandLightGrey,
                                fontSize: scaleByFactor(13)
                            }}
                        >
                            Restore
                        </Text>
                    </TouchableOpacity>
                ) : null
        };
    };

    render() {
        return (
            <Upgrade
                // screenProps={{
                //     SP_stack: "Hello, I'm a SCREEN PROP from Upgrade STACK!"
                // }}
                screenType={"stack"}
                {...this.props}
            />
        );
    }
}

export class UpgradeModal extends React.Component {
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
            <Upgrade
                // screenProps={{
                //     SP_stack: "Hello, I'm a SCREEN PROP from Upgrade MODAL!!!!!!!!!!!!"
                // }}
                screenType={"modal"}
                {...this.props}
            />
        );
    }
}
