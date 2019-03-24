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
    Animated,
    LayoutAnimation,
    ScrollView
} from "react-native";
import { Header } from "react-navigation";
import LinearGradient from "react-native-linear-gradient";
import Interactable from "react-native-interactable";
import FAIcon from "react-native-vector-icons/FontAwesome";
import AutoHeightImage from "react-native-auto-height-image";
import * as Animatable from "react-native-animatable";

import getFullImgNameForScreenSize from "../img/image_map";
import Colors from "../styles/colors";
import ClkAlert from "../components/clk-awesome-alert";
import IntrvHelpPage from "../components/intrv-help-page";

import { scaleByFactor } from "../util/font-scale";
import { isIphoneX } from "react-native-iphone-x-helper";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_HEIGHT = Header.HEIGHT; // + STATUS_BAR_HEIGHT;

const HELPPAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;

const HELP_SECTIONS = [
    {
        name: "Alarms (Filler)",
        images: [
            {
                path: require("../img/help/Screen_Alarms1.png"),
                style: { paddingVertical: 10 }
            }
        ],
        snapOffsets: []
    },
    {
        name: "Alarms List",
        images: [
            {
                path: require("../img/help/AlarmItem_test5_step1.png"),
                style: { marginBottom: 5 },
                sharePageWithNext: 1
            },
            {
                path: require("../img/help/AlarmItem_test5_step2.png"),
                style: { paddingBottom: 0 },
                sharedWithPrev: true
            },
            {
                path: require("../img/help/AlarmItem_test5_step3.png"),
                style: null
            },
            {
                path: require("../img/help/AlarmItem_final_step4.png"),
                style: null
            }
        ],
        snapOffsets: [SCREEN_HEIGHT * 0.6, SCREEN_HEIGHT]
    },
    {
        name: "Edit Alarm",
        subtitle: "How it Works", // "Overview",
        images: [
            {
                path: require("../img/help/AlarmDetail_test3_step1.png"),
                style: { paddingVertical: SCREEN_HEIGHT * 0.05 }
            },
            {
                path: require("../img/help/AlarmDetail_final_step2.png"),
                style: null
            },
            {
                path: require("../img/help/AlarmDetail_test3_step3.png"),
                style: null
            },
            {
                path: require("../img/help/AlarmDetail_final_step4.png"),
                style: {
                    paddingTop: SCREEN_HEIGHT * 0.08,
                    paddingBottom: SCREEN_HEIGHT * 0.03
                }
            }
        ],
        snapOffsets: []
    },
    {
        name: "Edit Alarm",
        subtitle: "Tasks",
        images: [
            {
                path: require("../img/help/ADTasks_final_step1.png"),
                style: null
            },
            {
                path: require("../img/help/ADTasks_final_step2.png"),
                style: null
            },
            {
                path: require("../img/help/ADTasks_final_step3.png"),
                style: null
            },
            {
                path: require("../img/help/ADTasks_final_step4.png"),
                style: null
            }
        ]
    },
    {
        name: "Edit Alarm",
        subtitle: "Modes",
        images: [
            {
                path: require("../img/help/ADModes_final_step1.png"),
                style: { paddingVertical: SCREEN_HEIGHT * 0.14 }
            },
            {
                path: require("../img/help/ADModes_final_step2.png"),
                style: { paddingVertical: SCREEN_HEIGHT * 0.28 }
            }
        ]
    }
];

