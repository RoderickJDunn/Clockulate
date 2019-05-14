import React, { Component } from "react";
import {
    View,
    SectionList,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet,
    InteractionManager
} from "react-native";
import EntypoIcon from "react-native-vector-icons/Entypo";
import FAIcon from "react-native-vector-icons/FontAwesome";
import { SafeAreaView } from "react-navigation";
import {
    AdMobBanner,
    // AdMobInterstitial,
    PublisherBanner
    // AdMobRewarded
} from "react-native-admob";

import Sound from "react-native-sound";
import { ListStyle } from "../styles/list";
import { scale, scaleByFactor } from "../util/font-scale";
import Colors from "../styles/colors";
import realm from "../data/DataSchemas";
import { SOUND_TYPES } from "../data/constants";
import { AdWrapper } from "../services/AdmobService";
import Upgrades from "../config/upgrades";
import ClkAlert from "../components/clk-awesome-alert";

const PremiumTonesPlaceholder = {
    title: "",
    data: [{ id: "placeholder", files: [], displayName: "More Sounds" }]
};

const SOUND_ROW_HEIGHT = 55;

export default class Sounds extends Component {
    static navigationOptions = () => ({
        title: "Sounds"
    });

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    constructor(props) {
        console.log("Sounds constructor");
        super(props);

        // console.log(props);
        let { currSound, isAnyAlarmOn } = props.navigation.state.params;
        // console.log(currSound);

        // NOTE: setCategory("Playback") causes any active Alarm to stop recording (until alarm is re-enabled), so I need
        //  to only set to "Playback" if no Alarm is currently on. Set to PlayAndRecord if any Alarms are on. The side-effect
        //  of this is that sound playback is much quieter when category is PlayAndRecord, so I need to adjust the volume
        //  accordingly.
        if (isAnyAlarmOn) {
            // console.log("PlayAndRecord: isAnyAlarmOn", isAnyAlarmOn);
            Sound.setCategory("PlayAndRecord", true);
            this._volume = 2;
        } else {
            // console.log("Playback: isAnyAlarmOn", isAnyAlarmOn);
            Sound.setCategory("Playback", false);
            this._volume = 0.5;
        }

        let dbSounds = realm.objects("Sound").sorted("order");

        let freeSounds = Array.from(
            dbSounds.filtered("isPremium = false && type <= 1")
        );
        let premiumSounds = Array.from(
            dbSounds.filtered("isPremium = true && type = 1")
        );

        let randomSounds = Array.from(dbSounds.filtered("type = 2"));

        // if (randomSounds[0].id == currSound.sound.id) {
        //     randomSounds[0].enabled = true;
        // }

        // let sounds = dbSounds.map(x => Object.assign({}, x)); // NOTE: Is this necessary?
        this.state = {
            freeSounds: freeSounds,
            premiumSounds: premiumSounds,
            randomSounds: randomSounds,
            selectedSound: currSound.sound,
            activeSound: null,
            showTonesUpgradePopup: false,
            forcePro: false
        };
    }

    componentWillUnmount() {
        this.stopActiveSound();
        // Sound.setCategory("PlayAndRecord", false);
        this.props.navigation.state.params.saveSound(this.state.selectedSound);
    }

    _onPressItem(sound) {
        console.log("Clicked sound: ", sound);
        if (sound.id == "placeholder") {
            if (Upgrades.pro != true) {
                this.stopActiveSound();
                this.setState({ showTonesUpgradePopup: true });
            }
        } else {
            this.setState({ selectedSound: sound });
            this.playSound(sound);
        }
    }

    stopActiveSound() {
        if (this.state.activeSound) {
            this.state.activeSound.stop();
            this.state.activeSound.release();
        }
    }

    playSound(sound) {
        this.stopActiveSound();

        if (sound.type == SOUND_TYPES.RANDOM) return;

        if (!sound.files || sound.files.length == 0) return;

        // console.log("sound.files[last]", sound.files[sound.files.length - 1]);
        var s = new Sound(
            sound.files[sound.files.length - 1], // play Long version for preview
            Sound.MAIN_BUNDLE,
            error => {
                if (error) {
                    console.log("failed to load the sound", error);
                    return;
                }
                // loaded successfully
                // console.log(
                //     "duration in seconds: " +
                //         s.getDuration() +
                //         "number of channels: " +
                //         s.getNumberOfChannels()
                // );
                s.setVolume(this._volume);
                s.play(success => {
                    if (success) {
                        console.log("successfully finished playing");
                    } else {
                        console.log(
                            "playback failed due to audio decoding errors"
                        );
                        // reset the player to its uninitialized state (android only)
                        // this is the only option to recover after an error occured and use the player again
                        s.reset();
                    }
                    s.release();
                });
            }
        );

        this.setState({ activeSound: s });
    }

