import React from "react";
import { DrawerRoot } from "./app/config/router";
import {
    AsyncStorage,
    View,
    StatusBar,
    Dimensions,
    AppState,
    Platform
} from "react-native";
// import ArrowView from "./app/components/arrow-view-native";

import realm from "./app/data/DataSchemas";
import insertPrepopData from "./app/data/data-prepop";

import {
    cancelInAppAlarm,
    setInAppAlarm
    // configure
} from "./app/alarmservice/PushController";

// configure();
export default class App extends React.Component {
    constructor() {
        super();

        console.info("App - constructor");
        this.state = {
            firstLaunch: null,
            appState: AppState.currentState
        };
    }

    componentDidMount() {
        console.log("App: componentDidMount");
        AppState.addEventListener("change", this._handleAppStateChange);

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
                    // this.setState({ firstLaunch: false });
                }
            });
        } catch (error) {
            console.error(
                `Unable to check if app has already been launched: ${error}`
            );
        }
    }

    componentWillUnmount() {
        AppState.removeEventListener("change", this._handleAppStateChange);
    }

    _handleAppStateChange = nextAppState => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === "active"
        ) {
            console.log("App has come to the foreground!");

            // set timers for in-app alarms
            if (Platform.OS == "ios") {
                let alarms = realm.objects("Alarm").filtered("enabled == true");
                for (let i = 0; i < alarms.length; i++) {
                    setInAppAlarm(alarms[i]);
                }
            }
        } else if (nextAppState === "background") {
            console.log("App is going into background");
            // cancel any set timers for in-app alarms (iOS only)

            if (Platform.OS == "ios") {
                let alarms = realm.objects("Alarm").filtered("enabled == true");
                for (let i = 0; i < alarms.length; i++) {
                    cancelInAppAlarm(alarms[i]);
                }
            }
        }

        this.setState({ appState: nextAppState });
    };

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
                <DrawerRoot />
            </View>
        );
    }
}
