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
        flexDirection: "row"
    },
    item: {
        height: 120,
        padding: 10,
        justifyContent: "center"
    }
});

export const AlarmListStyle = StyleSheet.create({
    alarmRow: {
        flex: 1,
        flexDirection: "row",
        alignContent: "stretch",
        borderBottomColor: "#FFFFFF",
        borderBottomWidth: 1,
        alignItems: "stretch"
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
