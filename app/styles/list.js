/**
 * Created by rdunn on 2017-08-23.
 */

"use strict";

import { StyleSheet, Dimensions } from "react-native";
import Colors from "./colors";
import { scale, scaleByFactor } from "../util/font-scale";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const ListStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundGrey,
        flexDirection: "row",
        zIndex: 50
    },
    item: {
        height: scaleByFactor(130, 0.2),
        padding: 10
    }
});

export const AlarmListStyle = StyleSheet.create({
    alarmRow: {
        flex: 1,
        flexDirection: "row",
        width: SCREEN_WIDTH + 100
    },
    toggleButton: {
        flex: 0.2,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingRight: scaleByFactor(17, 0.1)
    },
    infoContainer: {
        flex: 0.8,
        justifyContent: "center"
    },
    timeText: {
        fontSize: 75
    },
    deleteBtn: {
        position: "absolute",
        backgroundColor: Colors.deleteBtnRed,
        right: 0,
        width: 100,
        height: scaleByFactor(130, 0.2),
        justifyContent: "center",
        zIndex: 10000
    },
    deleteBtnText: {
        alignSelf: "stretch",
        textAlign: "center",
        color: "white"
    }
});

// const AlarmItemStyle = StyleSheet.create({});

export const TaskListStyle = StyleSheet.create({
    taskRow: {
        flex: 1,
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 10,
        width: SCREEN_WIDTH + 90 - scaleByFactor(20, 0.4), // 440
        height: 55,
        alignContent: "stretch",
        alignItems: "center",
        backgroundColor: "#dbd6dd",
        justifyContent: "space-between"
    },

    allChildren: {
        // marginLeft: 5,
        // marginRight: 5,
        fontSize: 20,
        overflow: "hidden"
    }
});

export const TaskItemStyle = StyleSheet.create({
    taskInfoWrap: {
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 10,
        width: SCREEN_WIDTH - scaleByFactor(20, 0.4) + 10, // SIDE_PADDING = 10 * 2.  PAD_DURATION_DELETE = 5
        height: 55,
        alignContent: "stretch",
        borderBottomColor: "#acacac",
        borderBottomWidth: 0.8,
        alignItems: "center",
        backgroundColor: "#dbd6dd",
        justifyContent: "space-between"
    },
    checkbox: {
        flexBasis: "11%"
        // height: 50,
    },
    description: {
        flexBasis: "71%"
    },
    duration: {
        // alignSelf: 'stretch',
        textAlign: "right",
        flexBasis: "18%",
        fontSize: 16
    },
    deleteBtn: {
        position: "absolute",
        backgroundColor: Colors.deleteBtnRed,
        marginLeft: 20,
        right: 0,
        width: 80,
        height: 55,
        justifyContent: "center",
        zIndex: 10000
    },
    deleteBtnText: {
        alignSelf: "stretch",
        textAlign: "center",
        color: "white"
    }
});