// SCREEN_HEIGHT -= 88; // add 88 since the Nav bar is transparent
// TODO: In-app purchases
export default class Help extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerStyle: {
                // Style the header view itself (aka. the nav bar)
                backgroundColor: Colors.brandDarkGrey,
                borderBottomWidth: 0
            },
            headerRight: (
                <FAIcon
                    name={"info"}
                    color={Colors.brandLightGrey}
                    underlayColor={Colors.brandDarkGrey}
                    size={24}
                    onPress={() => {
                        // ClKAlert -- how to use Help
                        navigation.state.params.toggleInfoPopup();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                    style={{
                        paddingLeft: 20,
                        marginRight: scaleByFactor(12, 0.9)
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
            imgHeight: 135,
            sectIdx: 0,
            showInfoPopup: true
        };

        console.log("Upgrade -- constructor ");
    }

    _bgdPosition = new Animated.Value(0);
    _interactable = null;
    _idx = 0;

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    componentDidMount() {
        this.props.navigation.setParams({
            toggleInfoPopup: this.toggleInfoPopup
        });
    }

    toggleInfoPopup = () => {
        let { showInfoPopup } = this.state;
        this.setState({ showInfoPopup: !showInfoPopup });
    };

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

    goToNextSect = () => {
        console.log("next section");
        this._idx++;
        console.log(this._idx);
        if (this._idx <= 4) {
            this._interactable.snapTo({
                index: this._idx
            });
            this.setState({
                sectIdx: this._idx
            });
        } else {
            this._idx = 4;
            console.log(this._idx);
            this._interactable.changePosition({
                x: -SCREEN_WIDTH * 4 - 50,
                y: 0
            });
        }
    };

    // renderHelpPage() {
    //     return (
    //         <View style={styles.helpPage}>
    //             <View
    //                 style={{
    //                     flex: 0.08,
    //                     alignSelf: "stretch"
    //                     // borderColor: "white",
    //                     // borderWidth: 5
    //                 }}
    //             />
    //             <View
    //                 style={{
    //                     flex: 0.5,
    //                     borderColor: "#808080",
    //                     borderWidth: 2
    //                     // alignContent: "center",
    //                     // justifyContent: "center"
    //                     // alignItems: "flex-end"
    //                 }}
    //             >
    //                 <Image
    //                     style={{
    //                         width: SCREEN_WIDTH * 0.7,
    //                         flex: 1
    //                     }}
    //                     source={require("../img/help/Screen_Alarms1.png")}
    //                 />
    //             </View>
    //             <View
    //                 style={{
    //                     flex: 0.25,
    //                     justifyContent: "center"
    //                     // backgroundColor: "green",
    //                 }}
    //             >
    //                 <View
    //                     style={{
    //                         flex: 0.6,
    //                         marginHorizontal: 9,
    //                         alignItems: "center",
    //                         justifyContent: "center",
    //                         borderRadius: 35,
    //                         shadowOpacity: 0.9,
    //                         shadowRadius: 10,
    //                         shadowColor: "#000",
    //                         elevation: 5,
    //                         alignSelf: "center",
    //                         // backgroundColor: "#AAAAFF53"
    //                         backgroundColor: Colors.brandDarkBlue + "66"
    //                     }}
    //                 >
    //                     <Text style={[styles.upgradeTitleText]}>
    //                         Alarms List
    //                     </Text>
    //                     <Text style={[styles.upgradeBodyText]}>
    //                         View all of your saved alarms, and turn them ON or
    //                         OFF
    //                     </Text>
    //                     <Text style={[styles.upgradeBodyText]}>
    //                         View additional actions for an alarm, such as
    //                         Deleting and Duplicating, by swiping left on it
    //                     </Text>
    //                     <Text style={[styles.upgradeBodyText]}>
    //                         Long-press Alarm and drag up/down to reorder
    //                     </Text>
    //                 </View>
    //             </View>
    //         </View>
    //     );
    // }

    _renderPagingDots = idx => {
        // console.log("idx", idx);
        return (
            <View style={styles.pagingDotsCont}>
                <View
                    style={[styles.pageDot, idx == 0 && styles.pageDotActive]}
                />
                <View
                    style={[styles.pageDot, idx == 1 && styles.pageDotActive]}
                />
                <View
                    style={[styles.pageDot, idx == 2 && styles.pageDotActive]}
                />
                <View
                    style={[styles.pageDot, idx == 3 && styles.pageDotActive]}
                />
            </View>
        );
    };

    render() {
        // console.log("Upgrade -- render() ");
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: Colors.backgroundLightGrey,
                    alignContent: "stretch"
                }}
            >
                {/* {this.renderCalcButtons()} */}
                <Interactable.View
                    ref={elm => (this._interactable = elm)}
                    style={{
                        flex: 1,
                        width: SCREEN_WIDTH * 6,
                        alignSelf: "stretch",
                        // marginTop: isIphoneX() ? -88 : -64,
                        flexDirection: "row"
                        // backgroundColor: "green"
                    }}
                    horizontalOnly={true}
                    snapPoints={[
                        { x: 0, id: "0" },
                        { x: -SCREEN_WIDTH, id: "1" },
                        { x: -SCREEN_WIDTH * 2, id: "2" },
                        { x: -SCREEN_WIDTH * 3, id: "3" },
                        { x: -SCREEN_WIDTH * 4, id: "4" },
                        { x: -SCREEN_WIDTH * 5, id: "4" }
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
                            this.setState({
                                sectIdx: this._idx
                            });
                        }
                    }}
                    initialPosition={{ x: 0 }}
                >
                    {/* {this.renderHelpPage()} */}
                    <IntrvHelpPage
                        idx={0}
                        goToNextSect={this.goToNextSect}
                        sectionInfo={HELP_SECTIONS[0]}
                        currSectIdx={this._idx}
                    />
                    <IntrvHelpPage
                        idx={1}
                        goToNextSect={this.goToNextSect}
                        sectionInfo={HELP_SECTIONS[1]}
                        currSectIdx={this._idx}
                    />
                    <IntrvHelpPage
                        idx={2}
                        goToNextSect={this.goToNextSect}
                        sectionInfo={HELP_SECTIONS[2]}
                        currSectIdx={this._idx}
                    />
                    <IntrvHelpPage
                        idx={3}
                        goToNextSect={this.goToNextSect}
                        sectionInfo={HELP_SECTIONS[3]}
                        currSectIdx={this._idx}
                    />
                    <IntrvHelpPage
                        idx={4}
                        goToNextSect={this.goToNextSect}
                        sectionInfo={HELP_SECTIONS[4]}
                        currSectIdx={this._idx}
                    />
                    <View style={styles.helpPage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                backgroundColor: "yellow"
                            }}
                        />
                    </View>
                    <View style={styles.helpPage}>
                        <View
                            style={{
                                height: 100,
                                width: 100,
                                backgroundColor: "purple"
                            }}
                        />
                    </View>
                </Interactable.View>
                {/* <TouchableOpacity
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
                            this.setState({
                                sectIdx: this._idx,
                                subIdx: 0
                            });
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
                            this.setState({
                                sectIdx: this._idx,
                                subIdx: 0
                            });
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
                </TouchableOpacity> */}
                {this._renderPagingDots(this._idx)}
                {this.state.showInfoPopup && (
                    <ClkAlert
                        contHeight={"small"}
                        headerIcon={
                            <FAIcon
                                name="info"
                                size={33}
                                color={Colors.brandLightPurple}
                            />
                        }
                        title="Quick Tip"
                        headerTextStyle={{ color: Colors.brandLightOpp }}
                        bodyText={`Tap anywhere to reveal next tip.\n\nSwipe left/right to move to next/previous section`}
                        dismissConfig={{
                            onPress: () => {
                                console.log("Dismissed Info popup");
                                this.setState({ showInfoPopup: false });
                            },
                            text: "Got it!"
                        }}
                        // confirmConfig={{
                        //     onPress: () => {
                        //         console.log(
                        //             "Confirmed Upgrade popup: Going to Upgrades screen"
                        //         );
                        //         this.setState({ showUpgradePopup: false });
                        //         this.props.navigation.navigate("Upgrade");
                        //     },
                        //     text: "Go to Upgrades"
                        // }}
                    />
                )}
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
    pagingDotsCont: {
        position: "absolute",
        bottom: HELPPAGE_HEIGHT * 0.165,
        height: 20,
        // height: 30
        flexDirection: "row",
        alignSelf: "center",
        alignContent: "center",
        // backgroundColor: "blue",
        justifyContent: "center"
    },
    pageDot: {
        height: 7,
        width: 7,
        borderRadius: 7,
        alignSelf: "center",
        backgroundColor: "#BABABA",
        marginHorizontal: 5
    },
    pageDotActive: {
        height: 10,
        width: 10,
        borderRadius: 7,
        backgroundColor: "#989898"
    }
});
