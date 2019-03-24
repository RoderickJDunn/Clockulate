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

import Colors from "../styles/colors";
import { scaleByFactor } from "../util/font-scale";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_BAR_HEIGHT = isIphoneX() ? 44 : 20;
const HEADER_HEIGHT = Header.HEIGHT; // + STATUS_BAR_HEIGHT;

const HELPPAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;

const AnimAutoHeightImg = Animatable.createAnimatableComponent(AutoHeightImage);

export default class IntrvHelpPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            idx: props.idx,
            stepIdx: 0,
            sectionInfo: props.sectionInfo
        };
    }

    _imgWidthFactor = 0.85;

    nextStep = () => {
        let { idx, stepIdx, sectionInfo } = this.state;

        const images = sectionInfo.images;

        if (stepIdx < images.length - 1) {
            stepIdx++;
            let config = {
                duration: 400,
                update: {
                    duration: 400,
                    type: "easeOut"
                    // springDamping: 0.5
                    // property: "scaleXY"
                }
            };
            LayoutAnimation.configureNext(config);
            this.setState({ stepIdx: stepIdx });
        } else {
            // this.setState({ stepIdx: 0 });
            // TODO: Move interactableView to next screen? Nah probably not (next help section)
        }
    };

    render() {
        let { idx, stepIdx, sectionInfo } = this.state;

        let { currSectIdx } = this.props;

        console.log("idx", idx);
        console.log("stepIdx", stepIdx);
        console.log("currSectIndex", currSectIdx);
        console.log("HEADER_HEIGHT", HEADER_HEIGHT);
        let images = sectionInfo.images.slice(0, stepIdx + 1);

        console.log("images", images);
        console.log("SCREEN_HEIGHT", SCREEN_HEIGHT);

        return (
            <TouchableWithoutFeedback onPress={this.nextStep}>
                <View
                    style={styles.helpPage}
                    // onStartShouldSetResponder={() => true}
                >
                    <View
                        style={{
                            height: HELPPAGE_HEIGHT * 0.73
                            // backgroundColor: "blue"
                            // top: 90,
                            // flex: 1,
                            // alignItems: "center",
                            // alignContent: "center"
                            // justifyContent: "center"
                        }}
                    >
                        {/* Filler view for full nav Header */}
                        {/* <View
                            style={{ width: 1, height: HEADER_HEIGHT }}
                        /> */}
                        <ScrollView
                            style={styles.helpPageBox}
                            ref={ref => (this._scrollViewRef = ref)}
                            // snapToOffsets={sectionInfo.snapOffsets}
                            snapToInterval={HELPPAGE_HEIGHT * 0.73 - 25}
                            decelerationRate="fast"
                            contentContainerStyle={[
                                {
                                    alignItems: "center",
                                    alignContent: "center",
                                    justifyContent: "center",
                                    flexGrow: 1
                                    // backgroundColor: "blue"
                                }
                            ]}
                            onContentSizeChange={(
                                contentWidth,
                                contentHeight
                            ) => {
                                this._scrollViewRef.scrollToEnd({
                                    animated: true
                                });
                            }}
                        >
                            {currSectIdx == idx ? (
                                <View onStartShouldSetResponder={() => true}>
                                    {images.map((img, index) => {
                                        if (img.sharedWithPrev == true) {
                                            return null;
                                        }

                                        let sharedImgs;
                                        if (
                                            index < stepIdx &&
                                            img.sharePageWithNext
                                        ) {
                                            console.log("Found sharePage");
                                            sharedImgs = images.slice(
                                                index + 1,
                                                index +
                                                    img.sharePageWithNext +
                                                    1
                                            );
                                        }
                                        console.log("sharedImgs", sharedImgs);
                                        return (
                                            <TouchableWithoutFeedback
                                                key={index}
                                                onPress={this.nextStep}
                                            >
                                                <View
                                                    style={[
                                                        {
                                                            justifyContent:
                                                                "center",
                                                            height:
                                                                HELPPAGE_HEIGHT *
                                                                    0.73 -
                                                                25
                                                            // backgroundColor: Colors.random()
                                                        } /* ,  img.style */
                                                    ]}
                                                >
                                                    <AutoHeightImage
                                                        width={
                                                            SCREEN_WIDTH *
                                                                this
                                                                    ._imgWidthFactor -
                                                            50
                                                        }
                                                        source={img.path}
                                                        onHeightChange={height => {
                                                            console.log(
                                                                "onHeightChange",
                                                                height
                                                            );
                                                            if (
                                                                height >
                                                                HELPPAGE_HEIGHT *
                                                                    0.73 -
                                                                    25
                                                            ) {
                                                                this._imgWidthFactor -= 0.02;
                                                                if (
                                                                    this
                                                                        ._imgWidthFactor >
                                                                    0.5
                                                                ) {
                                                                    this.forceUpdate();
                                                                }
                                                            }
                                                        }}
                                                        style={[
                                                            // {
                                                            //     height:
                                                            //         HELPPAGE_HEIGHT *
                                                            //             0.73 -
                                                            //         25
                                                            // },
                                                            img.style
                                                        ]}
                                                    />
                                                    {sharedImgs &&
                                                        sharedImgs.map(
                                                            (
                                                                sharedImg,
                                                                key
                                                            ) => {
                                                                return (
                                                                    <AnimAutoHeightImg
                                                                        contentInsetAdjustmentBehavior="automatic"
                                                                        useNativeDriver={
                                                                            true
                                                                        }
                                                                        animation={
                                                                            "fadeInUp"
                                                                        }
                                                                        duration={
                                                                            400
                                                                        }
                                                                        // delay={2000}
                                                                        key={
                                                                            key
                                                                        }
                                                                        width={
                                                                            SCREEN_WIDTH *
                                                                                0.85 -
                                                                            50
                                                                        }
                                                                        source={
                                                                            sharedImg.path
                                                                        }
                                                                        style={
                                                                            sharedImg.style
                                                                        }
                                                                    />
                                                                );
                                                            }
                                                        )}
                                                </View>
                                            </TouchableWithoutFeedback>
                                        );
                                    })}
                                    <View
                                        style={{ width: "100%", height: 40 }}
                                    />
                                </View>
                            ) : (
                                <View
                                    style={{ width: SCREEN_WIDTH * 0.85 - 50 }}
                                />
                            )}
                        </ScrollView>
                    </View>
                    {sectionInfo.images.length - 1 == stepIdx && (
                        <Animatable.View
                            contentInsetAdjustmentBehavior="automatic"
                            useNativeDriver={true}
                            animation={"fadeIn"}
                            duration={1500}
                            delay={2000}
                            style={{
                                position: "absolute",
                                alignSelf: "flex-end",
                                bottom: HELPPAGE_HEIGHT * 0.145,
                                right: 8
                            }}
                            // style={styles.playbackBox}
                        >
                            <TouchableOpacity
                                style={styles.nextSectBtn}
                                onPress={this.props.goToNextSect}
                            >
                                <Text style={[styles.nextSectBtnText]}>
                                    NEXT
                                </Text>
                            </TouchableOpacity>
                        </Animatable.View>
                    )}
                    <View style={styles.sectionTitleWrap}>
                        <Text style={styles.sectionTitle}>
                            {sectionInfo.name}
                        </Text>
                        {
                            <Text style={styles.sectSubtitle}>
                                {sectionInfo.subtitle}
                            </Text>
                        }
                    </View>
                    <View
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
                    />
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
    helpPage: {
        width: SCREEN_WIDTH,
        height: "auto",
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
    helpPageBox: {
        // flex: 0.8,
        // height: SCREEN_HEIGHT * 0.5,
        // alignItems: "center",
        // justifyContent: "center",
        borderRadius: 35,
        shadowOpacity: 0.9,
        shadowRadius: 10,
        padding: 20,
        paddingBottom: 5,
        // marginTop: 40,
        shadowColor: "#000",
        elevation: 5,
        // width: "85%",
        alignSelf: "center",
        // padding: 25,
        // backgroundColor: "#AAAAFF53"
        backgroundColor: Colors.brandLightOpp + "BB"
    },
    sectionTitleWrap: {
        // width: "85%",
        // paddingHorizontal: 10,
        backgroundColor: Colors.backgroundGrey,
        position: "absolute",
        // flexDirection: "row",
        left: 0,
        right: 0,
        paddingTop: 5,
        paddingBottom: isIphoneX() ? 20 : 0,
        bottom: 5,
        height: HELPPAGE_HEIGHT * 0.13,
        alignSelf: "center",
        alignItems: "center",
        alignContent: "center",
        // borderRadius: 35,
        // borderTopLeftRadius: 35,
        // borderTopRightRadius: 35,
        justifyContent: "center"
    },
    sectionTitle: {
        fontSize: scaleByFactor(20, 0.8),
        letterSpacing: 2,
        fontFamily: "Gurmukhi MN",
        // marginBottom: 10,
        textAlign: "center",
        // color: Colors.brandLightOpp
        color: Colors.darkGreyText
    },
    sectSubtitle: {
        fontSize: scaleByFactor(14, 0.8),
        letterSpacing: 2,
        fontFamily: "Gurmukhi MN",
        color: Colors.disabledGrey,
        alignSelf: "center",
        marginLeft: 5
    },
    nextSectBtn: {
        // bottom: 50,
        // paddingVertical: 10,
        paddingHorizontal: 15,
        alignSelf: "center",
        alignContent: "center",
        alignItems: "center",
        justifyContent: "center",
        // width: "55%",
        height: scaleByFactor(40),
        shadowOpacity: 0.3,
        shadowRadius: 7,
        shadowColor: "#000",
        elevation: 5,
        borderColor: Colors.brandMidGrey,
        // backgroundColor: Colors.brandLightOpp,
        borderWidth: StyleSheet.hairlineWidth,
        // borderColor: "white",
        backgroundColor: Colors.brandLightPurple,
        borderRadius: 5
        // overflow: "hidden"
    },
    nextSectBtnText: {
        // color: Colors.darkGreyText,
        color: Colors.brandLightOpp,
        fontSize: scaleByFactor(12),
        // fontFamily: "Quesha",
        letterSpacing: 2
    }
});
