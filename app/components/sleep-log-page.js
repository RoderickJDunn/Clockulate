import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    StyleSheet,
    FlatList,
    ART,
    Alert
} from "react-native";

const { Group, Shape, Surface, Text: ARTText } = ART;

import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import moment from "moment";
import DimmableView from "./dimmable-view";
import Colors from "../styles/colors";
import { isIphoneX } from "react-native-iphone-x-helper";
import Pie from "react-native-pie";
import _ from "lodash";
import Sound from "react-native-sound";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MINUTES_IN_HALFDAY = 60 * 12;

let tooltipMap = {
    calendar: {
        ref: null,
        text:
            "Select date to view data on sleep disruptions and associated recordings"
    },
    genInfo: {
        ref: [null, null, null],
        text: "Swipe left/right to view stats by Day, Week, and Month"
    },
    flatlist: {
        ref: null,
        text:
            "Browse times of sleep disruptions for selected date(s), and tap to listen to a recording (if available)"
    }
};

const GEN_INFO_PAGES = {
    day: {
        idx: 0,
        title: "Today"
    },
    week: {
        idx: 1,
        title: "This Week"
    },
    month: {
        idx: 2,
        title: ""
    }
};

const radians = 0.0174532925;
const startAngle = 0;

export default class SleepLogPage extends React.PureComponent {
    clockNums = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    arcAngle = 30;
    labelRadius = 62;

    constructor() {
        super();
        this.state = {
            wtIdx: null,
            activeSound: null,
            playingDisturbance: null
        };
    }

    stopActiveSound() {
        if (this.state.activeSound) {
            this.state.activeSound.stop();
            this.state.activeSound.release();
        }
    }

    _playSound = disturbance => {
        console.log("_playSound");
        this.stopActiveSound();

        if (this.state.playingDisturbance == disturbance.id) {
            this.setState({ playingDisturbance: null, activeSound: s });
            return; // user just pushed stop. Don't restart sound playback.
        }
        Sound.setCategory("PlayAndRecord", true);
        // console.log("item.recording", disturbance.recording);

        let { almInst } = this.props;
        let soundPath = almInst.id + "/" + disturbance.recording;
        var s = new Sound(soundPath, Sound.DOCUMENT, error => {
            if (error) {
                console.log("failed to load the sound", error);
                Alert.alert("Error", "Failed to load recording");
                this.setState({ playingDisturbance: null, activeSound: null });
                return;
            }
            // loaded successfully
            console.log(
                "duration in seconds: " +
                    s.getDuration() +
                    "number of channels: " +
                    s.getNumberOfChannels()
            );
            s.setVolume(0.5);
            s.play(success => {
                if (success) {
                    console.log("successfully finished playing");
                } else {
                    console.log("playback failed due to audio decoding errors");
                    // reset the player to its uninitialized state (android only)
                    // this is the only option to recover after an error occured and use the player again
                    s.reset();
                }
                this.setState({ playingDisturbance: null, activeSound: null });
                s.release();
            });
        });

        this.setState({ playingDisturbance: disturbance.id, activeSound: s });
    };

    x(angle, radius, charCount) {
        // change to clockwise
        //   let a = 360 - angle
        let charOffset = 0;
        if (charCount) {
            charOffset = ((charCount - 1) * radius) / 35;
        }

        let a = angle;
        // start from 12 o'clock
        a = a + 180 - startAngle;
        return radius * Math.sin(a * radians) - charOffset;
    }

    y(angle, radius, charCount) {
        // change to clockwise
        //   let a = 360 - angle
        let a = angle;
        // start from 12 o'clock
        a = a + 180 - startAngle;
        return radius * Math.cos(a * radians);
    }

