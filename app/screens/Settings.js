import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback
} from "react-native";

// TODO:
export default class Settings extends React.Component {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    render() {
        return (
            <View style={{ flex: 1 }}>
                <View />
            </View>
        );
    }
}
