"use strict";

import { StyleSheet } from "react-native";
import Colors from "./colors";
import { scaleByFactor } from "../util/font-scale";

const ScreenStyles = StyleSheet.create({
    TaskScreen: {
        flex: 1,
        padding: scaleByFactor(10, 0.5),
        backgroundColor: Colors.backgroundGrey,
        alignSelf: "stretch"
    }
});

export default ScreenStyles;