    _renderDisturbanceItem = ({ item }) => {
        let timestamp;
        if (item.time == 0) {
            timestamp = "";
        } else {
            let time = moment(item.time);
            timestamp = time.format("h:mm a (MMM-DD)");
        }

        // console.log("item", item);
        // console.log("playingDisturbance", this.state.playingDisturbance);
        return (
            <TouchableOpacity
                style={styles.disturbanceItemWrap}
                onPress={() => {
                    if (item.recording) {
                        this._playSound(item);
                    } else {
                        this.props.onNoRecordingFound();
                    }
                }}
            >
                <View style={[styles.distItemSection, { flex: 0.7 }]}>
                    <Text style={styles.distItemText}>{timestamp}</Text>
                </View>

                {item.recording ? (
                    <View
                        style={[
                            styles.distItemSection,
                            {
                                flexDirection: "row",
                                flex: 0.3,
                                alignItems: "center"
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                {
                                    flex: 1,
                                    justifyContent: "center",
                                    alignItems: "flex-end"
                                }
                            ]}
                            onPress={() => {
                                this._playSound(item);
                            }}
                        >
                            {this.state.playingDisturbance == item.id ? (
                                <MaterialComIcon
                                    name="stop"
                                    size={25}
                                    color={Colors.brandLightGrey}
                                />
                            ) : (
                                <MaterialComIcon
                                    name="play"
                                    size={25}
                                    color={Colors.brandLightGrey}
                                />
                            )}
                        </TouchableOpacity>
                        <Text style={styles.distItemText}>
                            {item.duration > 0 &&
                                "0:" + String(item.duration).padStart(2, "0")}
                        </Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    renderClockNums() {
        let labelInfo = this.clockNums
            .map((d, i) => {
                let label = {};
                let labelAngle = i * this.arcAngle; // + arcAngle / 2
                label.text = d + "";
                label.x = this.x(
                    labelAngle,
                    this.labelRadius,
                    label.text.length
                );
                label.y =
                    this.y(labelAngle, this.labelRadius, label.text.length) - 8;
                return label;
            })
            .slice(0, 12);

        return labelInfo.map(label => (
            <ARTText
                font={`21px "Quesha", "Helvetica", Arial`}
                fill={Colors.brandLightGrey}
                x={label.x}
                y={label.y}
                key={label.text}
            >
                {label.text}
            </ARTText>
        ));
    }

    _renderGeneralInfoPage = (idx = 0, alrmInst) => {
        // TODO: Consider for SleepPage stats also/instead using TotalTime, TimeAsleep

        /*
            calculate series, and rotation
            1. If startTime is not 12:00, calculate rotation to apply
            2. Calculate duration (then device convert to perecent (/ 24))
                2a. If duration < 12 hrs, convert it to percent (dur / 12 * 100)
                2b. If duration > 12 hrs, convert extra (beyond 12hrs) to percent (extra / 12 * 100)
            3. Create series
                3a. If duration < 12 hrs, simply use the percent calculated in step 2a as the series
                3b. If duration > 12 hrs, create an extra pie view (inner) for it, and use the extra percent
        */

        let mStart = moment(alrmInst.start);
        // console.log("alrmInst.start", alrmInst.start);

        // TODO: Handle case where alrmInst.end could be null due to an app crash. As is, this
        //       calculate a sleep duration of +++++ depending on the time the user is viewing this page (which could be months later).
        //       I need to check if the AlarmInstance is still running. I should add a flag to the DataSchema of AlarmInstance - 'endedCleanly'
        let mEnd = moment(alrmInst.end || new Date());
        // console.log("alrmInst.end", alrmInst.end);

        let hour = mStart.hour() % 12 || 12; // converts hour to 12hr time format (1-12)
        let angle = ((hour + mStart.minute() / 60) / 12) * 360;
        // console.log("angle", angle);

        let duration = mEnd.diff(mStart, "minutes");
        // console.log("duration", duration);
        let series1 = null;
        let series2 = null;

        if (duration > MINUTES_IN_HALFDAY) {
            series1 = [100];
            let leftover = duration - MINUTES_IN_HALFDAY;
            series2 = [(leftover / MINUTES_IN_HALFDAY) * 100];
        } else {
            series1 = [Math.min((duration / MINUTES_IN_HALFDAY) * 100, 99)];
        }

        let timeAwakeFmt = "0";

        // console.log("alrmInst", alrmInst);

        if (alrmInst) {
            // console.log("formatting timeAwake: ", alrmInst.timeAwake);
            let mTimeAwake = moment.duration(alrmInst.timeAwake, "minutes");
            let mins = mTimeAwake.minutes() + "";
            timeAwakeFmt = `${mTimeAwake.hours()}:${mins.padStart(2, "0")}`;
        }

        return (
            <View style={[styles.generalInfoPage]}>
                <View style={styles.textGeneralInfoContent}>
                    <View style={[styles.statWrapper, { flex: 0.25 }]}>
                        <View
                            style={[
                                // styles.statWrapper,
                                {
                                    flex: 0.5,
                                    justifyContent: "center",
                                    alignSelf: "center",
                                    alignItems: "center"
                                }
                            ]}
                        >
                            <Text style={styles.statLabelText}>
                                Disruptions
                            </Text>
                            <View
                                style={[
                                    styles.genInfoCircle,
                                    // { backgroundColor: "#EEC166" }
                                    { backgroundColor: "#CE3333" }
                                ]}
                            >
                                <Text style={styles.textGeneralInfoStat}>
                                    {alrmInst && alrmInst.disturbances.length}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.statWrapper,
                            {
                                flex: 0.5
                                // backgroundColor: "yellow"
                            }
                        ]}
                    >
                        <View
                            style={{
                                alignSelf: "center",
                                justifyContent: "center",
                                padding: 25,
                                borderRadius: 100,
                                backgroundColor: "#473B5B",
                                position: "absolute",
                                top: 10
                                // left: 0
                            }}
                        >
                            <View
                                style={{
                                    transform: [{ rotate: angle + "deg" }]
                                }}
                            >
                                <View
                                    style={{
                                        alignSelf: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    <Pie
                                        radius={50}
                                        innerRadius={43}
                                        series={series1}
                                        colors={["#4219B4"]}
                                        backgroundColor={
                                            series2 ? "#A8AFCB" : "#281D47"
                                        }
                                        strokeCap="round"
                                    />
                                </View>
                                {/* This next Pie view will only be used if duration > 12 hrs */}
                                {series2 && (
                                    <View
                                        style={[
                                            StyleSheet.absoluteFill,
                                            {
                                                alignSelf: "center",
                                                alignContent: "center",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }
                                        ]}
                                    >
                                        <Pie
                                            radius={42}
                                            innerRadius={38}
                                            /*TODO: calculate series, and rotation
                                            1. If startTime is not 12:00, calculate rotation to apply
                                            2. Calculate duration (then device convert to perecent (/ 24))
                                                2a. If duration < 12 hrs, convert it to percent (dur / 12 * 100)
                                                2b. If duration > 12 hrs, convert extra (beyond 12hrs) to percent (extra / 12 * 100)
                                            3. Create series
                                                3a. If duration < 12 hrs, simply use the percent calculated in step 2a as the series
                                                3b. If duration > 12 hrs
                                                    - Series 1 will be the first 12 hrs, but only that not masked by series 2
                                                        --> Series1 = 12 - extra, and must start 
                                        */
                                            series={series2}
                                            colors={["#88F"]}
                                            backgroundColor="rgba(0,0,0,0)"
                                        />
                                    </View>
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.statLabelText,

                                    {
                                        fontSize: series2 ? 14 : 17,
                                        alignSelf: "center",
                                        position: "absolute"
                                    }
                                ]}
                            >
                                {_.round(duration / 60, 1) + " hrs"}
                            </Text>
                        </View>
                        <View
                            style={[
                                StyleSheet.absoluteFill
                                // {
                                //     backgroundColor: "green"
                                // }
                            ]}
                        >
                            <Surface width={SCREEN_WIDTH} height={600}>
                                <Group
                                    x={((SCREEN_WIDTH - 20) * 0.5 - 8) * 0.5}
                                    y={(210 - 25) / 2 - 15}
                                >
                                    {this.renderClockNums()}
                                </Group>
                            </Surface>
                        </View>
                        <View
                            style={{
                                position: "absolute",
                                bottom: 1
                            }}
                        >
                            <Text
                                style={[styles.statLabelText, { fontSize: 15 }]}
                            >
                                {mStart.format("h:mm a") +
                                    " - " +
                                    mEnd.format("h:mm a")}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statWrapper, { flex: 0.25 }]}>
                        <View
                            style={[
                                // styles.statWrapper,
                                {
                                    flex: 0.5,
                                    justifyContent: "center",
                                    alignSelf: "center",
                                    alignItems: "center"
                                }
                            ]}
                        >
                            <Text style={styles.statLabelText}>Time Awake</Text>
                            <View
                                style={[
                                    styles.genInfoCircle,
                                    // { backgroundColor: "#EEC166" }
                                    // { backgroundColor: "#CE3333" }
                                    { backgroundColor: Colors.brandGreen }
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.textGeneralInfoStat,
                                        {
                                            fontSize:
                                                timeAwakeFmt.length > 4
                                                    ? 18
                                                    : 20
                                        }
                                    ]}
                                >
                                    {timeAwakeFmt}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    render() {
        let { almInst } = this.props;

        let { wtIdx } = this.state;
        return (
            <View
                style={{
                    flex: 1
                }}
            >
                <DimmableView
                    isDimmed={wtIdx != null && wtIdx != 1}
                    style={styles.generalInfoSectionWrap}
                >
                    <View
                        style={[
                            styles.generalInfoSectionWrap
                            // {
                            //     borderBottomColor:
                            //         "#898989",
                            //     borderBottomWidth: 0.8
                            // }
                        ]}
                        ref={target => {
                            this.refGenInfo = target;
                            tooltipMap.genInfo.ref = target;
                        }}
                    >
                        {this._renderGeneralInfoPage(0, almInst)}
                    </View>
                </DimmableView>
                <DimmableView
                    style={{
                        height: SCREEN_HEIGHT - 210
                    }}
                    isDimmed={wtIdx != null && wtIdx != 2}
                >
                    <FlatList
                        data={almInst && almInst.disturbances}
                        keyExtractor={item => item.id}
                        contentContainerStyle={
                            almInst.disturbances.length === 0 &&
                            styles.centerEmptySet
                        }
                        ListEmptyComponent={
                            <View
                                style={{
                                    // alignContent: "stretch",
                                    justifyContent: "center",
                                    alignItems: "center"
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: Colors.backgroundBright,
                                        fontFamily: "Gurmukhi MN",
                                        textAlign: "center",
                                        alignSelf: "center",
                                        maxWidth: SCREEN_WIDTH - 100
                                    }}
                                >
                                    No disturbances were detected during this
                                    alarm
                                </Text>
                            </View>
                        }
                        renderItem={this._renderDisturbanceItem}
                        ref={target => {
                            this.refFlatlist = target;
                            tooltipMap.flatlist.ref = target;
                        }}
                        extraData={this.state.playingDisturbance}
                        getItemLayout={(data, index) => {
                            return {
                                length: 50,
                                offset: 50 * index,
                                index
                            };
                        }}
                    />
                    {isIphoneX() ? (
                        <View
                            style={{
                                height: 34 // height of bottom safe area in Portrait mode
                                // backgroundColor: "green"
                            }}
                        />
                    ) : null}
                </DimmableView>
                {/* <TouchableOpacity
                    style={{
                        height: 70,
                        width: 100,
                        backgroundColor: "green"
                    }}
                    onPress={() => {
                        let {
                            alarmInstGroupIdx: groupIdx,
                            alarmInstAll
                        } = this.state;
                        // let actualIndex = groupIdx + this.pageIdx;
                        alert(
                            "group idx: " +
                                groupIdx +
                                " | pageIdx: " +
                                this.pageIdx +
                                " | total: " +
                                alarmInstAll.length +
                                " | actualIndex: " +
                                this.currAlmInstIdx
                        );
                    }}
                /> */}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    disturbanceItemWrap: {
        alignSelf: "stretch",
        // bottom: isIphoneX() ? 34 : 0,
        right: 0,
        left: 0,
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
        marginRight: 10,
        paddingRight: 10,
        borderBottomColor: Colors.disabledGrey,
        borderBottomWidth: 1
    },
    generalInfoSectionWrap: {
        height: 210,
        width: SCREEN_WIDTH
        // backgroundColor: "green"
    },
    generalInfoSection: {
        height: 160,
        width: SCREEN_WIDTH * 3,
        paddingVertical: 10,
        flexDirection: "row"
        // backgroundColor: "green"
    },
    generalInfoPage: {
        alignSelf: "stretch",
        // width: SCREEN_WIDTH,
        margin: 10,
        borderRadius: 29,
        flex: 1,
        // height: "100%",
        backgroundColor: "#23113E",
        shadowOffset: {
            height: 1,
            width: 0
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        // shadowColor: "black"
        shadowColor: "white"
    },
    sectionSeparator: {
        height: 0.8,
        backgroundColor: Colors.brandDarkGrey
    },
    distItemSection: {
        alignSelf: "stretch",
        justifyContent: "center"
        // backgroundColor: "blue"
    },
    FlatListContainer: {
        bottom: isIphoneX() ? 34 : 0
    },
    statWrapper: {
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        flex: 0.5
    },
    textGeneralInfoTitleSec: {
        // paddingBottom: 12,
        paddingHorizontal: 10,
        alignSelf: "stretch",
        justifyContent: "center"
    },
    genInfoCircle: {
        borderRadius: 40,
        width: 50,
        height: 50,
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 7,
        shadowOpacity: 0.2,
        shadowOffset: {
            height: 1,
            width: 0
        },
        shadowRadius: 4,
        shadowColor: "black",
        elevation: 10
    },
    textGeneralInfoTitle: {
        fontSize: SCREEN_WIDTH > 350 ? 37 : 32,
        fontFamily: "Quesha",
        color: Colors.brandLightOpp,
        justifyContent: "center"
    },
    textGeneralInfoContent: {
        flexDirection: "row",
        justifyContent: "space-around",
        flex: 1
        // backgroundColor: "blue"
    },
    textGeneralInfoStat: {
        fontSize: 23,
        color: Colors.backgroundBright,
        fontFamily: "Gurmukhi MN",
        marginTop: 4
        // color: Colors.brandDarkGrey
    },
    statLabelText: {
        fontSize: SCREEN_WIDTH > 350 ? 14 : 12,
        color: Colors.backgroundBright,
        textAlign: "center",
        fontFamily: "Gurmukhi MN"
    },
    extraStatsText: {
        color: Colors.brandLightOpp,
        fontSize: 13
    },
    distItemText: {
        color: Colors.brandLightGrey
    },
    generalInfoFooter: {
        height: 30,
        flexDirection: "row",
        alignSelf: "stretch",
        alignContent: "center",
        justifyContent: "center"
    },
    pageDot: {
        height: 7,
        width: 7,
        borderRadius: 7,
        alignSelf: "center",
        backgroundColor: "#BABABA",
        marginHorizontal: 5
    },
    pageDotActive: {
        height: 10,
        width: 10,
        borderRadius: 7,
        backgroundColor: "#989898"
    },
    centerEmptySet: {
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    }
});
