import React from "react";
import { Text, View, StyleSheet, ScrollView, SafeAreaView } from "react-native";

import Colors from "../styles/colors";

export default class PlainTextScreen extends React.Component {
    /*
    Props: 
     */

    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.state.params.title
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            text: props.navigation.state.params.text
        };
    }

    render() {
        return (
            <ScrollView
                style={{
                    flex: 1,
                    backgroundColor:
                        Colors.backgroundGrey /* , justifyContent: "center" */
                }}
            >
                <SafeAreaView>{this.state.text()}</SafeAreaView>
            </ScrollView>
        );
    }
}
