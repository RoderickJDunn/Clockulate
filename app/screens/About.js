import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback
} from "react-native";
import VersionNumber from "react-native-version-number";

// export var APP_VERSION = VersionNumber.appVersion;
// TODO:
export default class About extends React.Component {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height
    render() {
        return (
            <View style={{ flex: 1 }}>
                <Text>About Clockulate</Text>
                <Text>Version {VersionNumber.appVersion}</Text>
                <Text>Credits</Text>
                <Text>Credits</Text>
                <Text>Credits</Text>
                <Text>Credits</Text>
            </View>
        );
    }
}
