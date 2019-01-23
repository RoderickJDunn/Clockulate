import React from "react";
import { AppContainer } from "./app/config/router";
import { AsyncStorage, View, StatusBar, Dimensions } from "react-native";

// import ArrowView from "./app/components/arrow-view-native";

import insertPrepopData from "./app/data/data-prepop";

// configure();
export default class App extends React.Component {
    constructor() {
        super();

        console.info("App - constructor");
        this.state = {
            firstLaunch: null
        };
    }

    componentDidMount() {
        console.log("App: componentDidMount");

        try {
            AsyncStorage.getItem("alreadyLaunched").then(value => {
                if (value === null) {
                    console.log("First Launch");
                    AsyncStorage.setItem(
                        "alreadyLaunched",
                        JSON.stringify(true)
                    );
                    // this.setState({ firstLaunch: true });
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
    }

    render() {
        console.log(
            "------------------------ RENDERING APP -------------------------- "
        );
        let width = Dimensions.get("window").width;
        let height = Dimensions.get("window").height;
        // console.log(`Width: ${width} | Height: ${height}`);

        return (
            <View style={{ flex: 1 }}>
                <StatusBar animated={true} barStyle={"light-content"} />
                <AppContainer />
            </View>
        );
    }
}
