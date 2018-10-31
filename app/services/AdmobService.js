/* Module that manages when/where to display ads based on a number of factors */

import React, { Component } from "react";
import {
    View,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import realm from "../data/DataSchemas";
import { ADV_STAT_TYPES } from "../data/constants";

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
let ADV_STATS = null;
let NON_USE_THRESHOLD = 3600 * 24 * 7; // 1 week

if (__DEV__) {
    NON_USE_THRESHOLD = 10; // 10 second non-use threshold for dev
}

/* Map of each AdStat to its corresponding screen, or null if not applicable */
let ADV_STAT_SCREEN_MAP = {
    dateAppLastOpened: null,
    appOpenedCountTotal: null,
    appOpenedCountSinceNUP: null,
    AlarmsListVCTotal: "Alarms",
    AlarmsListVCSinceNUP: "Alarms",
    MainMenuVCTotal: "MainMenu",
    MainMenuVCSinceNUP: "MainMenu",
    AlarmDetailVCTotal: "AlarmDetail",
    AlarmDetailVCSinceNUP: "AlarmDetail",
    TaskDetailVCTotal: "TaskDetail",
    TaskDetailVCSinceNUP: "TaskDetail",
    SoundsVCTotal: "Sounds",
    SoundsVCSinceNUP: "Sounds"
};

/* Updates DB with statistics relavent to displaying ads */
export function AdvSvcInit() {
    console.log("AdvSvcInit");
    ADV_STATS = {};
    ADV_STATS_RSLT = realm.objects("AdvStat");
    console.log("ADV_STATS_RSLT", ADV_STATS_RSLT);

    // create dictionary of individual AdvStats for easier access
    Object.keys(ADV_STAT_SCREEN_MAP).forEach(name => {
        ADV_STATS[name] = ADV_STATS_RSLT.filtered("name == $0", name)[0];
    });

    console.log("ADV_STATS[dateAppLastOpened]", ADV_STATS["dateAppLastOpened"]);
}

/* Resets all stats pertaining to the last Non-Use-Period.
    Must be called from within a realm.write block 
*/
function resetNUPStats() {
    console.log("resetNUPStats");
    let nup_advStats = ADV_STATS_RSLT.filtered(
        "statType == $0",
        ADV_STAT_TYPES.NUP_COUNT
    );

    nup_advStats.forEach(stat => {
        stat.value = 0;
    });
}

export function AdSvcUpdateAppOpenedStats() {
    console.log("AdSvcUpdateAppOpenedStats");
    // TODO: at a certain point the counts don't matter. There should be a limit otherwise who knows what will happen.

    let now = new Date();
    let epoch = Math.floor(now.getTime() / 1000);
    let shouldResetCounters = false;

    console.log("NON_USE_THRESHOLD", NON_USE_THRESHOLD);
    console.log("epoch", epoch);
    console.log("ADV_STATS.dateAppLastOpened", ADV_STATS.dateAppLastOpened);
    if (
        ADV_STATS.dateAppLastOpened.value + NON_USE_THRESHOLD < epoch &&
        ADV_STATS.dateAppLastOpened.value != 0
    ) {
        console.log("set reset to true");
        // it has been more than NON_USE_THRESHOLD since app was last opened. Reset counters
        shouldResetCounters = true;
    }

    realm.write(() => {
        console.log("Updating advStats in DB...");

        ADV_STATS.appOpenedCountTotal.value++;

        if (shouldResetCounters == true) {
            resetNUPStats();
        } else {
            ADV_STATS.appOpenedCountSinceNUP.value++;
        }
    });
}

export function AdvSvcUpdateDateLastOpen() {
    let now = new Date();
    let epoch = Math.floor(now.getTime() / 1000);

    realm.write(() => {
        console.log("Updating dateAppLastOpen in DB...");
        ADV_STATS.dateAppLastOpened.value = epoch;
    });
}

export function AdvSvcOnScreenConstructed(navScreen) {
    console.log("ADV_STATS", ADV_STATS);
    if (
        ADV_STATS == null ||
        ADV_STATS == undefined ||
        ADV_STATS.dateAppLastOpened == undefined
    ) {
        console.log("Its null");
        AdvSvcInit();
    }
    let statsToUpdate = Object.keys(ADV_STAT_SCREEN_MAP).filter(statName => {
        if (ADV_STAT_SCREEN_MAP[statName] == navScreen) {
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
            console.log("ADV_STATS[statName]", ADV_STATS[statName]);
            ADV_STATS[statName] && ADV_STATS[statName].value++;
        });
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

export let AdWrapper = props => {
    console.log("props.borderPosition", props.borderPosition);
    let border;
    if (props.borderPosition == "top")
        border = {
            borderTopWidth: 20,
            borderTopColor: props.borderColor || "transparent"
        };
    else if (props.borderPosition == "bottom")
        border = {
            borderBottomWidth: 20,
            borderBottomColor: props.borderColor || "transparent"
        };

    console.log("border", border);
    return (
        <View style={[styles.adWrapper, border, props.style]}>
            {props.children}
        </View>
    );
};

const styles = StyleSheet.create({
    adWrapper: {
        // width: 320,
        alignSelf: "stretch"
        // alignSelf: "center"
        // paddingHorizontal: 10
    }
});
