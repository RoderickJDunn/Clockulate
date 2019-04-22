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
import getFullImgNameForScreenSize from "../img/image_map";

/* 
    Factors
    - Number of times app has been opened (make sure this includes opening from backgrounded state)
    - What screen is requesting to show an ad?
    - Number of times a given screen has been navigated to (Constructed)
    - Time that has passed since app was last opened
    - Has an IAP been made to remove all ads?
    - Is screen tall enough so that ad will fit including the rest of the content
        - eg. On small screens there is likely not enough room to fit an add in MainMenu


    Banner Ad Placements
    - Main Menu bottom area --- MEDIUM PROFILE
    - Alarms    --- HIGH PROFILE
        - Bottom banner (below list area)
    - AlarmDetail? --       HIGH PROFILE
        - AutoMode - between Fields Container, and TaskList?
                - Bottom of TasksList -- probably the easiest and least obstructive
        - ClassicMode - bottom of screen (will be covered up once in Auto/TaskList view)
        - TaskList View - Bottom of TaskList
    - TaskDetail bottom area --- MEDIUM PROFILE
    - Sounds -- should be just above or below list -- maybe above!. -- LOW PROFILE
    - About? - probably not

    Interstials Ads
    - After creating/saving a new alarm?
    - After creating a new task?


    DB Table Fields
    appOpenedCountTotal -- total times app has ever been opened
    appOpenedCountSinceNonUsePeriod -- this should be reset if NON_USE_THRESHOLD is reached 
    <displayArea>CountSinceNonUsePeriod - (adID) -- the count of times each adArea has been shown 
                                        -- these should also be reset if NON_USE_THRESHOLD is reached 
        - MainMenu
        - AlarmDetail
        - TaskDetail
        - Sounds
    dateAppLastOpened


    Types of Ad Display Areas
    - High Profile
    - Medium Profile
    - Low Profile


    // constants
*/
let ADV_STATS_RSLT;

let NON_USE_THRESHOLD = 3600 * 24 * 7; // 1 week

if (__DEV__) {
    NON_USE_THRESHOLD = 10; // 10 second non-use threshold for dev
}

let getValueForStat = statName => {
    let stats = realm.objects("AdvStat");
    let stat = stats.filtered("name == $0", statName)[0];
    return stat;
};

/* Map of each AdStat to its corresponding screen, or null if not applicable */
let ADV_STATS_MAP = {
    dateAppLastOpened: {
        screen: null,
        get: getValueForStat.bind(this, "dateAppLastOpened")
    },
    appOpenedCountTotal: {
        screen: null,
        get: getValueForStat.bind(this, "appOpenedCountTotal")
    },
    appOpenedCountSinceNUP: {
        screen: null,
        get: getValueForStat.bind(this, "appOpenedCountSinceNUP")
    },
    AlarmsListVCTotal: {
        screen: "Alarms",
        get: getValueForStat.bind(this, "AlarmsListVCTotal")
    },
    AlarmsListVCSinceNUP: {
        screen: "Alarms",
        get: getValueForStat.bind(this, "AlarmsListVCSinceNUP")
    },
    MainMenuVCTotal: {
        screen: "MainMenu",
        get: getValueForStat.bind(this, "MainMenuVCTotal")
    },
    MainMenuVCSinceNUP: {
        screen: "MainMenu",
        get: getValueForStat.bind(this, "MainMenuVCSinceNUP")
    },
    AlarmDetailVCTotal: {
        screen: "AlarmDetail",
        get: getValueForStat.bind(this, "AlarmDetailVCTotal")
    },
    AlarmDetailVCSinceNUP: {
        screen: "AlarmDetail",
        get: getValueForStat.bind(this, "AlarmDetailVCSinceNUP")
    },
    TaskDetailVCTotal: {
        screen: "TaskDetail",
        get: getValueForStat.bind(this, "TaskDetailVCTotal")
    },
    TaskDetailVCSinceNUP: {
        screen: "TaskDetail",
        get: getValueForStat.bind(this, "TaskDetailVCSinceNUP")
    },
    SoundsVCTotal: {
        screen: "Sounds",
        get: getValueForStat.bind(this, "SoundsVCTotal")
    },
    SoundsVCSinceNUP: {
        screen: "Sounds",
        get: getValueForStat.bind(this, "SoundsVCSinceNUP")
    }
};

/* Resets all stats pertaining to the last Non-Use-Period.
    Must be called from within a realm.write block 
*/
function resetNUPStats() {
    console.log("resetNUPStats");
    let nup_advStats = realm
        .objects("AdvStat")
        .filtered("statType == $0", ADV_STAT_TYPES.NUP_COUNT);

    nup_advStats.forEach(stat => {
        stat.value = 0;
    });
}

