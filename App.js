import React from "react";
import { MainStack } from "./app/config/router";
import {
    AppRegistry,
    AsyncStorage,
    View,
    StatusBar,
    Text,
    Dimensions
} from "react-native";
import ArrowView from "./app/components/arrow-view-native";

import insertDummyData from "./app/data/dummy";

export default class App extends React.Component {
    constructor() {
        super();

        console.log("1");
        // Arrows.createArrow();
        this.state = { firstLaunch: null };
        // console.log("Entry: Constructor");
        // let av = ArrowView();
    }

    componentDidMount() {
        // console.log("Entry: Component did mount");
        try {
            AsyncStorage.getItem("alreadyLaunched").then(value => {
                if (value === null) {
                    console.log("First Launch");
                    AsyncStorage.setItem(
                        "alreadyLaunched",
                        JSON.stringify(true)
                    );
                    this.setState({ firstLaunch: true });
                    insertDummyData();
                } else {
                    console.log("Not the first Launch");
                    this.setState({ firstLaunch: false });
                }
            });
        } catch (error) {
            console.error(
                `Unable to check if app has already been launched: ${error}`
            );
        }
    }

    render() {
        console.log("Rendering APP!!!!!!");
        let width = Dimensions.get("window").width;
        let height = Dimensions.get("window").height;
        console.log(`Width: ${width} | Height: ${height}`);
        return (
            <View style={{ flex: 1 }}>
                <Text>Hello</Text>
                <ArrowView
                    style={{
                        alignSelf: "flex-start",
                        position: "absolute",
                        width: width,
                        height: height,
                        backgroundColor: "#3789E1"
                    }}
                    shape={{
                        start: [100, 100],
                        end: [100, 400],
                        curve: 1,
                        skew: 0.1,
                        spread: 0
                    }}
                />
            </View>
        );
        // return (
        //     <View style={{ flex: 1 }}>
        //         <StatusBar animated={true} barStyle={"light-content"} />
        //         <MainStack />
        //     </View>
        // );
    }
}

AppRegistry.registerComponent("Alarm_AutoSet", () => App);
