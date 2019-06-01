/* Module that manages when/where to display ads based on a number of factors */

import React, { Component } from "react";
import {
    View,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    Alert
} from "react-native";
import {
    AdMobBanner,
    // AdMobInterstitial,
    PublisherBanner
    // AdMobRewarded
} from "react-native-admob";

import * as Animatable from "react-native-animatable";

import realm from "../data/DataSchemas";
import { ADV_STAT_TYPES } from "../data/constants";
import { isIphoneX } from "react-native-iphone-x-helper";
import Colors from "../styles/colors";
let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
import { getFullImgNameForScreenSize } from "../img/image_map";

let MAP_SCREEN_TO_ADV_IMG = {
    MainMenu: "",
    Alarms: "ProAdv_alarms_banner",
    TaskDetail: "ProAdv_squarish",
    Sounds: "ProAdv_sounds_banner"
};

class ProAdv extends Component {
    render() {
        // console.log("before imgBaseName");
        // console.log("this.props.screen", this.props.screen);
        let imgBaseName = MAP_SCREEN_TO_ADV_IMG[this.props.screen];
        // console.log("imgBaseName", imgBaseName);

        return (
            <Animatable.View
                contentInsetAdjustmentBehavior="automatic"
                useNativeDriver={true}
                animation={"fadeIn"}
                duration={2000}
                delay={400}
            >
                <TouchableOpacity
                    onPress={() => {
                        console.log("navigating to upgrades");
                        console.log(
                            "this.props.navigation",
                            this.props.navigation
                        );
                        this.props.onPress();
                    }}
                >
                    <Image
                        style={{
                            alignSelf: "center",
                            // flex: 1
                            width: this.props.imgDims.width,
                            height: this.props.imgDims.height
                        }}
                        source={[
                            {
                                uri: getFullImgNameForScreenSize(
                                    imgBaseName,
                                    SCREEN_WIDTH
                                )
                            }
                        ]}
                    />
                </TouchableOpacity>
            </Animatable.View>
        );
    }
}

let SHOW_ADMOB_ADV = true;

/* Wrapper requirements for aesthetics of bottom banner 
    AlarmsList / AlarmDetail / TaskDetail / Sounds
        - if SCREEN_WIDTH == 320 (width of ad) OR isIPhoneX == true
            => marginBottom: 0, marginTop: 20
            NOTE: For iphoneX, the SafeAreaView should take care of it.
        - if SCREEN_WIDTH > 320 
            => marginBottom: 20, marginTop: 20
*/

export class AdWrapper extends Component {
    // console.log("props.borderPosition", props.borderPosition);
    // console.log("props.hide", props.hide);
    // console.log("props.screen", props.screen);

    fadeOut = () => {
        if (this._mainViewRef) {
            this._mainViewRef.fadeOut(100);
        }
    };

    render() {
        let border;
        let marginBottom = {};

        let props = this.props;

        // console.log("border", border);
        // console.log("pubBannerProps", props.pubBannerProps);
        return (
            <Animatable.View
                ref={elm => (this._mainViewRef = elm)}
                useNativeDriver={true}
                style={[styles.adWrapper, marginBottom, props.style]}
            >
                {SHOW_ADMOB_ADV && props.forcePro != true ? (
                    <PublisherBanner
                        style={{ backgroundColor: Colors.disabledGrey }}
                        {...props.pubBannerProps}
                    />
                ) : (
                    <ProAdv
                        animate={props.animate}
                        delay={props.delay}
                        imgDims={{
                            width: props.proAdvStyle.width,
                            height: props.proAdvStyle.height
                        }}
                        screen={props.screen}
                        navigation={props.navigation}
                        onPress={props.onPressProAdv}
                    />
                )}
                {props.hide && (
                    <View
                        style={{
                            // flex: 1,
                            position: "absolute",
                            width: props.pubBannerProps.style.width,
                            height: props.pubBannerProps.style.height,
                            backgroundColor: Colors.brandMidGrey
                        }}
                    />
                )}
            </Animatable.View>
        );
    }
}

const styles = StyleSheet.create({
    adwrapper: {
        // width: 320,
        alignContent: "center",
        justifyContent: "center",
        alignSelf: "stretch",
        overflow: "hidden"
        // backgroundColor: Colors.disabledGrey
        // backgroundColor: "green"
        // alignSelf: "center"
        // paddingHorizontal: 10
    }
});
