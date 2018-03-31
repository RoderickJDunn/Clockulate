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

const SOUNDS = [
    { key: 0, file: "", displayName: "No Sound" },
    { key: 1, file: "sci-fi-alarm.mp3", displayName: "Science Fiction" },
    { key: 2, file: "super_ringtone.mp3", displayName: "Early Riser" }
];

export default class Sounds extends Component {
    static navigationOptions = () => ({
        title: "Sounds"
    });

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    constructor() {
        super();
        Sound.setCategory("Playback", false);
        this.state = {
            sounds: SOUNDS.map(sound =>
                Object.assign({ enabled: false }, sound)
            ),
            activeSound: null
        };
    }

    _onPressItem(sound) {
        console.log("Clicked sound: ", sound);
        let enableId = sound.key;
        let soundsTmp = this.state.sounds;
        soundsTmp.forEach(sound => {
            sound.enabled = sound.key == enableId ? true : false;
            return sound;
        });
        this.setState({ sounds: soundsTmp });
        this.playSound(sound);
    }

    playSound(sound) {
        if (!sound.file) return;
        if (this.state.activeSound) {
            this.state.activeSound.stop();
            this.state.activeSound.release();
        }
        var s = new Sound(sound.file, Sound.MAIN_BUNDLE, error => {
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
                    console.log("playback failed due to audio decoding errors");
                    // reset the player to its uninitialized state (android only)
                    // this is the only option to recover after an error occured and use the player again
                    s.reset();
                }
                s.release();
            });
        });

        this.setState({ activeSound: s });
    }

    render() {
        console.log(this.state);
        return (
            <View style={[styles.listContainer, { flex: 1 }]}>
                <FlatList
                    data={this.state.sounds}
                    renderItem={item => {
                        console.log("Rendering sound row: ", item);
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
