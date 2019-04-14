import React from "react";
import { TouchableOpacity, Text, Button } from "react-native";
import { createStackNavigator } from "react-navigation";
import FAIcon from "react-native-vector-icons/FontAwesome";

import Help from "./Help";
// import upgrades from "../config/upgrades";
import { scaleByFactor } from "../util/font-scale";
import Colors from "../styles/colors";

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
        // let { state: { params } = {} } = navigation;

        return {
            headerStyle: {
                // Style the header view itself (aka. the nav bar)
                backgroundColor: Colors.brandDarkGrey,
                borderBottomWidth: 0
            },
            headerRight: (
                <FAIcon
                    name={"info"}
                    color={Colors.brandLightGrey}
                    underlayColor={Colors.brandDarkGrey}
                    size={24}
                    onPress={() => {
                        // ClKAlert -- how to use Help
                        navigation.state.params.toggleInfoPopup();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                    style={{
                        paddingLeft: 20,
                        marginRight: scaleByFactor(12, 0.9)
                    }}
                />
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
