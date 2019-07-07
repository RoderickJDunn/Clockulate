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
        backgroundColor: Colors.backgroundGrey
    },
    item: {
        height: scaleByFactor(100, 0.2)
        // padding: 10
    }
});

export const AlarmListStyle = StyleSheet.create({
    alarmRow: {
        flex: 1,
        flexDirection: "row",
        width: SCREEN_WIDTH,
        opacity: 1
        // backgroundColor: "#ecebf4"
        // backgroundColor: Colors.brandMidGrey
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
        fontSize: scaleByFactor(65, 0.2)
    },
    deleteBtn: {
        position: "absolute",
        backgroundColor: Colors.deleteBtnRed,
        right: 0,
        width: 100,
        height: scaleByFactor(100, 0.2),
        justifyContent: "center",
        // zIndex: 10000,
        padding: 5
    },
    duplicateBtn: {
        position: "absolute",
        backgroundColor: "#32a3a3",
        right: 0,
        width: 100,
        height: scaleByFactor(100, 0.2),
        justifyContent: "center",
        // zIndex: 10000,
        padding: 5
    },
    deleteBtnText: {
        alignSelf: "stretch",
        textAlign: "center",
        color: "white",
        fontFamily: "Avenir-Black",
        fontSize: scaleByFactor(15, 0.2),
        fontWeight: "600"
    }
});

export const TaskListStyle = StyleSheet.create({
    taskRow: {
        flex: 1,
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 10,
        width: SCREEN_WIDTH + 91 - scaleByFactor(20, 0.4), // 440
        height: 55,
        alignContent: "stretch",
        alignItems: "center"
        // backgroundColor: "transparent"
        // backgroundColor: "yellow"
    },
    allChildren: {
        // marginLeft: 5,
        // marginRight: 5,
        fontSize: 19,
        lineHeight: 20
        // overflow: "hidden"
    }
});

export const TaskItemStyle = StyleSheet.create({
    taskInfoWrap: {
        flexDirection: "row",
        width: SCREEN_WIDTH - scaleByFactor(20, 0.4) + 10, // SIDE_PADDING = 10 * 2.  PAD_DURATION_DELETE = 5
        height: 55,
        alignContent: "stretch",
        backgroundColor: Colors.brandMidGrey
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
        flex: 0.08,
        paddingRight: 4,
        alignSelf: "stretch",
        justifyContent: "center"
        // alignItems: "flex-start",
        // backgroundColor: "blue"
        // flexShrink: 0.1
        // height: 50,
        // width: 50
    },
    description: {
        flex: 0.68,
        // color: Colors.black,
        color: Colors.brandLightGrey,
        opacity: 0.9,
        fontFamily: "Gurmukhi MN",
        marginTop: 8
        // textAlignVertical: "center",
    },
    duration: {
        // alignSelf: 'stretch',
        textAlign: "right",
        fontSize: 16,
        alignSelf: "center"
        // marginRight: 10
        // position: "absolute",
        // right: 10
    },
    deleteBtn: {
        backgroundColor: Colors.deleteBtnRed,
        marginLeft: 20,
        width: CONST_DIMENSIONS.TASK_DELETE_BTN_WIDTH,
        height: CONST_DIMENSIONS.TASK_DELETE_BTN_HEIGHT,
        justifyContent: "center"
    },
    deleteBtnText: {
        alignSelf: "stretch",
        textAlign: "center",
        color: "white"
    }
});
