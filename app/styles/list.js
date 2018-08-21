/**
 * Created by rdunn on 2017-08-23.
 */

"use strict";

import { StyleSheet, Dimensions } from "react-native";
import Colors from "./colors";
import { scale, scaleByFactor } from "../util/font-scale";
import * as CONST_DIMENSIONS from "../styles/const_dimensions";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const ListStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.brandDarkPurple,
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
        width: SCREEN_WIDTH + 200,
        opacity: 1,
        backgroundColor: "#efefef"
    },
    toggleButton: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 0.24,
        // paddingLeft: scaleByFactor(15, 0.4),
        marginRight: 15
    },
    infoContainer: {
        flex: 1,
        justifyContent: "center",
        alignContent: "stretch"
    },
    timeText: {
        fontSize: scaleByFactor(75, 0.2)
    },
    deleteBtn: {
        position: "absolute",
        backgroundColor: Colors.deleteBtnRed,
        right: 0,
        width: 100,
        height: scaleByFactor(130, 0.2),
        justifyContent: "center",
        zIndex: 10000,
        padding: 5
    },
    duplicateBtn: {
        position: "absolute",
        backgroundColor: "#68BBBB",
        right: 100,
        width: 100,
        height: scaleByFactor(130, 0.2),
        justifyContent: "center",
        zIndex: 10000,
        padding: 5
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
        backgroundColor: "transparent"
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
        // flex: 1,
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 10,
        // paddingRight: 10,
        width: SCREEN_WIDTH - scaleByFactor(20, 0.4) + 10, // SIDE_PADDING = 10 * 2.  PAD_DURATION_DELETE = 5
        height: 55,
        alignContent: "stretch",
        borderBottomColor: "black",
        borderBottomWidth: 0.8,
        alignItems: "center"
        // backgroundColor: "green"
        // justifyContent: "space-between"
    },
    taskInfoTouchable: {
        flex: 1,
        flexDirection: "row",
        height: 55,
        alignContent: "center",
        alignItems: "center",
        // backgroundColor: "transparent"
        // backgroundColor: "yellow"
        justifyContent: "space-between"
    },
    checkbox: {
        flex: 0.08
        // alignItems: "flex-start",
        // backgroundColor: "blue"
        // flexShrink: 0.1
        // height: 50,
        // width: 50
    },
    description: {
        flex: 0.68,
        // flexGrow: 0.7,
        color: Colors.black,
        opacity: 0.8
        // borderColor: "black",
        // borderWidth: 2
    },
    duration: {
        // alignSelf: 'stretch',
        textAlign: "right",
        flex: 0.2,
        fontSize: 16,
        alignSelf: "center",
        marginRight: 10
        // position: "absolute",
        // right: 10
    },
    deleteBtn: {
        position: "absolute",
        backgroundColor: Colors.deleteBtnRed,
        marginLeft: 20,
        right: 0,
        width: CONST_DIMENSIONS.TASK_DELETE_BTN_WIDTH,
        height: CONST_DIMENSIONS.TASK_DELETE_BTN_HEIGHT,
        justifyContent: "center",
        zIndex: 10000
    },
    deleteBtnText: {
        alignSelf: "stretch",
        textAlign: "center",
        color: "white"
    }
});
