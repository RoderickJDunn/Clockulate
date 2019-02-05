import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback,
    Image,
    StyleSheet,
    Animated
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Interactable from "react-native-interactable";
import FAIcon from "react-native-vector-icons/FontAwesome";
import getFullImgNameForScreenSize from "../img/image_map";
import Colors from "../styles/colors";

import { scaleByFactor } from "../util/font-scale";

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
                        //TODO: Implement IAP functionality
                        // navigation.state.params.handleAddAlarm()
                        console.log("Pressed upgrade button");
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

        console.log("Upgrade -- constructor ");
    }

    _bgdPosition = new Animated.Value(0);
    _interactable = null;
    _idx = 0;

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

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

    renderUpgradePage() {
        return (
            <View style={styles.upgradePage}>
                <View
                    style={{
                        flex: 0.08,
                        alignSelf: "stretch"
                        // borderColor: "white",
                        // borderWidth: 5
                    }}
                />
                <View
                    style={{
                        flex: 0.5,
                        borderColor: "#808080",
                        borderWidth: 2
                        // alignContent: "center",
                        // justifyContent: "center"
                        // alignItems: "flex-end"
                    }}
                >
                    <Image
                        style={{
                            width: SCREEN_WIDTH * 0.7,
                            flex: 1
                        }}
                        source={require("../img/Screen_Alarms1.png")}
                    />
                </View>
                <View
                    style={{
                        flex: 0.25,
                        justifyContent: "center"
                        // backgroundColor: "green",
                    }}
                >
                    <View
                        style={{
                            flex: 0.6,
                            marginHorizontal: 9,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 35,
                            shadowOpacity: 0.9,
                            shadowRadius: 10,
                            shadowColor: "#000",
                            elevation: 5,
                            alignSelf: "center",
                            // backgroundColor: "#AAAAFF53"
                            backgroundColor: Colors.brandDarkBlue + "66"
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
            </View>
        );
    }

    render() {
        // console.log("Upgrade -- render() ");
        return (
            <View style={{ flex: 1, backgroundColor: "green" }}>
                {this.renderCalcButtons()}
                <Interactable.View
                    ref={elm => (this._interactable = elm)}
                    style={{
                        width: SCREEN_WIDTH * 5,
                        height: SCREEN_HEIGHT,
                        marginTop: -88,
                        flexDirection: "row"
                        // backgroundColor: "green"
                    }}
                    horizontalOnly={true}
                    snapPoints={[
                        { x: 0, id: "0" },
                        { x: -SCREEN_WIDTH, id: "1" },
                        { x: -SCREEN_WIDTH * 2, id: "2" },
                        { x: -SCREEN_WIDTH * 3, id: "3" },
                        { x: -SCREEN_WIDTH * 4, id: "4" }
                    ]}
                    // dragWithSpring={{ tension: 1000, damping: 0.5 }}
                    animatedNativeDriver={true}
                    animatedValueX={this._bgdPosition}
                    onDrag={event => {
                        console.log("onDrag");
                        let { state, y, targetSnapPointId } = event.nativeEvent;
                        if (state == "end") {
                            console.log("onDrag end");
                            //     this.props.onSnap(targetSnapPointId);
                            this._idx = parseInt(targetSnapPointId);
                        }
                    }}
                    initialPosition={{ x: 0 }}
                >
                    {this.renderUpgradePage()}
                    <View style={styles.upgradePage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                backgroundColor: "green"
                            }}
                        />
                    </View>
                    <View style={styles.upgradePage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                backgroundColor: "blue"
                            }}
                        />
                    </View>
                    <View style={styles.upgradePage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                backgroundColor: "yellow"
                            }}
                        />
                    </View>
                    <View style={styles.upgradePage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                backgroundColor: "purple"
                            }}
                        />
                    </View>
                </Interactable.View>
                <View
                    style={{
                        position: "absolute",
                        width: SCREEN_WIDTH,
                        marginTop: -40,
                        // height: 40,
                        // alignContent: "center",
                        alignItems: "center"
                        // justifyContent: "center",
                        // backgroundColor: "red"
                    }}
                >
                    <TouchableOpacity
                        onPress={() => console.log("pushed title")}
                    >
                        <Image
                            style={{
                                width: 300,
                                height: 100
                            }}
                            resizeMode="contain"
                            source={require("../img/UpgradeTitleV1.png")}
                        />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[
                        styles.pagerButton,
                        {
                            left: 0
                        }
                    ]}
                    onPress={() => {
                        console.log("previous");
                        this._idx--;
                        if (this._idx >= 0) {
                            this._interactable.snapTo({ index: this._idx });
                        } else {
                            this._idx = 0;
                            this._interactable.changePosition({ x: 50 });
                        }
                    }}
                >
                    <FAIcon
                        name="chevron-left"
                        size={35}
                        // color={"#AAAAFF"}
                        color={"#B5B5B533"}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.pagerButton, { right: 0 }]}
                    onPress={() => {
                        console.log("next");
                        this._idx++;
                        console.log(this._idx);
                        if (this._idx <= 4) {
                            this._interactable.snapTo({ index: this._idx });
                        } else {
                            this._idx = 4;
                            console.log(this._idx);
                            this._interactable.changePosition({
                                x: -SCREEN_WIDTH * 4 - 50,
                                y: 0
                            });
                        }
                    }}
                >
                    <FAIcon
                        name="chevron-right"
                        size={35}
                        color={"#B5B5B533"}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.upgradeButton]}
                    onPress={() => {
                        console.log("upgrade now");
                    }}
                >
                    <Text style={[styles.upgradeBtnText]}>Upgrade Now</Text>
                </TouchableOpacity>
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
    upgradePage: {
        width: SCREEN_WIDTH,
        // height: SCREEN_HEIGHT - 200 - 50, // TODO: Change 200 to factor for Title height
        alignSelf: "center",
        // alignContent: "center",
        // justifyContent: "center",
        alignItems: "center"
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
        color: Colors.brandLightOpp,
        paddingHorizontal: 10
    },
    upgradeBodyText: {
        fontFamily: "Gurmukhi MN",
        textAlign: "center",
        fontSize: 14,
        color: Colors.brandLightOpp,
        marginVertical: 2,
        paddingHorizontal: 10
    },
    upgradeButton: {
        position: "absolute",
        bottom: 50,
        padding: 10,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        width: 180,
        shadowOpacity: 0.9,
        shadowRadius: 10,
        shadowColor: "#000",
        elevation: 5,
        backgroundColor: Colors.brandLightPurple,
        borderRadius: 80
    },
    upgradeBtnText: {
        color: Colors.brandLightOpp,
        fontSize: 35,
        fontFamily: "Quesha"
    }
});
