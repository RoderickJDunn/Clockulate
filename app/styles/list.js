/**
 * Created by rdunn on 2017-08-23.
 */

"use strict";

import { StyleSheet } from "react-native";
import Colors from "./colors";
export const ListStyle = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundGrey,
        flexDirection: "row",
        zIndex: 50
    },
    item: {
        height: 120,
        padding: 10
    }
});

export const AlarmListStyle = StyleSheet.create({
    alarmRow: {
        flex: 1,
        flexDirection: "row",
        borderBottomColor: "#FFFFFF",
        borderBottomWidth: 1,
        width: 480
    },
    toggleButton: {
        flex: 2
    },
    infoContainer: {
        flex: 8,
        justifyContent: "space-between"
    },
    timeText: {
        fontSize: 55
    },
    deleteBtn: {
        position: "absolute",
        backgroundColor: Colors.deleteBtnRed,
        right: 0,
        width: 100,
        height: 120,
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
    item: {
        flex: 1,
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: 10,
        height: 55,
        alignContent: "stretch",
        borderBottomColor: "#acacac",
        borderBottomWidth: 1,
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
    }
});