export function AdSvcUpdateAppOpenedStats() {
    console.log("AdSvcUpdateAppOpenedStats");
    // TODO: at a certain point the counts don't matter. There should be a limit otherwise who knows what will happen.
    let stats = realm.objects("AdvStat");
    let dateOpenedStat = stats.filtered("name == $0", "dateAppLastOpened")[0];

    if (!dateOpenedStat) return;

    let openedCountSinceNUPStat = stats.filtered(
        "name == $0",
        "appOpenedCountSinceNUP"
    )[0];
    let openedCountTotalStat = stats.filtered(
        "name == $0",
        "appOpenedCountTotal"
    )[0];

    let now = new Date();
    let epoch = Math.floor(now.getTime() / 1000);
    let shouldResetCounters = false;

    console.log("NON_USE_THRESHOLD", NON_USE_THRESHOLD);
    console.log("epoch", epoch);
    // console.log("ADV_STATS_MAP.dateAppLastOpened", ADV_STATS_MAP.dateAppLastOpened);
    // console.log(
    //     "ADV_STATS_MAP.dateAppLastOpened.get()",
    //     ADV_STATS_MAP.dateAppLastOpened.get()
    // );
    console.log("dateOpenedStat", dateOpenedStat);

    if (
        dateOpenedStat.value + NON_USE_THRESHOLD < epoch &&
        dateOpenedStat.value != 0
    ) {
        // ADV_STATS_MAP.dateAppLastOpened.get().value + NON_USE_THRESHOLD <
        //     epoch &&
        // ADV_STATS_MAP.dateAppLastOpened.get().value != 0
        console.log("set reset to true");
        // it has been more than NON_USE_THRESHOLD since app was last opened. Reset counters
        shouldResetCounters = true;
    }

    realm.write(() => {
        console.log("Updating advStats in DB...");

        // ADV_STATS_MAP.appOpenedCountTotal.get().value++;
        openedCountTotalStat.value++;

        if (shouldResetCounters == true) {
            resetNUPStats();
        } else {
            // ADV_STATS_MAP.appOpenedCountSinceNUP.get().value++;
            openedCountSinceNUPStat.value++;
        }
    });
}

export function AdvSvcUpdateDateLastOpen() {
    let now = new Date();
    let epoch = Math.floor(now.getTime() / 1000);

    realm.write(() => {
        console.log("Updating dateAppLastOpen in DB...");
        ADV_STATS_MAP.dateAppLastOpened.get().value = epoch;
    });
}

export function AdvSvcOnScreenConstructed(navScreen) {
    let now = new Date();
    let epoch = Math.floor(now.getTime() / 1000);

    let statsToUpdate = Object.keys(ADV_STATS_MAP).filter(stat => {
        if (ADV_STATS_MAP[stat].screen == navScreen) {
            return true;
        }
    }, []);

    console.log("Updating stats for screen: ", navScreen);
    console.log("Screen statsToUpdate", statsToUpdate);

    if (statsToUpdate.length == 0) {
        console.error("No stats found for screen: " + navScreen);
        return;
    }

    realm.write(() => {
        statsToUpdate.forEach(statName => {
            console.log("ADV_STATS_MAP[statName]", ADV_STATS_MAP[statName]);
            ADV_STATS_MAP[statName] && ADV_STATS_MAP[statName].get().value++;
        });

        ADV_STATS_MAP.dateAppLastOpened.get().value = epoch;
    });
}

function shouldShowAdv(displayArea /* or ad ID */) {
    /* 
        pseudo-code 


        
        if (IAP.noAds is purchased) return false
        if (IAP.all is purchased) return false
        if (> NON_USE_THRESHOLD since app opened) return false          |  try getting user back into it, no ads.

        if (appOpenedCountSinceNonUsePeriod == 1) {  // first time app is opened since last NonUsePeriod
            switch(screen):
                Alarms: return false
                MainMenu: return false
                AlarmDetail: return false
                TaskDetail: return true
                Sounds: return true
        }

        if (AdArea == MainMenu) {
            return false if Alarms Ad is currently being shown, since 2 ads not allowed at same time.
        }

        switch (AdAreaType):
            HIGH_PROFILE:
                every 3rd display of this area will return true
            MEDIUM_PROFILE:
                every 2nd display of this area will return true
            LOW_PROFILE:
                every display of this area will return true



    */
}

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
