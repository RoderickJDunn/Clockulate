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
            <ScrollView style={{ flex: 1 /* , justifyContent: "center" */ }}>
                <SafeAreaView>
                    {/* <Text style={styles.descriptionText}>{this.state.text}</Text> */}
                    {this.state.text()}
                </SafeAreaView>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    // container: {
    //     top: SCREEN_HEIGHT * 0.37,
    //     height: SCREEN_HEIGHT * 0.6,
    //     width: SCREEN_WIDTH,
    //     minHeight: 250,
    //     padding: 17
    // },
    titleText: {
        fontSize: 18,
        paddingVertical: 25,
        alignSelf: "stretch",
        textAlign: "center"
    },
    descriptionText: {
        fontSize: 15,
        paddingHorizontal: 8,
        paddingVertical: 15,
        color: Colors.disabledGrey
    },
    pickerUpperWrapper: {
        flex: 0.7,
        borderRadius: 15
        // borderWidth: 0.5
    },
    headerSeparator: {
        alignSelf: "stretch",
        height: 0.3,
        backgroundColor: "#AAA"
    },
    pickerGroup: {
        // flex: 0.4,
        height: 200,
        borderRadius: 15,
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        // backgroundColor: Colors.backgroundBright,
        flexDirection: "row"
        // backgroundColor: "blue",
        // alignItems: "center"
        // justifyContent: "center"
    },
    pickerWrapper: {
        flex: 0.4,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row"
        // backgroundColor: Colors.backgroundBright
    },
    actionSheetBtnRowWrap: {
        flex: 0.15,
        // backgroundColor: "red",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingTop: 7
    },
    actionSheetBtnWrap: {
        flex: 0.49,
        alignSelf: "stretch",
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: Colors.brandDarkGrey,
        // borderWidth: 0.5,
        borderRadius: 15,
        overflow: "hidden"
    },
    actionSheetBtn: {
        flex: 1,
        alignSelf: "stretch",
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: Colors.backgroundBright,
        borderRadius: 15
    },
    headerText: {
        textAlign: "center",
        color: Colors.darkGreyText,
        fontSize: 20
    },
    subtitleText: {
        // textAlign: "center",
        color: Colors.disabledGrey,
        fontSize: 17
    },
    buttonText: {
        textAlign: "center",
        fontSize: 20,
        color: "#0000FF"
    }
});
