import "./app/util/fix_timer_bug"; // at root of project on purpose

import React from "react";
import { AppContainer } from "./app/config/router";
import { AsyncStorage, View, StatusBar, Dimensions } from "react-native";
import upgrades from "./app/config/upgrades";

import insertPrepopData from "./app/data/data-prepop";
import MiscStorage from "./app/config/misc_storage";

export default class App extends React.Component {
    componentDidMount() {
        console.log("App: componentDidMount");

        try {
            AsyncStorage.getItem("notFirstLaunch").then(value => {
                if (value === null) {
                    console.log("First Launch");
                    MiscStorage.setNotFirstLaunch(true);
                    insertPrepopData();
                } else {
                    console.log("Not the first Launch");
                }
            });
        } catch (error) {
            console.error(
                `Unable to check if app has already been launched: ${error}`
            );
        }
        console.log("Pro Upgrade status: ", upgrades.pro);
    }

    render() {
        console.log(
            "------------------------ RENDERING APP -------------------------- "
        );
        let width = Dimensions.get("window").width;
        let height = Dimensions.get("window").height;

        return (
            <View style={{ flex: 1 }}>
                <StatusBar animated={true} barStyle={"light-content"} />
                <AppContainer />
            </View>
        );
    }
}
