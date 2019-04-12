import { AsyncStorage } from "react-native";

let data = {};

try {
    AsyncStorage.getItem("visitedHelp").then(value => {
        console.log("Has user visited Help screen yet?", value);
        value = JSON.parse(value);
        data.visitedHelp = value;
    });

    AsyncStorage.getItem("notFirstLaunch").then(value => {
        console.log("Is the the app's first launch ever?", value != true ? "Yes" : "No");
        value = JSON.parse(value);
        data.notFirstLaunch = value;
    });
} catch (error) {
    console.error(`Unable to check what purchases have been made: ${error}`);
}

data.setVistedHelp = value => {
    if (value != null) {
        data.visitedHelp = value;
        AsyncStorage.setItem("visitedHelp", JSON.stringify(value));
    }
};

data.setNotFirstLaunch = value => {
    if (value != null) {
        data.notFirstLaunch = value;
        AsyncStorage.setItem("notFirstLaunch", JSON.stringify(value));
    }
};

export default data;
