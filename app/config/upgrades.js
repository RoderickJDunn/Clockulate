import { AsyncStorage } from "react-native";

let purchases = {};

try {
    AsyncStorage.getItem("proPurchased").then(value => {
        console.log("Got pro Purchase item from storage", value);
        value = JSON.parse(value);
        if (value === true) {
            console.log("This is the PRO VERSION");
        } else {
            console.log("This is the FREE VERSION");
        }
        purchases.pro = value;
        // purchases.pro = true;  // DEV: fake in the PRO version for Animator
    });
} catch (error) {
    console.error(`Unable to check what purchases have been made: ${error}`);
}

purchases.setPro = value => {
    if (value != null) {
        purchases.pro = value;
        AsyncStorage.setItem("proPurchased", JSON.stringify(value));
    }
};

export default purchases;
