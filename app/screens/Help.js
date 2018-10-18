import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback
} from "react-native";

// TODO: Intro/Tutorial
export default class Help extends React.Component {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    render() {
        return (
            <View style={{ flex: 1 }}>
                <Text>Introduction to Clockulate</Text>
                <Text>Intro</Text>
                <Text>blah</Text>
                <Text>tutorial</Text>
                <Text>blah</Text>
            </View>
        );
    }
}
