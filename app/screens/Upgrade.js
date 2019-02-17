import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Animated,
    StatusBar,
    Platform
} from "react-native";
import * as RNIap from "react-native-iap";
import LinearGradient from "react-native-linear-gradient";
import FAIcon from "react-native-vector-icons/FontAwesome";
import MatComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import EntypoIcon from "react-native-vector-icons/Entypo";
import { isIphoneX } from "react-native-iphone-x-helper";

// import getFullImgNameForScreenSize from "../img/image_map";
import Colors from "../styles/colors";
import upgrades from "../config/upgrades";
import { scaleByFactor } from "../util/font-scale";
// import { ScrollView } from "react-native-gesture-handler";

const PRODUCTS = Platform.select({
    ios: ["ClockulateProMain"],
    android: ["ClockulateProMain"]
});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/* The height of the Navigation Bar + Status Bar 
    The notched devices have a taller status bar (44pt vs. 20pt)
    The height of the navigation bar in both cases is 44.
*/
let STATUS_BAR_HEIGHT;
if (Platform.OS == "ios") {
    STATUS_BAR_HEIGHT = isIphoneX() ? 44 : 20;
} else {
    STATUS_BAR_HEIGHT = StatusBar.currentHeight;
}

const FULL_HEADER_HEIGHT = 44 + STATUS_BAR_HEIGHT;

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

    upgradeData = [
        {
            key: "0",
            icon: (
                <MatComIcon
                    name="cancel"
                    size={55}
                    color={Colors.brandSuperLightPurple}
                    style={{ height: 55 - 1 }}
                />
            ),
            title: "No Ads",
            description: ["Say goodbye to in-app ads, once and for all"]
        },
        {
            key: "1",
            icon: (
                <MatComIcon
                    name="alarm-multiple"
                    size={55}
                    color={Colors.brandSuperLightPurple}
                    style={{ height: 55 - 1 }}
                />
            ),
            title: "Unlimited Alarms",
            description: [
                "With unlimited alarms,  you are free to save alarms for each day of the week,  or any other way you like"
            ]
        },
        {
            key: "2",
            icon: (
                <FAIcon
                    name="list"
                    size={42}
                    color={Colors.brandSuperLightPurple}
                    style={{ height: 42 - 5 }}
                />
            ),
            title: "Unlimited Tasks",
            description: [
                "Add as many tasks as you like to each alarm.  With this feature your morning planning can be as detailed as you want!"
            ]
        },
        {
            key: "3",
            icon: (
                <MatComIcon
                    name="timetable"
                    size={55}
                    color={Colors.brandSuperLightPurple}
                    style={{ height: 55 - 4 }}
                />
            ),
            title: "Task Start-Times",
            description: [
                "See what time each of your tasks starts.  Simply toggle between task durations,  and task start-times"
            ]
        },
        {
            key: "4",
            icon: (
                <FAIcon
                    name="music"
                    size={42}
                    color={Colors.brandSuperLightPurple}
                    style={{ height: 42 - 1 }}
                />
            ),
            title: "More Alarm Tones",
            description: [
                "Unlock additional sounds to use with your alarms,  and receive more with each update!"
            ]
        },
        {
            key: "5",
            icon: (
                <EntypoIcon
                    name="download"
                    size={42}
                    color={Colors.brandSuperLightPurple}
                    style={{ height: 42 - 1 }}
                />
            ),
            title: "Future Pro Features",
            description: [
                "Clockulate will be receiving more Pro features soon,  all of which are included with this purchase!"
            ]
        }
    ];

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

    _scrollY = new Animated.Value(0);

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    async componentDidMount() {
        console.log("Upgrade: ComponentDidMount");
        try {
            const products = await RNIap.getProducts(PRODUCTS);
            console.log("products", products);
            // this.setState({ products });
        } catch (err) {
            console.warn(err); // standardized err.code and err.message available
        }

        this.props.navigation.setParams({
            onPressUpgrade: this.onPressUpgrade
        });
    }

    /* ********************** */
    /* @Roderick. The following  explanation and function getHeaderInset() 
        is copied from a react-navigation example. It demonstrates how to
        compensate for header height when the Header is transparent, 
        on both Platforms. Not using this yet because what I currently
        have is working fine for iOS. But I may need to use this logic
        when I add Android support. 
    ------------------------------------------------------
    // Inset to compensate for navigation bar being transparent.
    // And improved abstraction for this will be built in to react-navigation
    // at some point.
    getHeaderInset() {
        const NOTCH_HEIGHT = isIphoneX() ? 25 : 0;

        // $FlowIgnore: we will remove the HEIGHT static soon enough
        const BASE_HEADER_HEIGHT = Header.HEIGHT;

        const HEADER_HEIGHT =
        Platform.OS === 'ios'
            ? BASE_HEADER_HEIGHT + NOTCH_HEIGHT
            : BASE_HEADER_HEIGHT + Constants.statusBarHeight;

        return Platform.select({
        ios: {
            contentInset: { top: HEADER_HEIGHT },
            contentOffset: { y: -HEADER_HEIGHT },
        },
        android: {
            contentContainerStyle: {
            paddingTop: HEADER_HEIGHT,
            },
        },
        });
    }
    ------------------------------------------------------
    */

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

        /* TEST: Simulating user buying the IAP */
        upgrades.setPro(true);
        /* ************************************ */
    };

    onPressRstrPurchase = () => {
        //TODO: Implement IAP functionality
        console.log("onPressRstrPurchase");
    };

    UpgradeItem({ item }) {
        return (
            <View style={styles.upgradeItem}>
                <View
                    style={{
                        flex: 0.25,
                        alignContent: "center",
                        alignItems: "center",
                        justifyContent: "center",
                        marginHorizontal: 3
                        // backgroundColor: "red"
                    }}
                >
                    {item.icon}
                </View>
                <View
                    style={{
                        flex: 0.75,
                        alignSelf: "stretch",
                        justifyContent: "center",
                        paddingVertical: 5,
                        paddingRight: 12
                    }}
                >
                    <Text style={[styles.upgradeTitleText]}>{item.title}</Text>
                    {item.description.length > 0 && (
                        <View
                            style={{
                                // flex: 0.8,
                                alignContent: "center",
                                justifyContent: "center"
                            }}
                        >
                            {item.description.map((text, i) => {
                                return (
                                    <Text
                                        key={i}
                                        style={[styles.upgradeBodyText]}
                                    >
                                        {text}
                                    </Text>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        );
    }

    render() {
        console.log("Upgrade -- render() ");

        return (
            <View style={{ flex: 1, backgroundColor: "green" }}>
                {this.renderCalcButtons()}
                <Animated.SectionList
                    style={{
                        flex: 0.8,
                        marginTop: -SCREEN_HEIGHT * 0.35 - FULL_HEADER_HEIGHT
                    }}
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
                                height: 175,
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
                            <TouchableOpacity
                                style={[styles.rstrPurchaseBtn]}
                                onPress={this.onPressRstrPurchase}
                            >
                                <Text style={[styles.rstrPurchaseText]}>
                                    Already purchased? Tap to Restore Purchase
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    renderItem={this.UpgradeItem}
                    renderSectionHeader={({ section: { title } }) => {
                        if (title == "Spacer") {
                            return (
                                <View
                                    style={{
                                        alignSelf: "stretch",
                                        height: SCREEN_HEIGHT * 0.35,
                                        backgroundColor: "transparent"
                                    }}
                                />
                            );
                        } else {
                            return (
                                <TouchableOpacity
                                    style={{
                                        alignSelf: "stretch",
                                        height:
                                            SCREEN_HEIGHT * 0.35 +
                                            FULL_HEADER_HEIGHT,
                                        justifyContent: "center",
                                        overflow: "hidden"
                                        // backgroundColor: "green"
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
                                                        inputRange: [
                                                            0,
                                                            SCREEN_HEIGHT * 0.1,
                                                            SCREEN_HEIGHT * 0.2,
                                                            SCREEN_HEIGHT * 0.3,
                                                            SCREEN_HEIGHT * 0.35
                                                        ],
                                                        outputRange: [
                                                            0,
                                                            0.05,
                                                            0.1,
                                                            0.5,
                                                            1
                                                        ],
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
                                            height: 180,
                                            width: SCREEN_WIDTH * 0.75,
                                            // top: 30,
                                            top: "10%",
                                            alignSelf: "center",
                                            alignContent: "center",
                                            // justifyContent: "center",
                                            // backgroundColor: "red",
                                            transform: [
                                                {
                                                    translateY: this._scrollY.interpolate(
                                                        {
                                                            inputRange: [
                                                                -150,
                                                                0,
                                                                SCREEN_HEIGHT *
                                                                    0.35
                                                            ],
                                                            outputRange: [
                                                                0,
                                                                0,
                                                                SCREEN_HEIGHT *
                                                                    0.155
                                                            ],
                                                            extrapolate: "clamp"
                                                        }
                                                    )
                                                },
                                                {
                                                    scale: this._scrollY.interpolate(
                                                        {
                                                            inputRange: [
                                                                -150,
                                                                0,
                                                                SCREEN_HEIGHT *
                                                                    0.35
                                                            ],
                                                            outputRange: [
                                                                1.2,
                                                                1,
                                                                0.6
                                                            ],
                                                            extrapolate: "clamp"
                                                        }
                                                    )
                                                }
                                            ]
                                        }}
                                        resizeMode="contain"
                                        source={require("../img/UpgradeTitleV1_3.png")}
                                    />
                                </TouchableOpacity>
                            );
                        }
                    }}
                    sections={[
                        { title: "Spacer", data: [] },
                        { title: "MainList", data: this.upgradeData }
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
        height: 170,
        marginVertical: 15,
        marginHorizontal: 10,
        flexDirection: "row",
        // height: SCREEN_HEIGHT - 200 - 50, // TODO: Change 200 to factor for Title height
        alignSelf: "stretch",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 35,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowColor: "#000",
        elevation: 5,
        backgroundColor: "#20114F"
        // backgroundColor: "#30166a"
        // backgroundColor: Colors.brandLightBlue + "66"
        // alignContent: "center",
        // justifyContent: "center",
        // alignItems: "center",
        // marginTop: -88,
        // backgroundColor: "yellow"
    },
    upgradeTitleText: {
        fontFamily: "Quesha",
        fontSize: scaleByFactor(31, 0.8),
        letterSpacing: 1,
        color: Colors.brandLightOpp
        // flex: 0.2
    },
    upgradeBodyText: {
        fontFamily: "Gurmukhi MN",
        letterSpacing: 0.5,

        // textAlign: "center",
        fontSize: scaleByFactor(15, 0.8),
        color: Colors.brandLightOpp,
        marginVertical: 2
    },
    upgradeButton: {
        // bottom: 50,
        // paddingVertical: 10,
        // paddingHorizontal: 15,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        width: 220,
        height: 80,
        shadowOpacity: 0.1,
        shadowRadius: 40,
        shadowColor: "#FFF",
        elevation: 5,
        backgroundColor: Colors.brandDarkBlue,
        borderRadius: 80
    },
    upgradeBtnText: {
        color: Colors.brandLightOpp,
        fontSize: 35,
        fontFamily: "Quesha",
        letterSpacing: 1
    },
    rstrPurchaseBtn: {
        marginTop: 30
    },
    rstrPurchaseText: {
        color: Colors.brandLightOpp,
        textDecorationLine: "underline",
        fontSize: 14,
        textAlign: "center",
        fontFamily: "Avenir-Black",
        letterSpacing: 1
    }
});
