import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    FlatList,
    StyleSheet,
    Animated,
    SectionList,
    ScrollView
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import FAIcon from "react-native-vector-icons/FontAwesome";
import MatComIcon from "react-native-vector-icons/MaterialCommunityIcons";
// import getFullImgNameForScreenSize from "../img/image_map";
import Colors from "../styles/colors";

import { scaleByFactor } from "../util/font-scale";
// import { ScrollView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// SCREEN_HEIGHT -= 88; // add 88 since the Nav bar is transparent
// TODO: In-app purchases
export default class Upgrade extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerStyle: {
                // Style the header view itself (aka. the nav bar)
                backgroundColor: "transparent",
                borderBottomWidth: 0
            },
            headerRight: (
                <FAIcon
                    name={"magic"}
                    color={Colors.brandLightGrey}
                    underlayColor={Colors.brandDarkGrey}
                    size={24}
                    onPress={() => {
                        navigation.state.params.onPressUpgrade();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                    style={{
                        paddingLeft: 20,
                        marginRight: scaleByFactor(8, 0.9)
                    }}
                />
            )
        };
    };

    /*
    Props: 
     */
    constructor(props) {
        super(props);

        this.state = {
            upgradeData: [
                {
                    name: "0"
                },
                {
                    name: "1"
                },
                {
                    name: "2"
                },
                {
                    name: "3"
                },
                {
                    name: "4"
                }
            ]
        };
        console.log("Upgrade -- constructor ");
    }

    _bgdPosition = new Animated.Value(0);
    _interactable = null;
    _idx = 0;

    _scrollY = new Animated.Value(0);

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    componentDidMount() {
        this.props.navigation.setParams({
            onPressUpgrade: this.onPressUpgrade
        });
    }

    renderCalcButtons() {
        return (
            <LinearGradient
                start={{ x: 0.0, y: -1.0 }}
                end={{ x: 0.5, y: 3.0 }}
                locations={[0, 0.8, 1]}
                colors={["#000", "#341576", "#526FCE"]}
                style={[styles.calcBkgrdContainer]}
            >
                <View
                    style={{
                        transform: [
                            {
                                skewX: "-10deg"
                            },
                            {
                                skewY: "-10deg"
                            }
                        ]
                    }}
                >
                    <Animated.View
                        style={{
                            transform: [
                                {
                                    rotate: "20deg"
                                },
                                {
                                    translateX: this._bgdPosition.interpolate({
                                        inputRange: [0, SCREEN_WIDTH * 4],
                                        outputRange: [0, 150]
                                        // extrapolate: "clamp"
                                    })
                                }
                            ],
                            borderWidth: 30,
                            borderColor: "rgba(255,255,255,0.1)",
                            padding: 15
                        }}
                    >
                        <View style={[styles.calcBtn, styles.calcDisplay]} />
                        <View
                            style={[
                                styles.calcRow,
                                {
                                    marginBottom: 10
                                    // justifyContent: "space-around"
                                }
                            ]}
                        >
                            <View
                                style={[styles.calcBtn, styles.calcBtnSpecial]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSpecial]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSpecial]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSpecial]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    { backgroundColor: "transparent", flex: 1 }
                                ]}
                            />
                            <View
                                style={[
                                    styles.calcRow,
                                    styles.calcBtn,
                                    {
                                        margin: 0,
                                        backgroundColor: "#FFFFFF0D",
                                        paddingHorizontal: 5,
                                        alignSelf: "flex-end"
                                    }
                                ]}
                            >
                                <View
                                    style={[
                                        styles.calcBtn,
                                        styles.calcBtnSpecial,
                                        { marginHorizontal: 5 }
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.calcBtn,
                                        styles.calcBtnSpecial,
                                        { marginHorizontal: 5 }
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={[styles.calcRow]}>
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                        </View>
                        <View style={[styles.calcRow]}>
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcTopHalfBtn
                                ]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcTopHalfBtn
                                ]}
                            />
                        </View>
                        <View style={[styles.calcRow]}>
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcBottomHalfBtn
                                ]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcBottomHalfBtn
                                ]}
                            />
                        </View>
                        <View style={[styles.calcRow]}>
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcTopHalfBtn
                                ]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcTopHalfBtn
                                ]}
                            />
                        </View>
                        <View style={[styles.calcRow]}>
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcBottomHalfBtn
                                ]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcBottomHalfBtn
                                ]}
                            />
                        </View>
                        <View style={[styles.calcRow]}>
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />
                            <View
                                style={[styles.calcBtn, styles.calcBtnSquare]}
                            />

                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcLeftHalfBtn
                                ]}
                            />
                            <View
                                style={[
                                    styles.calcBtn,
                                    styles.calcBtnSquare,
                                    styles.calcRightHalfBtn
                                ]}
                            />
                        </View>
                    </Animated.View>
                </View>
            </LinearGradient>
        );
    }

    onPressUpgrade = () => {
        //TODO: Implement IAP functionality
        console.log("onPressUpgrade");
    };

    renderUpgradeItem() {
        return (
            <View style={styles.upgradeItem}>
                <View
                    style={{
                        flex: 0.25,
                        alignContent: "center",
                        alignItems: "center",
                        justifyContent: "center",
                        marginHorizontal: 3
                    }}
                >
                    <MatComIcon name="alarm-multiple" size={55} />
                </View>
                <View
                    style={{
                        flex: 0.75,
                        alignSelf: "stretch",
                        justifyContent: "center",
                        paddingVertical: 5,
                        paddingRight: 5
                    }}
                >
                    <Text style={[styles.upgradeTitleText]}>
                        Unlimited Alarms
                    </Text>
                    <Text style={[styles.upgradeBodyText]}>
                        Save a different Alarm for each day of the week
                    </Text>
                    <Text style={[styles.upgradeBodyText]}>or</Text>
                    <Text style={[styles.upgradeBodyText]}>
                        Manage multiple alarms in your own way
                    </Text>
                </View>
            </View>
        );
    }

    render() {
        console.log("Upgrade -- render() ");
        return (
            <View style={{ flex: 1, backgroundColor: "green" }}>
                {this.renderCalcButtons()}

                {/* <FlatList
                    style={{ flex: 0.8, marginTop: -180 }}
                    keyExtractor={item => item.name}
                    data={this.state.upgradeData}
                    renderItem={this.renderUpgradeItem}
                    stickyHeaderIndices={[0]}
                    ListHeaderComponent={() => (
                        <View
                            style={{
                                width: 150,
                                height: 300,
                                backgroundColor: "green"
                            }}
                        />
                    )}
                /> */}
                <Animated.SectionList
                    style={{ flex: 0.8, marginTop: -250 }}
                    onScroll={Animated.event(
                        // scrollX = e.nativeEvent.contentOffset.x
                        [
                            {
                                nativeEvent: {
                                    contentOffset: {
                                        y: this._scrollY
                                    }
                                }
                            }
                        ],
                        { useNativeDriver: true }
                    )}
                    ListFooterComponent={() => (
                        <View
                            style={{
                                height: 150,
                                flex: 0.15,
                                marginBottom: 35,
                                alignContent: "center",
                                justifyContent: "center",
                                // backgroundColor: Colors.brandLightBlue
                                // backgroundColor: "#666699"
                                backgroundColor: "transparent"
                            }}
                        >
                            <TouchableOpacity
                                style={[styles.upgradeButton]}
                                onPress={this.onPressUpgrade}
                            >
                                <Text style={[styles.upgradeBtnText]}>
                                    Upgrade Now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    renderItem={this.renderUpgradeItem}
                    renderSectionHeader={({ section: { title } }) => {
                        if (title == "Spacer") {
                            return (
                                <View
                                    style={{
                                        alignSelf: "stretch",
                                        height: 150,
                                        backgroundColor: "transparent"
                                    }}
                                />
                            );
                        } else {
                            return (
                                <TouchableOpacity
                                    style={{
                                        alignSelf: "stretch",
                                        height: 250,
                                        justifyContent: "flex-end",
                                        overflow: "hidden"
                                    }}
                                    onPress={this.onPressUpgrade}
                                >
                                    <Animated.View
                                        style={[
                                            StyleSheet.absoluteFill,
                                            {
                                                backgroundColor:
                                                    Colors.brandDarkBlue,
                                                opacity: this._scrollY.interpolate(
                                                    {
                                                        inputRange: [0, 150],
                                                        outputRange: [0, 1],
                                                        extrapolate: "clamp"
                                                    }
                                                )
                                            }
                                        ]}
                                    />
                                    {/* <LinearGradient
                                        start={{ x: 0.0, y: 0.25 }}
                                        end={{ x: 0.5, y: 1.0 }}
                                        locations={[0, 0.5, 1.4]}
                                        colors={[
                                            Colors.brandDarkGrey,
                                            Colors.brandMidLightGrey,
                                            Colors.brandDarkGrey
                                        ]}
                                        style={[
                                            StyleSheet.absoluteFill,
                                            {
                                                opacity: this._scrollY
                                            }
                                        ]}
                                    /> */}
                                    <Animated.Image
                                        style={{
                                            height: 120,
                                            width: 300,
                                            bottom: 30,
                                            alignSelf: "center",
                                            alignContent: "center",
                                            // justifyContent: "center",
                                            // backgroundColor: "red",
                                            transform: [
                                                {
                                                    translateY: this._scrollY.interpolate(
                                                        {
                                                            inputRange: [
                                                                0,
                                                                150
                                                            ],
                                                            outputRange: [
                                                                0,
                                                                70
                                                            ],
                                                            extrapolate: "clamp"
                                                        }
                                                    )
                                                },
                                                {
                                                    scale: this._scrollY.interpolate(
                                                        {
                                                            inputRange: [
                                                                0,
                                                                150
                                                            ],
                                                            outputRange: [
                                                                1,
                                                                0.7
                                                            ],
                                                            extrapolate: "clamp"
                                                        }
                                                    )
                                                }
                                            ]
                                        }}
                                        resizeMode="contain"
                                        source={require("../img/UpgradeTitleV1.png")}
                                    />
                                </TouchableOpacity>
                            );
                        }
                    }}
                    sections={[
                        { title: "Spacer", data: [] },
                        { title: "MainList", data: this.state.upgradeData }
                    ]}
                    keyExtractor={(item, index) => item + index}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    calcBkgrdContainer: {
        position: "absolute",
        top: 0,
        bottom: -150,
        left: -200,
        width: 775,
        marginTop: -88
        // backgroundColor: "red"
    },
    calcDisplay: {
        width: SCREEN_WIDTH + 300,
        height: 120,
        marginBottom: 25
    },
    calcRow: {
        flexDirection: "row"
        // backgroundColor: "red"
    },
    calcBtn: {
        borderRadius: 15,
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        margin: 10
    },
    calcBtnSquare: {
        width: 90,
        height: 90
    },
    calcBtnSpecial: {
        width: 75,
        height: 40,
        marginHorizontal: 8
    },
    calcBtnRect: {
        width: 80,
        height: 60
    },
    calcTopHalfBtn: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        marginBottom: 0,
        paddingBottom: 0,
        height: 100
    },
    calcBottomHalfBtn: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        marginTop: 0,
        paddingTop: 0,
        height: 100
    },
    calcRightHalfBtn: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        marginLeft: 0,
        width: 100
    },
    calcLeftHalfBtn: {
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
        marginRight: 0,
        width: 100
    },
    upgradeItem: {
        height: 140,
        marginVertical: 10,
        marginHorizontal: 10,
        flexDirection: "row",
        // height: SCREEN_HEIGHT - 200 - 50, // TODO: Change 200 to factor for Title height
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 35,
        shadowOpacity: 0.9,
        shadowRadius: 10,
        shadowColor: "#000",
        elevation: 5,
        backgroundColor: "#30166a"
        // backgroundColor: Colors.brandLightBlue + "66"
        // alignContent: "center",
        // justifyContent: "center",
        // alignItems: "center",
        // marginTop: -88,
        // backgroundColor: "yellow"
    },
    pagerButton: {
        margin: 10,
        position: "absolute",
        bottom: SCREEN_HEIGHT * 0.45,
        transform: [
            {
                scaleY: 1.5
            },
            {
                scaleX: 0.7
            }
        ]
    },
    upgradeTitleText: {
        fontFamily: "Quesha",
        fontSize: 30,
        color: Colors.brandLightOpp
    },
    upgradeBodyText: {
        fontFamily: "Gurmukhi MN",
        // textAlign: "center",
        fontSize: 14,
        color: Colors.brandLightOpp,
        marginVertical: 2
    },
    upgradeButton: {
        // bottom: 50,
        padding: 10,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        width: 180,
        height: 70,
        shadowOpacity: 0.1,
        shadowRadius: 40,
        shadowColor: "#FFF",
        elevation: 5,
        backgroundColor: Colors.brandDarkBlue,
        // backgroundColor: Colors.brandMidPurple,
        // backgroundColor: Colors.brandLightOpp,
        borderRadius: 80
    },
    upgradeBtnText: {
        color: Colors.brandLightOpp,
        fontSize: 35,
        fontFamily: "Quesha"
    }
});
