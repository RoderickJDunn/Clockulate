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

            this.welcomeTxtRef && this.welcomeTxtRef.fadeIn(1500, 1000);
            // this.setState({ showWelcome: true });
        }, 3000);
    }

    nextStep = () => {
        return false;
    };

    render() {
        let { idx, stepIdx, sectionInfo, showNextBtn } = this.state;

        let { currSectIdx } = this.props;

        // console.log("idx", idx);
        // console.log("stepIdx", stepIdx);
        // console.log("currSectIndex", currSectIdx);
        // console.log("HEADER_HEIGHT", HEADER_HEIGHT);
        // let images = sectionInfo.images.slice(0, stepIdx + 1);

        // console.log("images", images);
        // console.log("SCREEN_HEIGHT", SCREEN_HEIGHT);

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
                                    outputRange: [0, -SCREEN_HEIGHT * 0.225]
                                })
                            }
                        ]
                    }}
                    source={{ uri: "welcome_screen_logo_v2" }}
                />
                <Animatable.View
                    contentInsetAdjustmentBehavior="automatic"
                    useNativeDriver={true}
                    ref={elm => (this.welcomeTxtRef = elm)}
                    style={{
                        height: SCREEN_HEIGHT * 0.5,
                        width: SCREEN_WIDTH,
                        position: "absolute",
                        bottom: 0,
                        opacity: 0
                    }}
                >
                    <Text
                        style={{
                            marginTop: 80,
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
        paddingTop: 20
    },
    btnText: {
        color: Colors.brandLightOpp
    }
});
