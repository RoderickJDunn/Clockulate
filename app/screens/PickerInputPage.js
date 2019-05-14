import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback,
    TextInput,
    Picker,
    Platform,
    StyleSheet
} from "react-native";
import { WheelPicker } from "react-native-wheel-picker-android";
import _ from "lodash";

import Colors from "../styles/colors";

export default class PickerInputPage extends React.Component {
    /*
    Props: 
     */

    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.state.params.title
        };
    };

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    constructor(props) {
        super(props);
        this.state = {
            currValues: props.navigation.state.params.currValues
        };
    }
    didBlurSubscription = null;

    componentDidMount() {
        this.didBlurSubscription = this.props.navigation.addListener(
            "willBlur",
            payload => {
                console.debug("willBlur", payload);
                let { params } = this.props.navigation.state;

                params.onNavigateBack &&
                    params.onNavigateBack(this.state.currValues[0]);
            }
        );
    }

    componentWillUnmount() {
        this.didBlurSubscription.remove();
    }

    render() {
        let { params } = this.props.navigation.state;
        let hasMultipleDatasets = params.dataSets.length > 1;
        let pickerWidthL = hasMultipleDatasets
            ? this.width * 0.25
            : this.width * 0.25;
        let pickerWidthR = hasMultipleDatasets ? this.width * 0.25 : 0;

        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor:
                        Colors.backgroundGrey /* , justifyContent: "center" */
                }}
            >
                <View
                    style={{
                        marginTop: 45,
                        borderTopColor: Colors.brandLightGrey,
                        borderBottomColor: Colors.brandLightGrey,
                        borderTopWidth: 0.4,
                        borderBottomWidth: 0.4,
                        // flex: 0.,
                        justifyContent: "center",
                        backgroundColor: Colors.backgroundLightGrey
                    }}
                >
                    {/* <Text style={styles.titleText}>{params.title}</Text> */}
                    <View style={styles.pickerGroup}>
                        <View
                            style={[
                                styles.pickerWrapper,
                                !hasMultipleDatasets ? { flex: 1 } : undefined
                            ]}
                        >
                            {Platform.OS == "ios" ? (
                                <Picker
                                    selectedValue={this.state.currValues[0]}
                                    style={{
                                        height: 200,
                                        width: pickerWidthL
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
                                    {params.dataSets[0].map(time => {
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
                                    selectedItemPosition={params.dataSets[0].indexOf(
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
                                    data={params.dataSets[0]}
                                    style={{
                                        height: 200,
                                        width: pickerWidthL
                                        // backgroundColor: "blue"
                                    }}
                                />
                            )}
                            <View
                                style={{
                                    position: "absolute",
                                    height: 200,
                                    left: "65%",
                                    top: 0,
                                    bottom: 0,
                                    alignContent: "center",
                                    justifyContent: "center"
                                    // backgroundColor: "red"
                                }}
                            >
                                <Text style={{ fontSize: 18 }}>
                                    {params.dataLabels[0]}
                                </Text>
                            </View>
                        </View>

                        {params.dataLabels.length > 1 && (
                            <View style={[styles.pickerWrapper, { flex: 0.6 }]}>
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
                                        {params.dataLabels[1]}
                                    </Text>
                                </View>
                                {Platform.OS == "ios" ? (
                                    <Picker
                                        selectedValue={this.state.currValues[1]}
                                        style={{
                                            height: 200,
                                            width: pickerWidthR,
                                            backgroundColor: "transparent"
                                        }}
                                        onValueChange={(itemValue, itemIndex) =>
                                            this.setState({
                                                currValues: [
                                                    this.state.currValues[0],
                                                    itemValue
                                                ]
                                            })
                                        }
                                        itemStyle={{ height: 200 }}
                                    >
                                        {params.dataSets[1].map(time => {
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
                                        selectedItemPosition={params.dataSets[1].indexOf(
                                            this.state.currValues[1]
                                        )}
                                        onItemSelected={event =>
                                            this.setState({
                                                currValues: [
                                                    this.state.currValues[0],
                                                    event.data
                                                ]
                                            })
                                        }
                                        isCurved
                                        data={params.dataSets[1]}
                                        style={{
                                            height: 200,
                                            width: pickerWidthR
                                            // backgroundColor: "blue"
                                        }}
                                    />
                                )}
                            </View>
                        )}
                    </View>
                </View>
                <Text style={styles.descriptionText}>
                    {_.isFunction(params.description)
                        ? params.description(this.state.currValues[0])
                        : params.description}
                </Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    titleText: {
        fontSize: 18,
        paddingVertical: 25,
        alignSelf: "stretch",
        textAlign: "center"
    },
    descriptionText: {
        fontSize: 15,
        paddingHorizontal: 8,
        paddingVertical: 15,
        color: Colors.disabledGrey
    },
    pickerGroup: {
        // flex: 0.4,
        height: 200,
        borderRadius: 15,
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        // backgroundColor: Colors.backgroundBright,
        flexDirection: "row"
        // backgroundColor: "blue",
        // alignItems: "center"
        // justifyContent: "center"
    },
    pickerWrapper: {
        flex: 0.4,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row"
        // backgroundColor: Colors.backgroundBright
    },
    actionSheetBtn: {
        flex: 1,
        alignSelf: "stretch",
        alignContent: "center",
        justifyContent: "center",
        backgroundColor: Colors.backgroundBright,
        borderRadius: 15
    }
});
