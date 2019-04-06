import { AsyncStorage } from "react-native";

let data = {};

try {
    AsyncStorage.getItem("visitedHelp").then(value => {
        console.log("Has user visited Help screen yet?", value);
        value = JSON.parse(value);
        data.visitedHelp = value;
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

export default data;
