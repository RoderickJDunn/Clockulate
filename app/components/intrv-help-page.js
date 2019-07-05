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
    ScrollView
} from "react-native";
import { Header } from "react-navigation";
import { isIphoneX } from "react-native-iphone-x-helper";
import AutoHeightImage from "react-native-auto-height-image";
import * as Animatable from "react-native-animatable";
import FAIcon from "react-native-vector-icons/FontAwesome";
import { getFullImgNameForPxDensity } from "../img/image_map";

import Colors from "../styles/colors";
import { scaleByFactor } from "../util/font-scale";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_BAR_HEIGHT = isIphoneX() ? 44 : 20;
const HEADER_HEIGHT = Header.HEIGHT; // + STATUS_BAR_HEIGHT;

const HELPPAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;
// console.log("HEADER_HEIGHT", HEADER_HEIGHT);
// console.log("SCREEN_HEIGHT", SCREEN_HEIGHT);
// console.log("HELPPAGE_HEIGHT", HELPPAGE_HEIGHT);

const AnimAutoHeightImg = Animatable.createAnimatableComponent(AutoHeightImage);

const STEP_HEIGHT = HELPPAGE_HEIGHT * 0.73;
// console.log("STEP_HEIGHT", STEP_HEIGHT);
export default class IntrvHelpPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            idx: props.idx,
            stepIdx: 0,
            image: props.image,
            section: props.section
        };
    }

    _imgWidthFactor = 0.9;
    _svCurrHeight = 150;
    _scrollPos = 0;

    // prevStep = () => {
    //     if (this._scrollPos == 0) {
    //         return false;
    //     } else {
    //         let currStepIdx = Math.round(this._scrollPos / STEP_HEIGHT);
    //         currStepIdx = Math.max(0, currStepIdx - 1);
    //         this._scrollViewRef.scrollTo({
    //             y: currStepIdx * STEP_HEIGHT,
    //             duration: 4000
    //         });

    //         // NOTE: Updating scrollPos here since onMomentumScrollEnd not called on Android after using scrollTo
    //         this._scrollPos = currStepIdx * STEP_HEIGHT;
    //         return true;
    //     }
    // };

    // nextStep = () => {
    //     let { idx, stepIdx, sectionInfo, showNextBtn } = this.state;

    //     const images = sectionInfo.images;

    //     // console.log("\nNext Step");
    //     // console.log("idx", idx);
    //     // console.log("stepIdx", stepIdx);
    //     // console.log("this._scrollPos", this._scrollPos);
    //     // console.log("STEP_HEIGHT", STEP_HEIGHT);
    //     // console.log("this._svCurrHeight", this._svCurrHeight);

    //     let nextStepIdx = Math.round(this._scrollPos / STEP_HEIGHT) + 1;
    //     // console.log("images.length", images.length);

    //     if (nextStepIdx < sectionInfo.pageCount) {
    //         console.log("Jumping to step Index: ", nextStepIdx);

    //         this._scrollViewRef.scrollTo({
    //             y: nextStepIdx * STEP_HEIGHT,
    //             duration: 4000
    //         });

    //         // NOTE: Updating scrollPos here since onMomentumScrollEnd not called on Android after using scrollTo
    //         this._scrollPos = nextStepIdx * STEP_HEIGHT;

    //         this.setState({ stepIdx: nextStepIdx });
    //         return true;
    //     } else {
    //         return false;
    //     }
    // };

    // updateBoundaryFlags = nextStepIdx => {
    //     let { stepIdx, sectionInfo } = this.state;
    //     if (nextStepIdx == null) {
    //         nextStepIdx = stepIdx;
    //     }

    //     if (nextStepIdx == sectionInfo.pageCount - 1) {
    //         // If 1) This is the last step, 2) We're at the bottom,
    //         this.props.setBoundaryFlag({
    //             lastStep: true
    //         });
    //     } else if (this._scrollPos == 0) {
    //         // If 1) We're at the top (first step),
    //         this.props.setBoundaryFlag({
    //             firstStep: true
    //         });
    //     } else {
    //         this.props.setBoundaryFlag({
    //             firstStep: false,
    //             lastStep: false
    //         });
    //     }
    // };

    // flashScrollIndicators = () => {
    //     if (!this._scrollViewRef) {
    //         console.error("ScrollView Reference is null");
    //     } else {
    //         this._scrollViewRef.flashScrollIndicators();
    //     }
    // };

    render() {
        let { idx, stepIdx, image, section, showNextBtn } = this.state;

        let { currSectIdx } = this.props;

        // console.log("idx", idx);
        // console.log("stepIdx", stepIdx);
        // console.log("currSectIndex", currSectIdx);
        // console.log("HEADER_HEIGHT", HEADER_HEIGHT);
        // let images = sectionInfo.images.slice(0, stepIdx + 1);
        // let images = sectionInfo.images;

        // console.log("images", images);
        // console.log("SCREEN_HEIGHT", SCREEN_HEIGHT);
        return (
            <View
                style={styles.helpPage}
                // onStartShouldSetResponder={() => true}
            >
                <View style={styles.scrollViewWrap}>
                    <AutoHeightImage
                        width={SCREEN_WIDTH * this._imgWidthFactor - 50}
                        source={{
                            uri: getFullImgNameForPxDensity(image.path)
                        }}
                        onHeightChange={height => {
                            // console.log(
                            //     "onHeightChange",
                            //     height
                            // );
                            if (height > STEP_HEIGHT) {
                                this._imgWidthFactor -= 0.02;
                                if (this._imgWidthFactor > 0.5) {
                                    this.forceUpdate();
                                }
                            }
                        }}
                        style={image.style}
                    />
                </View>
               
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
        height: "auto"
    },
    scrollViewWrap: {
        height: HELPPAGE_HEIGHT * 0.73,
        width: SCREEN_WIDTH * 0.95,
        position: "absolute",
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        // top: HELPPAGE_HEIGHT * 0.5 - (HELPPAGE_HEIGHT * 0.4),
        bottom: HELPPAGE_HEIGHT * 0.1 + 65
    },
    helpPageBox: {
        top: 0,
        alignSelf: "center",
        shadowOpacity: 0.9,
        shadowRadius: 10,
        shadowColor: "#000",
        elevation: 5,
        width: SCREEN_WIDTH * 0.95
    }
});