    _bannerError = e => {
        console.log("_bannerError");
        console.log(e);
        this.setState({ forcePro: true });
    };

    _getSectHeaderHeight = sectIdx => {
        return sectIdx == 2 ? 60 : 35;
    };

    // _getSectFooterHeight = () => 0;

    render() {
        // console.log(this.state);
        return (
            <SafeAreaView
                forceInset={{
                    top: "never",
                    horizontal: "never",
                    bottom: "always"
                }}
                style={{ flex: 1, backgroundColor: Colors.brandMidGrey }}
            >
                <View style={[styles.listContainer]}>
                    <SectionList
                        /* NOTE: The following was important so that on the initial transition to this
                                 screen, enough Sound rows are displayed to fill the full screen.
                                 Without this line, there is a brief gap shown at the bottom, meaning
                                 not enough rows are rendered in time for the transition...
                        */
                        initialNumToRender={23}
                        keyExtractor={sound => sound.displayName}
                        renderItem={item => {
                            // console.log("Rendering sound row: ", item);
                            let sound = item.item;

                            let checkArea;

                            if (sound.id == this.state.selectedSound.id) {
                                checkArea = (
                                    <EntypoIcon
                                        style={[
                                            styles.soundRowText,
                                            { fontSize: 22 }
                                        ]}
                                        name="check"
                                    />
                                );
                            }
                            return (
                                <TouchableOpacity
                                    style={styles.soundListItem}
                                    onPress={this._onPressItem.bind(
                                        this,
                                        sound
                                    )}
                                >
                                    <View style={styles.soundListContent}>
                                        <Text style={styles.soundRowText}>
                                            {sound.displayName}
                                        </Text>
                                        {checkArea}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        renderSectionHeader={({ section: { title } }) => {
                            if (title == "PREMIUM SOUNDS") {
                                return (
                                    <TouchableOpacity
                                        style={styles.sectionHeaderCont}
                                        // onPress={this.onPressUpgrade}
                                    >
                                        <Text style={styles.sectionTitleText}>
                                            {title}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            } else {
                                return (
                                    <View
                                        style={{
                                            height: 35,
                                            alignSelf: "stretch"
                                        }}
                                    />
                                );
                            }
                        }}
                        sections={[
                            {
                                title: "",
                                data: this.state.randomSounds
                            },
                            {
                                title: "",
                                data: this.state.freeSounds
                            },
                            Upgrades.pro != true
                                ? PremiumTonesPlaceholder
                                : {
                                      title: "PREMIUM SOUNDS",
                                      data: this.state.premiumSounds
                                  }
                        ]}
                        extraData={this.state}
                        getItemLayout={(data, index) => {
                            // console.log("getItemLayout");
                            // NOTE: The index passed in here refers to an array that includes SectionHeaders and SectionFooters,
                            //        even if none are provided (I think). Therefore, for example, if the first section only has
                            //        1 item, then the 1st item in the 2nd section will have an index of 4:
                            //          [SECT_1_HEADER, SECT_1_ITEM1, SECT_1_FOOTER, SECT_2_HEADER, SECT_2_ITEM1]
                            let total = 0;
                            let sectIdx = 0;
                            let type = "ROW";
                            let length = SOUND_ROW_HEIGHT; // initialize with ROW height
                            let offset = 0;
                            // console.log(
                            //     "======================================"
                            // );
                            // console.log("Index", index);
                            for (let i = 0; i < data.length; i++) {
                                let sectData = data[i].data;
                                total = total + sectData.length + 2;
                                if (index < total) {
                                    if (index == total - 1) {
                                        // its a section footer
                                        type = "SECT_FOOT";
                                        length = 0;
                                        offset +=
                                            this._getSectHeaderHeight(i) +
                                            sectData.length * SOUND_ROW_HEIGHT;
                                    } else if (
                                        index ==
                                        total - sectData.length - 2
                                    ) {
                                        // its a section header
                                        type == "SECT_HEAD";
                                        length = this._getSectHeaderHeight(i);
                                    } else {
                                        // Its a row
                                        /* Calculate which item this is within curr section
                                                Logic:
                                                    overall index -
                                                    [sectHeader, sectFooter] of all previous sections (i) +
                                                    sectHeader of the current section
                                            */
                                        // let localIdx = index - 2 * i + 1;
                                        let totalLessCurrSect =
                                            total - sectData.length - 2;
                                        // console.log(
                                        //     "totalLessCurrSect",
                                        //     totalLessCurrSect
                                        // );
                                        let localIdx =
                                            index - totalLessCurrSect;
                                        offset +=
                                            this._getSectHeaderHeight(i) +
                                            (localIdx + 1) * SOUND_ROW_HEIGHT;
                                        // console.log("offset", offset);
                                    }
                                    sectIdx = i;
                                    break;
                                }
                                offset +=
                                    this._getSectHeaderHeight(sectIdx) +
                                    sectData.length * SOUND_ROW_HEIGHT +
                                    0;
                                // console.log("offset", offset);
                            }
                            // console.log("total", total);
                            // console.log("type", type);
                            // console.log("sectIdx", sectIdx);
                            // console.log("offset", offset);
                            // console.log("length", length);
                            return {
                                length: length,
                                offset: offset,
                                index
                            };
                        }}
                        ItemSeparatorComponent={() => {
                            // console.log("ItemSeparatorComponent");
                            return <View style={styles.separator} />;
                        }}
                    />
                    <View
                        style={{
                            height: 20 // padding from bottom (in addition to safe area)
                            // backgroundColor: "green"
                        }}
                    />
                </View>
                {Upgrades.pro != true && (
                    <AdWrapper
                        borderPosition="top"
                        screen={"Sounds"}
                        animate={true}
                        forcePro={this.state.forcePro}
                        proAdvStyle={{
                            height: 100,
                            width: this.width
                        }}
                        // borderColor={Colors.brandDarkGrey}
                        navigation={this.props.navigation}
                        pubBannerProps={{
                            adSize: "smartBannerPortrait",
                            // adUnitID: "ca-app-pub-3940256099942544/6300978111",
                            adUnitID: "ca-app-pub-5775007461562122/9954191195",
                            testDevices: [AdMobBanner.simulatorId],
                            onAdFailedToLoad: this._bannerError,
                            onAdLoaded: () => {
                                console.log("adViewDidReceiveAd");
                            },
                            style: {
                                alignSelf: "center",
                                height: 50,
                                width: this.width
                            }
                        }}
                        onPressProAdv={() =>
                            this.setState({ showTonesUpgradePopup: true })
                        }
                    />
                )}
                {this.state.showTonesUpgradePopup && (
                    <ClkAlert
                        contHeight={"mid"}
                        headerIcon={
                            <FAIcon
                                name="magic"
                                size={33}
                                color={Colors.brandLightPurple}
                            />
                        }
                        title="Interested in Going Pro?"
                        headerTextStyle={{ color: Colors.brandLightOpp }}
                        bodyText={
                            "Upgrade to Clockulate Pro to unlock Premium alarm sounds!\n\n" +
                            "Would you like to learn more?"
                        }
                        dismissConfig={{
                            onPress: () => {
                                console.log("Dismissed Upgrade popup");
                                this.setState({ showTonesUpgradePopup: false });
                            },
                            text: "Dismiss"
                        }}
                        confirmConfig={{
                            onPress: () => {
                                console.log(
                                    "Confirmed Upgrade popup: Going to Upgrades screen"
                                );
                                this.setState({ showTonesUpgradePopup: false });
                                this.props.navigation.navigate("Upgrade");
                            },
                            text: "Go to Upgrades"
                        }}
                    />
                )}
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        backgroundColor: Colors.brandMidGrey
    },
    separator: {
        marginLeft: 15,
        backgroundColor: Colors.disabledGrey,
        height: StyleSheet.hairlineWidth
    },
    soundListItem: {
        flex: 1,
        height: SOUND_ROW_HEIGHT,
        paddingHorizontal: 15,
        backgroundColor: Colors.darkGreyText
    },
    soundListContent: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    soundRowText: {
        alignSelf: "center",
        fontFamily: "Gurmukhi MN",
        fontSize: 16,
        marginTop: 6,
        color: Colors.brandMidOpp
    },
    sectionHeaderCont: {
        alignSelf: "stretch",
        paddingHorizontal: 15,
        paddingVertical: 5,
        justifyContent: "flex-end",
        backgroundColor: Colors.brandDarkGrey,
        height: 60
    },
    sectionTitleText: {
        color: Colors.brandLightGrey,
        fontFamily: "Quesha",
        fontSize: 27
    }
});
