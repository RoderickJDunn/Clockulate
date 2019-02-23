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
import { AdWrapper, AdvSvcOnScreenConstructed } from "../services/AdmobService";
import Upgrades from "../config/upgrades";
import ClkAlert from "../components/clk-awesome-alert";

const PremiumTonesPlaceholder = {
    title: "",
    data: [{ id: "placeholder", files: [], displayName: "More Sounds" }]
};

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
        let { currSound } = props.navigation.state.params;
        // console.log(currSound);

        // TODO: NOTE: any calls to setCategory while recording is active may affect Microphone gain.
        //             Find other calls to this function and investigate whether this causes any issues.
        Sound.setCategory("Playback", false);

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
            activeSound: null
        };
        InteractionManager.runAfterInteractions(() => {
            AdvSvcOnScreenConstructed("Sounds");
        });
    }

    componentWillUnmount() {
        this.stopActiveSound();
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
                s.setVolume(0.5);
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

    render() {
        // console.log(this.state);
        return (
            <SafeAreaView
                forceInset={{ bottom: "always" }}
                style={{ flex: 1, backgroundColor: Colors.brandMidGrey }}
            >
                <View style={[styles.listContainer]}>
                    <SectionList
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
                            if (title == "Spacer") {
                                return (
                                    <View
                                        style={{
                                            alignSelf: "stretch",
                                            height: SCREEN_HEIGHT * 0.35,
                                            backgroundColor: "transparent"
                                        }}
                                    />
                                );
                            } else {
                                return (
                                    <TouchableOpacity
                                        style={{
                                            alignSelf: "stretch",
                                            height: 35
                                            // backgroundColor: "green"
                                        }}
                                        // onPress={this.onPressUpgrade}
                                    >
                                        <Text>{title}</Text>
                                    </TouchableOpacity>
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
                                      title: "Premium Tones",
                                      data: this.state.premiumSounds
                                  }
                        ]}
                        extraData={this.state}
                        getItemLayout={(data, index) => {
                            return {
                                length: 55,
                                offset: 55 * index,
                                index
                            };
                        }}
                        ItemSeparatorComponent={() => (
                            <View style={styles.separator} />
                        )}
                        // ListFooterComponent={() => (
                        //     <View
                        //         style={{ height: 200, backgroundColor: "red" }}
                        //     />
                        // )}
                    />
                </View>
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
                {false && (
                    <AdWrapper
                        borderPosition="top"
                        screen={"Sounds"}
                        animate={true}
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
                                height: 100,
                                width: this.width
                            }
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
        height: 55,
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
    }
});
