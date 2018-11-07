"use strict";

import { StyleSheet } from "react-native";
import Colors from "./colors";
import { scaleByFactor } from "../util/font-scale";

const ScreenStyles = StyleSheet.create({
    TaskScreen: {
        flex: 1,
        backgroundColor: Colors.backgroundGrey,
        alignSelf: "stretch"
    }
});

export default ScreenStyles;
