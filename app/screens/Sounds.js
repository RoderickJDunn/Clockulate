import React, { Component } from "react";
import {
    View,
    FlatList,
    Dimensions,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import EntypoIcon from "react-native-vector-icons/Entypo";
import Sound from "react-native-sound";
import { ListStyle } from "../styles/list";
import { scale, scaleByFactor } from "../util/font-scale";
import Colors from "../styles/colors";
import realm from "../data/DataSchemas";
import { SOUND_TYPES } from "../data/constants";

export default class Sounds extends Component {
    static navigationOptions = () => ({
        title: "Sounds",
        drawerLockMode: "locked-closed" // prevents drawer from being opening by swipe-back gesture
    });

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    constructor(props) {
        console.log("Sounds constructor");
        super(props);

        // console.log(props);
        let { currSound } = props.navigation.state.params;
        console.log(currSound);
        Sound.setCategory("Playback", false);
        let dbSounds = Array.from(realm.objects("Sound").sorted("order"));
        let sounds = dbSounds.map(x => Object.assign({}, x));
        this.state = {
            sounds: sounds.map(sound => {
                console.log(sound);
                if (sound.id == currSound.sound.id) {
                    console.log("Found match for passed in enabled sound");
                    sound.enabled = true;
                } else {
                    console.log("This sound is disabled");
                }
                return sound;
            }),
            activeSound: null
        };
    }

    componentWillUnmount() {
        this.stopActiveSound();
        let soundToSave = this.state.sounds.find(elem => elem.enabled == true);

        // set enabled to false for saving to DB
        soundToSave.enabled = false;
        this.props.navigation.state.params.saveSound(soundToSave);
    }

    _onPressItem(sound) {
        console.log("Clicked sound: ", sound);
        let enableId = sound.displayName;
        let soundsTmp = this.state.sounds;
        soundsTmp.forEach(sound => {
            sound.enabled = sound.displayName == enableId ? true : false;
            return sound;
        });
        this.setState({ sounds: soundsTmp });

        if (sound.type != SOUND_TYPES.RANDOM) {
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

        if (!sound.files) return;

        console.log("sound.files[last]", sound.files[sound.files.length - 1]);
        var s = new Sound(
            sound.files[sound.files.length - 1], // play Long version for preview
            Sound.MAIN_BUNDLE,
            error => {
                if (error) {
                    console.log("failed to load the sound", error);
                    return;
                }
                // loaded successfully
                console.log(
                    "duration in seconds: " +
                        s.getDuration() +
                        "number of channels: " +
                        s.getNumberOfChannels()
                );
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
            <View style={[styles.listContainer, { flex: 1 }]}>
                <FlatList
                    data={this.state.sounds}
                    keyExtractor={sound => sound.displayName}
                    renderItem={item => {
                        // console.log("Rendering sound row: ", item);
                        let sound = item.item;
                        let checkArea;

                        if (sound.enabled) {
                            checkArea = (
                                <EntypoIcon
                                    style={styles.soundRowContent}
                                    name="check"
                                    size={22}
                                    color="#098eee"
                                />
                            );
                        }
                        return (
                            <TouchableOpacity
                                style={styles.soundListItem}
                                onPress={this._onPressItem.bind(this, sound)}
                            >
                                <Text style={styles.soundRowContent}>
                                    {sound.displayName}
                                </Text>
                                {checkArea}
                            </TouchableOpacity>
                        );
                    }}
                    extraData={this.state}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 10
    },
    soundListItem: {
        flex: 1,
        flexDirection: "row",
        height: scaleByFactor(50),
        justifyContent: "space-between",
        borderBottomColor: Colors.disabledGrey,
        borderBottomWidth: 1
    },
    soundRowContent: {
        alignSelf: "center"
    }
});
