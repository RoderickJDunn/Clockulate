import React, { Component } from "react";
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    TouchableOpacity,
    Text,
    Dimensions,
    Picker
} from "react-native";
import Colors from "../styles/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const snoozeTimeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15];

class PickerActionSheet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.initialValue
        };
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.pickerUpperWrapper}>
                    <View style={styles.pickerHeader}>
                        <Text style={styles.headerText}>Snooze Time</Text>
                    </View>
                    <View style={styles.headerSeparator} />
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={10}
                            style={{
                                // flex: 0.55,
                                height: 200
                                // backgroundColor: "blue"
                                // alignContent: "center"
                            }}
                            onValueChange={(itemValue, itemIndex) =>
                                this.setState({ value: itemValue })
                            }
                            itemStyle={{ height: 200 }}
                        >
                            {snoozeTimeOptions.map(time => {
                                return (
                                    <Picker.Item
                                        key={time}
                                        label={time.toString()}
                                        value={time}
                                    />
                                );
                            })}
                        </Picker>
                        <View
                            style={{
                                position: "absolute",
                                left: "65%",
                                top: 0,
                                bottom: 0,
                                width: "35%",
                                alignContent: "center",
                                justifyContent: "center"
                                // backgroundColor: "red",
                            }}
                        >
                            <Text>Minutes</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.actionSheetBtnRowWrap}>
                    <View style={styles.actionSheetBtnWrap}>
                        <TouchableOpacity
                            style={styles.actionSheetBtn}
                            onPress={() => {
                                console.log("Pressed confirm");
                                this.props.onValueSelected(this.state.value);
                            }}
                        >
                            <Text style={styles.buttonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.actionSheetBtnWrap}>
                        <TouchableOpacity
                            style={styles.actionSheetBtn}
                            onPress={() => {
                                console.log("Pressed cancel");
                                this.props.onPressedCancel();
                            }}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        top: SCREEN_HEIGHT * 0.37,
        height: SCREEN_HEIGHT * 0.6,
        width: SCREEN_WIDTH,
        padding: 17
    },
    pickerUpperWrapper: {
        flex: 0.7,
        borderRadius: 15
        // borderWidth: 0.5
    },
    pickerHeader: {
        flex: 0.2,
        backgroundColor: Colors.backgroundBright,
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 0,
        // borderColor: "#000",
        borderRadius: 15,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0
    },
    headerSeparator: {
        alignSelf: "stretch",
        height: 0.3,
        backgroundColor: "#AAA"
    },
    pickerWrapper: {
        flex: 0.8,
        justifyContent: "center",
        borderRadius: 15,
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        backgroundColor: Colors.backgroundBright
        // backgroundColor: "blue",
    },
    actionSheetBtnRowWrap: {
        flex: 0.15,
        // backgroundColor: "red",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingTop: 7
    },
    actionSheetBtnWrap: {
        flex: 0.49,
        alignSelf: "stretch",
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: Colors.brandDarkGrey,
        // borderWidth: 0.5,
        borderRadius: 15,
        overflow: "hidden"
    },
    actionSheetBtn: {
        flex: 1,
        alignSelf: "stretch",
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: Colors.backgroundBright,
        borderRadius: 15
    },
    headerText: {
        textAlign: "center",
        color: Colors.darkGreyText,
        fontSize: 20
    },
    buttonText: {
        textAlign: "center",
        fontSize: 20,
        color: "#0000FF"
    }
});

export default PickerActionSheet;
