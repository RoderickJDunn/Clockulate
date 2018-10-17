import React, { Component } from "react";
import {
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    TouchableOpacity,
    Text,
    Dimensions,
    Picker,
    Animated,
    Platform
} from "react-native";
import { WheelPicker } from "react-native-wheel-picker-android";
import TouchableBackdrop from "../components/touchable-backdrop";

import Colors from "../styles/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

class PickerActionSheet extends React.Component {
    _pickerAnim = new Animated.Value(0);
    actionSheetWidth = SCREEN_WIDTH - 34;

    _pickerTransform = {
        transform: [
            {
                translateY: this._pickerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_HEIGHT * 0.63, 0]
                })
            }
        ]
    };

    constructor(props) {
        super(props);
        this.state = {
            currValues: this.props.initialValues
        };
    }

    componentDidMount() {
        Animated.timing(this._pickerAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
        }).start();
    }

    animateExit(onAnimEnded, arg) {
        Animated.timing(this._pickerAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true
        }).start(() => {
            onAnimEnded(arg);
        });
    }

    componentWillUnmount() {
        console.log("SnoozePicker: componentWillUnmount");
        Animated.timing(this._pickerAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
        }).start();
    }

    render() {
        let hasMultipleDatasets = this.props.dataSets.length > 1;
        let pickerWidth = hasMultipleDatasets
            ? this.actionSheetWidth * 0.5
            : this.actionSheetWidth;
        return (
            <View style={StyleSheet.absoluteFill}>
                <TouchableBackdrop
                    style={{
                        position: "absolute",
                        top: 0, // - (isIphoneX() ? 15 : 0),
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.4)"
                    }}
                    onPress={() => {
                        this.animateExit(this.props.onPressedCancel);
                    }}
                />
                <Animated.View
                    style={[styles.container, this._pickerTransform]}
                >
                    <View style={styles.pickerUpperWrapper}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.headerText}>
                                {this.props.title}
                            </Text>
                        </View>
                        <View style={styles.headerSeparator} />
                        <View style={styles.pickerGroup}>
                            <View
                                style={[
                                    styles.pickerWrapper,
                                    !hasMultipleDatasets
                                        ? { flex: 1 }
                                        : undefined
                                ]}
                            >
                                <View
                                    style={{
                                        position: "absolute",
                                        left: "65%",
                                        top: 0,
                                        bottom: 0,
                                        alignContent: "center",
                                        justifyContent: "center"
                                        // backgroundColor: "red"
                                    }}
                                >
                                    <Text style={{ fontSize: 18 }}>
                                        {this.props.dataLabels[0]}
                                    </Text>
                                </View>
                                {Platform.OS == "ios" ? (
                                    <Picker
                                        selectedValue={this.state.currValues[0]}
                                        style={{
                                            height: 200,
                                            width: pickerWidth
                                            // backgroundColor: "blue"
                                        }}
                                        onValueChange={(itemValue, itemIndex) =>
                                            this.setState({
                                                currValues: [
                                                    itemValue,
                                                    this.state.currValues[1]
                                                ]
                                            })
                                        }
                                        itemStyle={{ height: 200 }}
                                    >
                                        {this.props.dataSets[0].map(time => {
                                            return (
                                                <Picker.Item
                                                    key={time}
                                                    label={time.toString()}
                                                    value={time}
                                                />
                                            );
                                        })}
                                    </Picker>
                                ) : (
                                    <WheelPicker
                                        selectedItemPosition={this.props.dataSets[0].indexOf(
                                            this.state.currValues[0]
                                        )}
                                        onItemSelected={event =>
                                            this.setState({
                                                currValues: [
                                                    event.data,
                                                    this.state.currValues[1]
                                                ]
                                            })
                                        }
                                        isCurved
                                        data={this.props.dataSets[0]}
                                        style={{
                                            height: 200,
                                            width: pickerWidth
                                            // backgroundColor: "blue"
                                        }}
                                    />
                                )}
                            </View>

                            {this.props.dataLabels.length > 1 && (
                                <View
                                    style={[
                                        styles.pickerWrapper,
                                        { marginRight: 30 }
                                    ]}
                                >
                                    <View
                                        style={{
                                            position: "absolute",
                                            left: "65%",
                                            top: 0,
                                            bottom: 0,
                                            // width: "30%",
                                            alignContent: "center",
                                            justifyContent: "center"
                                            // backgroundColor: "red",
                                        }}
                                    >
                                        <Text style={{ fontSize: 18 }}>
                                            {this.props.dataLabels[1]}
                                        </Text>
                                    </View>
                                    {Platform.OS == "ios" ? (
                                        <Picker
                                            selectedValue={
                                                this.state.currValues[1]
                                            }
                                            style={{
                                                height: 200,
                                                width: pickerWidth,
                                                backgroundColor: "transparent"
                                            }}
                                            onValueChange={(
                                                itemValue,
                                                itemIndex
                                            ) =>
                                                this.setState({
                                                    currValues: [
                                                        this.state
                                                            .currValues[0],
                                                        itemValue
                                                    ]
                                                })
                                            }
                                            itemStyle={{ height: 200 }}
                                        >
                                            {this.props.dataSets[1].map(
                                                time => {
                                                    return (
                                                        <Picker.Item
                                                            key={time}
                                                            label={time.toString()}
                                                            value={time}
                                                        />
                                                    );
                                                }
                                            )}
                                        </Picker>
                                    ) : (
                                        <WheelPicker
                                            selectedItemPosition={this.props.dataSets[1].indexOf(
                                                this.state.currValues[1]
                                            )}
                                            onItemSelected={event =>
                                                this.setState({
                                                    currValues: [
                                                        this.state
                                                            .currValues[0],
                                                        event.data
                                                    ]
                                                })
                                            }
                                            isCurved
                                            data={this.props.dataSets[1]}
                                            style={{
                                                height: 200,
                                                width: pickerWidth
                                                // backgroundColor: "blue"
                                            }}
                                        />
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.actionSheetBtnRowWrap}>
                        <View style={styles.actionSheetBtnWrap}>
                            <TouchableOpacity
                                style={styles.actionSheetBtn}
                                onPress={() => {
                                    // console.log("Pressed cancel");
                                    this.animateExit(
                                        this.props.onPressedCancel
                                    );
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.actionSheetBtnWrap}>
                            <TouchableOpacity
                                style={styles.actionSheetBtn}
                                onPress={() => {
                                    // console.log("Pressed confirm");
                                    this.animateExit(
                                        this.props.onValueSelected,
                                        this.state.currValues
                                    );
                                }}
                            >
                                <Text style={styles.buttonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        top: SCREEN_HEIGHT * 0.37,
        height: SCREEN_HEIGHT * 0.6,
        width: SCREEN_WIDTH,
        minHeight: 250,
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
    pickerGroup: {
        flex: 0.8,
        borderRadius: 15,
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        backgroundColor: Colors.backgroundBright,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    pickerWrapper: {
        flex: 0.5,
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        flexDirection: "row"
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
