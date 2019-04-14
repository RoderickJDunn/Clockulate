import React, { Component } from "react";
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
    ScrollView,
    Easing
} from "react-native";
import { Header } from "react-navigation";
import { isIphoneX } from "react-native-iphone-x-helper";
import * as Animatable from "react-native-animatable";
import FAIcon from "react-native-vector-icons/FontAwesome";

import Colors from "../styles/colors";
import { scaleByFactor } from "../util/font-scale";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_BAR_HEIGHT = isIphoneX() ? 44 : 20;
const HEADER_HEIGHT = Header.HEIGHT; // + STATUS_BAR_HEIGHT;

const HELPPAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;

const STEP_HEIGHT = HELPPAGE_HEIGHT * 0.73;

export default class WelcomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            idx: props.idx,
            sectionInfo: props.sectionInfo
        };
    }

    _logoAnim = new Animated.Value(0);
    _imgWidthFactor = 0.9;
    _svCurrHeight = 150;
    _scrollPos = 0;

    componentDidMount() {
        setTimeout(() => {
            Animated.timing(this._logoAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true
            }).start();
            this.setState({ showWelcome: true });
        }, 3000);
    }

    nextStep = () => {
        return false;
    };

    render() {
        let { idx, stepIdx, sectionInfo, showNextBtn } = this.state;

        let { currSectIdx } = this.props;

        console.log("idx", idx);
        console.log("stepIdx", stepIdx);
        console.log("currSectIndex", currSectIdx);
        console.log("HEADER_HEIGHT", HEADER_HEIGHT);
        // let images = sectionInfo.images.slice(0, stepIdx + 1);

        // console.log("images", images);
        console.log("SCREEN_HEIGHT", SCREEN_HEIGHT);

        return (
            <View style={styles.helpPage}>
                <Animated.Image
                    style={{
                        alignSelf: "center",
                        height: SCREEN_WIDTH * 0.55 * 0.832,
                        width: SCREEN_WIDTH * 0.55,
                        marginBottom: scaleByFactor(40, 1),
                        transform: [
                            {
                                translateY: this._logoAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -SCREEN_HEIGHT * 0.27]
                                })
                            }
                        ]
                    }}
                    source={{ uri: "WelcomeScreen_logo_v1" }}
                />
                {this.state.showWelcome && (
                    <Animatable.View
                        contentInsetAdjustmentBehavior="automatic"
                        useNativeDriver={true}
                        animation={"fadeIn"}
                        delay={1000}
                        duration={1500}
                        style={{
                            height: SCREEN_HEIGHT * 0.5,
                            width: SCREEN_WIDTH,
                            position: "absolute",
                            bottom: 0
                        }}
                    >
                        <Text
                            style={{
                                position: "absolute",
                                justifyContent: "center",
                                alignSelf: "stretch",
                                textAlign: "center",
                                width: "100%",
                                color: Colors.brandLightOpp,
                                fontFamily: "Gurmukhi MN",
                                fontSize: 30
                            }}
                        >
                            Welcome
                        </Text>
                    </Animatable.View>
                )}
                {/* Measuring line */}
                {/* <View
                        style={{
                            position: "absolute",
                            // use this for a horizontal line
                            // left: 0,
                            // right: 0,
                            // top: 64,
                            // height: 2,

                            // use this for a vertical line
                            // alignSelf: "center",
                            width: 1,
                            top: 0,
                            // bottom: 0,
                            height: 88,
                            backgroundColor: "red"

                            // padding: 20
                            // marginTop: 40
                        }}
                    /> */}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    helpPage: {
        width: SCREEN_WIDTH,
        height: "auto",
        justifyContent: "center",
        // height: SCREEN_HEIGHT - HEADER_HEIGHT - 20,
        // flex: 1,
        // borderWidth: 2,
        // borderColor: "black",
        // height: SCREEN_HEIGHT - 50, // TODO: Change 200 to factor for Title height
        // alignSelf: "center",
        // alignContent: "center",
        // justifyContent: "center",
        // alignItems: "center",
        paddingTop: 20
        // marginTop: -88,
        // backgroundColor: "yellow"
    },
    btnText: {
        color: Colors.brandLightOpp
    }
    // helpPageBox: {
    //     // flex: 0.8,
    //     // height: SCREEN_HEIGHT * 0.5,
    //     // alignItems: "center",
    //     // justifyContent: "center",
    //     alignSelf: "center",
    //     borderRadius: 35,
    //     shadowOpacity: 0.9,
    //     shadowRadius: 10,
    //     shadowColor: "#000",
    //     elevation: 5,
    //     // width: "85%",
    //     // padding: 25,
    //     // backgroundColor: "#AAAAFF53"
    //     // backgroundColor: Colors.brandLightOpp + "BB"
    // },
    // sectionTitleWrap: {
    //     // width: "85%",
    //     // paddingHorizontal: 10,
    //     // backgroundColor: Colors.backgroundGrey,
    //     position: "absolute",
    //     // flexDirection: "row",
    //     left: 0,
    //     right: 0,
    //     paddingTop: 5,
    //     paddingBottom: isIphoneX() ? 20 : 0,
    //     bottom: 5,
    //     height: HELPPAGE_HEIGHT * 0.13,
    //     alignSelf: "center",
    //     alignItems: "center",
    //     alignContent: "center",
    //     // borderRadius: 35,
    //     // borderTopLeftRadius: 35,
    //     // borderTopRightRadius: 35,
    //     justifyContent: "center"
    // },
    // sectionTitle: {
    //     fontSize: scaleByFactor(20, 0.8),
    //     letterSpacing: 2,
    //     fontFamily: "Gurmukhi MN",
    //     // marginBottom: 10,
    //     textAlign: "center",
    //     color: Colors.brandLightOpp
    //     // color: Colors.darkGreyText
    // },
    // sectSubtitle: {
    //     fontSize: scaleByFactor(14, 0.8),
    //     letterSpacing: 2,
    //     fontFamily: "Gurmukhi MN",
    //     color: Colors.brandMidOpp,
    //     alignSelf: "center",
    //     marginLeft: 5
    // },
    // nextSectBtn: {
    //     // bottom: 50,
    //     // paddingVertical: 10,
    //     paddingHorizontal: 15,
    //     alignSelf: "center",
    //     alignContent: "center",
    //     alignItems: "center",
    //     justifyContent: "center",
    //     // width: "55%",
    //     height: scaleByFactor(45),
    //     width: scaleByFactor(45),
    //     shadowOpacity: 0.3,
    //     shadowRadius: 4,
    //     shadowColor: "#000",
    //     elevation: 5,
    //     backgroundColor: Colors.brandLightPurple,
    //     borderRadius: 40
    //     // overflow: "hidden"
    // },
    // nextSectBtnText: {
    //     // color: Colors.darkGreyText,
    //     color: Colors.brandLightOpp,
    //     fontSize: scaleByFactor(22),
    //     // fontFamily: "Quesha",
    //     letterSpacing: 2
    // }
});
