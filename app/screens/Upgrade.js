import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    Animated,
    StatusBar,
    Platform,
    Easing,
    FlatList,
    Button,
    ActivityIndicator
} from "react-native";
import * as RNIap from "react-native-iap";
import LinearGradient from "react-native-linear-gradient";
import FAIcon from "react-native-vector-icons/FontAwesome";
import MatComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import EntypoIcon from "react-native-vector-icons/Entypo";
import EvilIcon from "react-native-vector-icons/EvilIcons";
import { isIphoneX } from "react-native-iphone-x-helper";
import { NavigationEvents } from "react-navigation";

// import getFullImgNameForScreenSize from "../img/image_map";
import Colors from "../styles/colors";
import upgrades from "../config/upgrades";
import { scaleByFactor } from "../util/font-scale";
// import { ScrollView } from "react-native-gesture-handler";

const PRODUCTS = Platform.select({
    ios: ["ClockulateProMain"],
    android: ["ClockulateProMain"]
});

let AnimLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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

export default class Upgrade extends React.Component {
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
                "Add as many tasks as you like to each alarm.  Your morning planning can be as detailed as you want!"
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
        console.log("props", props);

        this.state = {
            isLoading: false
        };

        this._isModal = this.props.screenType == "modal";
    }

    _bgdPosition = new Animated.Value(0);
    _interactable = null;
    _idx = 0;
    _btnShineAnim = new Animated.Value(-1000);
    _isModal = null;

    _scrollY = new Animated.Value(0);

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    async componentDidMount() {
        console.log("Upgrade: ComponentDidMount");

        this.props.navigation.setParams({
            onPressRestore: this.onPressRstrPurchase
        });
        try {
            const products = await RNIap.getProducts(PRODUCTS);
            console.log("products", products);
            this.setState({ products });
        } catch (err) {
            console.warn(err); // standardized err.code and err.message available
        }
    }

    componentWillUnmount() {
        RNIap.endConnection();
    }

    screenDidFocus = payload => {
        console.log("screenDidFocus");
        if (upgrades.pro != true) {
            console.log("upgrades.pro ", upgrades.pro);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(this._btnShineAnim, {
                        toValue: 1000,
                        duration: 7000,
                        isInteraction: false,
                        easing: Easing.inOut(Easing.quad),
                        useNativeDriver: true
                    }),
                    Animated.timing(this._btnShineAnim, {
                        toValue: -1000,
                        duration: 0,
                        isInteraction: false,
                        useNativeDriver: true
                    })
                ])
            ).start();
        }
        this.props.navigation.setParams();
    };

    screenWillBlur = payload => {
        this._btnShineAnim.stopAnimation();
    };

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
                style={[
                    styles.calcBkgrdContainer,
                    {
                        overflow: "hidden"
                    }
                ]}
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

    onPressUpgrade = async () => {
        // IAP functionality
        console.log("onPressUpgrade");

        // upgrades.setPro(true);
        // return;

        this.setState({ isLoading: true });
        await RNIap.clearTransaction();

        try {
            try {
                products = await RNIap.getProducts(PRODUCTS);
                console.log("products", products);
                this.setState({ products });
            } catch (err) {
                console.warn(
                    "Failed to get products.. no network connection? : ",
                    err
                ); // standardized err.code and err.message available
                this.setState({ isLoading: false });
                alert(
                    "Unable to connect to App Store. Please make sure you have a Wi-Fi or Data connection."
                );
                return;
            }

            // Will return a purchase object with a receipt which can be used to validate on your server.
            const purchase = await RNIap.buyProduct(products[0].productId);
            upgrades.setPro(true);
            this.setState({
                receipt: purchase.transactionReceipt, // save the receipt if you need it, whether locally, or to your server.
                isLoading: false
            });
            this.props.navigation.setParams();
        } catch (err) {
            // standardized err.code and err.message available
            console.warn("Caught error trying RNIap.buyProduct:");
            console.warn(err.code, err.message);
            this.setState({ isLoading: false });
            const subscription = RNIap.addAdditionalSuccessPurchaseListenerIOS(
                async purchase => {
                    subscription.remove();
                    upgrades.setPro(true);
                    this.setState({
                        receipt: purchase.transactionReceipt,
                        isLoading: false
                    });
                    this.props.navigation.setParams();
                }
            );
        }

        /* DEV: Simulates user buying the IAP */
        // upgrades.setPro(true);
        // this.props.navigation.setParams();
        /* END-DEV */

        /* ************************************ */
    };

    onPressRstrPurchase = async () => {
        //TODO: Implement IAP functionality. NEEDS TESTING WITH SANDBOX
        console.log("onPressRstrPurchase");
        this.setState({ isLoading: true });

        try {
            let purchases = await RNIap.getAvailablePurchases();
            this.setState({ isLoading: false });

            if (purchases.length == 0) {
                // User has not made any purchases that we know of.
                alert("No previous purchase found...");
            } else {
                upgrades.setPro(true);
                alert("Purchases succesfully restored!");
                console.log(purchases);
                this.props.navigation.setParams();
            }
        } catch (err) {
            alert(
                "Unable to connect to App Store. Please make sure you have a Wi-Fi or Data connection."
            );
            this.setState({ isLoading: false });
        }
    };

    upgradeItem({ item }) {
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

        let buttonContainerHeight;
        if (upgrades.pro != true) {
            buttonContainerHeight = scaleByFactor(110) + (isIphoneX() ? 10 : 0);
        } else {
            buttonContainerHeight = scaleByFactor(80) + (isIphoneX() ? 10 : 0);
        }

        let { products } = this.state;

        let validProduct = products && products.length == 1;

        return (
            <View
                style={{ flex: 1, backgroundColor: Colors.brandMidLightGrey }}
            >
                <NavigationEvents
                    onWillFocus={this.screenDidFocus}
                    onWillBlur={this.screenWillBlur}
                />
                {this.renderCalcButtons()}
                <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
                    <Animated.Image
                        style={{
                            height: SCREEN_WIDTH * 0.832,
                            width: SCREEN_WIDTH,
                            alignSelf: "center",
                            alignContent: "center",
                            transform: [
                                {
                                    translateY: this._scrollY.interpolate({
                                        inputRange: [
                                            0,
                                            120 * 6 + SCREEN_HEIGHT
                                            // SCREEN_HEIGHT * 1
                                            // SCREEN_HEIGHT * 1.5
                                        ],
                                        outputRange: [
                                            SCREEN_HEIGHT,
                                            -(SCREEN_WIDTH * 0.416)
                                        ],
                                        extrapolate: "clamp"
                                    })
                                }
                            ]
                        }}
                        resizeMode="contain"
                        source={{ uri: "UpgradeScreen_logo_v2" }}
                    />
                    <View
                        style={{
                            height: this._isModal ? 30 : 0,
                            backgroundColor: "transparent"
                        }}
                    />
                </View>
                <Animated.FlatList
                    scrollEventThrottle={10}
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
                    style={{
                        flex: 1
                        // marginTop: -FULL_HEADER_HEIGHT
                        // marginTop: -SCREEN_HEIGHT * 0.35 - FULL_HEADER_HEIGHT
                    }}
                    ListFooterComponent={
                        <View
                            style={{
                                height: SCREEN_HEIGHT,
                                width: SCREEN_WIDTH
                            }}
                        >
                            <View
                                style={{
                                    height: this._isModal ? 30 : 0,
                                    backgroundColor: "transparent"
                                }}
                            />
                        </View>
                    }
                    ListHeaderComponent={
                        this._isModal ? (
                            <View
                                style={{
                                    height: isIphoneX() ? 88 : 64,
                                    // backgroundColor: "blue",
                                    flexDirection: "row",
                                    alignItems: "flex-end",
                                    justifyContent: "space-between"
                                }}
                            >
                                <View
                                    style={[
                                        StyleSheet.absoluteFill,
                                        { justifyContent: "flex-end" }
                                    ]}
                                >
                                    <Text
                                        style={{
                                            padding: 10,
                                            color: Colors.brandLightOpp,
                                            fontSize: scaleByFactor(14),
                                            alignSelf: "center",
                                            textAlign: "right"
                                        }}
                                    >
                                        Pro Features
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        console.log("Going back hopefully");
                                        this.props.navigation.goBack(null);
                                    }}
                                    style={{
                                        padding: 10
                                    }}
                                >
                                    <EvilIcon
                                        name="close"
                                        style={{
                                            color: Colors.brandLightGrey,
                                            fontSize: scaleByFactor(20)
                                        }}
                                    />
                                </TouchableOpacity>
                                {upgrades.pro != true && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.onPressRstrPurchase();
                                        }}
                                        hitSlop={{
                                            top: 10,
                                            bottom: 10,
                                            left: 20,
                                            right: 0
                                        }}
                                        style={{
                                            // alignSelf: "flex-end",
                                            // paddingLeft: 20,
                                            padding: 10
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: Colors.brandLightGrey,
                                                fontSize: scaleByFactor(13),
                                                textAlign: "right"
                                            }}
                                        >
                                            Restore
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : null
                    }
                    renderItem={this.upgradeItem}
                    data={this.upgradeData}
                />

                {/* <View
                    style={{
                        width: SCREEN_WIDTH,
                        height: 100,
                        paddingHorizontal: 10,
                        paddingBottom: isIphoneX() ? 20 : 0,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTopWidth: 3,
                        borderTopColor: Colors.brandDarkGrey,
                        backgroundColor: Colors.brandLightOpp
                    }}
                >
                    <Text
                        style={{
                            color: Colors.darkGreyText,
                            fontFamily: "Gurmukhi MN",
                            marginTop: 8,
                            fontSize: 22
                        }}
                    >
                        Clockulate Version
                    </Text>
                    <Text
                        style={{
                            color: Colors.labelText,
                            fontFamily: "Gurmukhi MN",
                            marginTop: 8,
                            fontSize: 22
                        }}
                    >
                        {upgrades.pro == true ? "PRO" : "FREE"}
                    </Text>
                </View> */}
                <View
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: SCREEN_WIDTH,
                        height: buttonContainerHeight,
                        alignContent: "center",
                        justifyContent: "center",
                        shadowOpacity: 0.9,
                        shadowRadius: 5,
                        shadowColor: "#AAA",
                        elevation: 5
                        // borderTopWidth: 1,
                        // borderTopColor: Colors.backgroundLightGrey,
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            // marginBottom: 35,
                            alignContent: "center",
                            justifyContent: "center",
                            borderTopLeftRadius: 170,
                            borderTopRightRadius: 170,
                            overflow: "hidden"
                            // backgroundColor: "#666699"
                            // backgroundColor: "transparent"
                        }}
                    >
                        <LinearGradient
                            start={{ x: 0.0, y: 0 }}
                            end={{ x: 0.5, y: 1.0 }}
                            locations={[0, 0.9]}
                            colors={[Colors.brandLightOpp, Colors.brandMidOpp]}
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    alignSelf: "center",
                                    alignContent: "center",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }
                            ]}
                        />
                        {upgrades.pro != true ? (
                            <View>
                                <TouchableOpacity
                                    style={[styles.upgradeButton]}
                                    onPress={this.onPressUpgrade}
                                >
                                    <AnimLinearGradient
                                        start={{ x: 0.0, y: 0.25 }}
                                        end={{ x: 1, y: 0.28 }}
                                        locations={[0.1, 0.4, 0.5, 0.6, 0.9]}
                                        colors={[
                                            Colors.brandDarkBlue,
                                            Colors.brandLightBlue,
                                            Colors.brandVeryLightBlue,
                                            Colors.brandLightBlue,
                                            Colors.brandDarkBlue
                                        ]}
                                        style={[
                                            styles.animLinearGrad,
                                            {
                                                transform: [
                                                    {
                                                        translateX: this
                                                            ._btnShineAnim
                                                    }
                                                ]
                                            }
                                        ]}
                                    />

                                    <Text style={[styles.upgradeBtnText]}>
                                        Upgrade Now
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[styles.butnExplainText]}>
                                    {validProduct
                                        ? `One-time purchase of ${
                                              products[0].localizedPrice
                                          }`
                                        : ""}
                                </Text>
                            </View>
                        ) : (
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center"
                                }}
                            >
                                <Text
                                    style={[
                                        styles.butnExplainText,
                                        {
                                            fontSize: scaleByFactor(22),
                                            marginHorizontal: 15,
                                            marginTop: 0
                                        }
                                    ]}
                                >
                                    Purchased
                                </Text>
                                <FAIcon
                                    name="check"
                                    size={scaleByFactor(24)}
                                    color="green"
                                />
                            </View>
                        )}
                    </View>
                </View>
                {this.state.isLoading && (
                    <View style={styles.actIndWrapper}>
                        <ActivityIndicator
                            size="large"
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    calcBkgrdContainer: {
        position: "absolute",
        // top: 0,
        // bottom: -150,
        // left: -200,
        width: 775,
        // marginTop: -88
        top: 0,
        bottom: 0,
        left: -200,
        right: 0
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
        height: 120,
        marginVertical: 15,
        marginHorizontal: 10,
        flexDirection: "row",
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
        fontSize: scaleByFactor(22, 0.8),
        letterSpacing: 1,
        color: Colors.brandLightOpp
        // flex: 0.2
    },
    upgradeBodyText: {
        fontFamily: "Gurmukhi MN",
        letterSpacing: 0.5,

        // textAlign: "center",
        fontSize: scaleByFactor(13, 0.8),
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
        width: scaleByFactor(160),
        height: scaleByFactor(50),
        shadowOpacity: 0.7,
        shadowRadius: 40,
        shadowColor: "#FFF",
        elevation: 5,
        backgroundColor: Colors.brandDarkBlue,
        // backgroundColor: Colors.brandLightOpp,
        borderRadius: 30,
        overflow: "hidden"
    },
    upgradeBtnText: {
        color: Colors.brandLightOpp,
        fontSize: scaleByFactor(27),
        fontFamily: "Quesha",
        letterSpacing: 1
    },
    butnExplainText: {
        color: Colors.darkGreyText,
        marginTop: 8,
        marginBottom: -8,
        fontSize: scaleByFactor(13),
        fontFamily: "Gurmukhi MN",
        alignSelf: "center",
        letterSpacing: 0.5
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
    },
    animLinearGrad: {
        position: "absolute",
        left: -800,
        right: 800,
        top: 0,
        bottom: 0,
        // top: 0,
        width: 1600
        // height: 120
    },
    actIndWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000AA"
    }
});
