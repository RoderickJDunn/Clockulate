import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
    FlatList,
    StyleSheet,
    InteractionManager,
    Animated,
    ActivityIndicator,
    TextInput,
    ART,
    ImageBackground
} from "react-native";
import moment, { max } from "moment";
import Sound from "react-native-sound";
const { Group, Shape, Surface, Text: ARTText } = ART;

import { isIphoneX } from "react-native-iphone-x-helper";
import Interactable from "react-native-interactable";
import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
import AwesomeAlert from "react-native-awesome-alerts";
import RNTooltips from "react-native-tooltips";
import CalendarStrip from "react-native-calendar-strip";
import { Header } from "react-navigation";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "react-native-modal-datetime-picker";
import Pager from "react-native-swiper";
import Pie from "react-native-pie";
import _ from "lodash";

import realm from "../data/DataSchemas";
import Colors from "../styles/colors";
import DimmableView from "../components/dimmable-view";
import MenuItem from "../components/menu-item";
import TouchableBackdrop from "../components/touchable-backdrop";

const MINUTES_IN_HALFDAY = 60 * 12;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

let ttNameToIdx = {
    0: "calendar",
    1: "genInfo",
    2: "flatlist"
};

const radians = 0.0174532925;
const startAngle = 0;

let _menuIconAnim = new Animated.Value(0);

export default class SleepLog extends React.Component {
    static navigationOptions = ({ navigation }) => {
        console.log("blah");
        console.log("navigation", navigation.state);
        console.log("SleepLog.headerTitle", typeof SleepLog.headerTitle);
        let menuIsOpen = navigation.state.params
            ? navigation.state.params.menuIsOpen
            : false;
        return {
            headerRight: (
                <TouchableOpacity
                    onPress={() => {
                        navigation.state.params.setMenuState(!menuIsOpen);
                    }}
                    style={{
                        alignSelf: "flex-end",
                        paddingLeft: 20,
                        paddingRight: 10
                        // height: Header.HEIGHT - 20
                    }}
                >
                    <Animated.View
                        style={{
                            alignSelf: "center",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            transform: [
                                {
                                    rotate: _menuIconAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "-180deg"]
                                    })
                                }
                            ]
                        }}
                    >
                        <MaterialIcon
                            color={Colors.brandLightGrey}
                            name="settings"
                            size={25}
                        />
                    </Animated.View>
                </TouchableOpacity>
            ),
            headerTitle: (
                <View style={styles.textGeneralInfoTitleSec}>
                    <TextInput
                        ref={elem => {
                            if (
                                navigation.state.params &&
                                navigation.state.params.setTitleRef
                            ) {
                                console.log(
                                    "navigation.state.params",
                                    navigation.state.params
                                );
                                navigation.state.params.setTitleRef(elem);
                            }
                        }}
                        editable={false}
                        style={styles.textGeneralInfoTitle}
                    />
                </View>
            )
        };
    };

    refScreenContainer = null;
    refGenInfo = [null, null, null];
    refCalendarView = null;

    dayRangeDBSetting = null;
    currAlmInstIdx = null;
    headerTitleRef = "pizza";
    pageIdx = null;

    /*
    Props: 
     */
    constructor(props) {
        super(props);

        console.log("SleepLog -- constructor ");

        let settings = realm.objects("Setting");

        console.log("settings: ", settings);

        // this.dayRangeDBSetting = realm
        //     .objects("Setting")
        //     .filtered("name = 'dayRange'")[0];

        // console.log("this.dayRangeDBSetting", this.dayRangeDBSetting);

        // let dayRange = this._secondsToDateTime(this.dayRangeDBSetting.value);

        let today12am = moment();
        today12am.startOf("day");

        let tmrw12am = moment();
        tmrw12am.add(1, "days");
        tmrw12am.startOf("day");

        console.log("today12am", today12am.toDate());

        // today12am.add(dayRange.getHours(), "hours");
        // today12am.add(dayRange.getMinutes(), "minutes");

        // tmrw12am.add(dayRange.getHours(), "hours");
        // tmrw12am.add(dayRange.getMinutes(), "minutes");

        let alarmInstAll = realm
            .objects("AlarmInstance")
            .sorted("start", false);

        console.log("alarmInstAll.length", alarmInstAll.length);

        this.currAlmInstIdx = alarmInstAll.length - 1;
        this.pageIdx = Math.min(9, alarmInstAll.length - 1);

        this.state = {
            menuIsOpen: false,
            isDatePickerVisible: false,
            selectedDate: today12am.s,
            genInfoPage: GEN_INFO_PAGES.day.idx,
            walkthroughIdx: null,
            alarmInstAll: alarmInstAll,
            alarmInst:
                alarmInstAll.length > 0
                    ? alarmInstAll[this.currAlmInstIdx]
                    : null,
            alarmInstIdx: alarmInstAll.length - 1,
            // alarmInstIdx: alarmInstAll.length - 1 - 2,
            playingDisturbance: null,
            activeSound: null,
            // dayRange: dayRange,
            showNoRecAlert: false
        };

        this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
        this._showDateTimePicker = this._showDateTimePicker.bind(this);
        console.log("done construction");
    }

    componentDidMount() {
        this.props.navigation.setParams({
            menuIsOpen: false,
            setMenuState: this._setMenuState.bind(this),
            setTitleRef: this._setTitleRef.bind(this)
        });

        setImmediate(() => {
            this._updateScreenTitle(this.state.alarmInst);
        });

        // if (this.state.walkthroughIdx != null) {
        //     setTimeout(() => {
        //         this.forceUpdate();
        //     }, 300);
        // }
    }

    _secondsToDateTime(sec) {
        let hrs = Math.trunc(sec / 3600);
        let min = Math.trunc((sec % 3600) / 60);
        let d = moment();
        d.hour(hrs);
        d.minute(min);
        d.second(0);
        d.millisecond(0);
        return d.toDate();
    }

    _dateTimeToSecs(date) {
        let m = moment(date);
        let secs = m.hours() * 3600 + m.minutes() * 60;
        return secs;
    }

    _setMenuState(nextMenuState, nextState) {
        if (nextMenuState == this.state.menuIsOpen) return;

        Animated.timing(_menuIconAnim, {
            toValue: nextMenuState ? 1 : 0,
            duration: 200,
            delay: nextMenuState ? 0 : 100,
            useNativeDriver: true
        }).start();

        if (nextState) {
            this.setState({ menuIsOpen: nextMenuState, ...nextState });
        } else {
            this.setState({ menuIsOpen: nextMenuState });
        }
        this.props.navigation.setParams({ menuIsOpen: nextMenuState });
    }

    _setTitleRef(elem) {
        this.headerTitleRef = elem;
    }

    _showDateTimePicker() {
        this.setState({ isDatePickerVisible: true });
    }

    _hideDateTimePicker() {
        this.setState({ isDatePickerVisible: false });
    }

    _updateDisturbanceList(selectedDate, rangeTypeIdx, newDayRange) {
        // let dayRange = newDayRange;
        // if (!newDayRange) {
        //     dayRange = this.state.dayRange;
        // }

        let minDate = moment(selectedDate);
        let maxDate = moment(selectedDate);
        // console.log(
        //     "_updateDisturbanceList. selectedDate: ",
        //     selectedDate.toDate()
        // );
        switch (rangeTypeIdx) {
            case GEN_INFO_PAGES.day.idx:
                minDate.startOf("day");

                maxDate.add(1, "days");
                maxDate.startOf("day");
                break;
            case GEN_INFO_PAGES.week.idx:
                minDate.startOf("isoWeek");

                maxDate.add(1, "week");
                maxDate.startOf("isoWeek");
                break;
            case GEN_INFO_PAGES.month.idx:
                minDate.startOf("month");

                maxDate.add(1, "month");
                maxDate.startOf("month");
                break;
            default:
                console.log(
                    "Error: date range index not found: ",
                    rangeTypeIdx
                );
                return;
        }

        // apply dayRange offset
        // minDate.add(dayRange.getHours(), "hours");
        // minDate.add(dayRange.getMinutes(), "minutes");

        // maxDate.add(dayRange.getHours(), "hours");
        // maxDate.add(dayRange.getMinutes(), "minutes");

        let updatedDist = realm
            .objects("SleepDisturbance")
            .filtered(
                "time >= $0 && time < $1",
                minDate.toDate(),
                maxDate.toDate()
            )
            .sorted("time", true);

        this.setState({
            disturbances: updatedDist,
            selectedDate: selectedDate,
            genInfoPage: rangeTypeIdx
        });
    }

    _playIntro = () => {
        console.log("_playIntro");
        let { walkthroughIdx: wtIdx } = this.state;
        if (wtIdx == null) {
            wtIdx = 0;
        } else {
            if (
                ttNameToIdx[wtIdx] == null ||
                tooltipMap[ttNameToIdx[wtIdx]].ref == null
            ) {
                wtIdx = null;
                return;
            }
            RNTooltips.Dismiss(tooltipMap[ttNameToIdx[wtIdx]].ref);
            wtIdx++;
            if (wtIdx > 2) {
                wtIdx = null;
            }
        }

        if (wtIdx != null) {
            console.log("wtIdx != null", wtIdx != null);
            // guard
            if (tooltipMap[ttNameToIdx[wtIdx]].ref == null) {
                console.log("Ref is null for wtIdx", wtIdx);
                return;
            }

            this.setState({ walkthroughIdx: wtIdx });

            console.log("Setting immediate for Show Tooltip");
            setTimeout(() => {
                console.log("inside setImmediate");
                console.log(
                    "tooltipMap[ttNameToIdx[wtIdx]].text",
                    tooltipMap[ttNameToIdx[wtIdx]].text
                );
                RNTooltips.Show(
                    tooltipMap[ttNameToIdx[wtIdx]].ref,
                    this.refScreenContainer,
                    {
                        text: tooltipMap[ttNameToIdx[wtIdx]].text,
                        autoHide: false,
                        // onHide: () => {
                        //     console.log("On Hide");
                        //     // let { walkthroughIdx } = this.state;
                        //     // walkthroughIdx++;
                        //     // if (walkthroughIdx > 2) {
                        //     //     walkthroughIdx = null;
                        //     // }
                        //     // this.setState({ walkthroughIdx: walkthroughIdx });
                        // },
                        clickToHide: true,
                        textSize: 18,
                        corner: 10,
                        gravity: 3,
                        align: 0,
                        position: 4
                    }
                );
            }, 500);
        } else {
            console.log("wtIdx != null", wtIdx != null);
            this.setState({ walkthroughIdx: wtIdx });
        }
    };

    stopActiveSound() {
        if (this.state.activeSound) {
            this.state.activeSound.stop();
            this.state.activeSound.release();
        }
    }

    _playSound = disturbance => {
        this.stopActiveSound();

        if (this.state.playingDisturbance == disturbance.id) {
            this.setState({ playingDisturbance: null, activeSound: s });
            return; // user just pushed stop. Don't restart sound playback.
        }
        Sound.setCategory("PlayAndRecord", true);
        console.log("item.recording", disturbance.recording);
        var s = new Sound(disturbance.recording, Sound.DOCUMENT, error => {
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
                        this.setState({ showNoRecAlert: true });
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
                            {item.duration > 0 && "0:" + item.duration}
                        </Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    _renderTextStatRow = (label, value) => {
        return (
            <View
                style={[
                    {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 2
                    }
                ]}
            >
                <Text style={[styles.extraStatsText, { flex: 0.8 }]}>
                    {label}
                </Text>
                <Text style={[styles.extraStatsText, { flex: 0.2 }]}>
                    {value}
                </Text>
            </View>
        );
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

    clockNums = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    arcAngle = 30;
    labelRadius = 62;

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
        let now = moment();
        let weekStart;
        let title;
        // let { dayRange } = this.state;
        // console.log("alrmInst", alrmInst);
        switch (idx) {
            case GEN_INFO_PAGES.day.idx:
                if (!alrmInst) {
                    title = "";
                } else {
                    let minDate = moment(alrmInst.start);
                    let maxDate = moment(alrmInst.end);

                    if (minDate.isSame(maxDate, "day")) {
                        title = maxDate.format("MMM DD");
                    } else {
                        let minDateFmt = minDate.format("MMM DD - ");
                        let maxDateFmt = maxDate.format("MMM DD");
                        title = minDateFmt + maxDateFmt;
                    }
                }

                break;
            // case GEN_INFO_PAGES.week.idx:
            //     // get start of current week, to check if selectedDate is in this week
            //     weekStart = moment(now).startOf("isoWeek");
            //     if (selectedDate.isSame(weekStart, "isoWeek")) {
            //         title = "This Week";
            //     } else {
            //         // Selected date is not this week.
            //         // get start of week for selected date
            //         weekStart = moment(selectedDate).startOf("isoWeek");
            //         title = [];
            //         title.push(weekStart.format("MMM DD"));
            //         title.push(" - ");

            //         weekStart.endOf("isoWeek");
            //         title.push(weekStart.format("MMM DD"));
            //         title.push(",  ");
            //         title.push(weekStart.format("YYYY"));
            //         title = title.join("");
            //     }
            //     break;
            // case GEN_INFO_PAGES.month.idx:
            //     // monthStart = moment(selectedDate).startOf("month");
            //     // monthStart.startOf("month");
            //     title = selectedDate.format("MMMM YYYY");
            //     break;
            default:
                console.error("No index");
        }

        /*
            TODO: calculate series, and rotation
            1. If startTime is not 12:00, calculate rotation to apply
            2. Calculate duration (then device convert to perecent (/ 24))
                2a. If duration < 12 hrs, convert it to percent (dur / 12 * 100)
                2b. If duration > 12 hrs, convert extra (beyond 12hrs) to percent (extra / 12 * 100)
            3. Create series
                3a. If duration < 12 hrs, simply use the percent calculated in step 2a as the series
                3b. If duration > 12 hrs, create an extra pie view (inner) for it, and use the extra percent
        */

        let mStart = moment(alrmInst.start);
        console.log("alrmInst.start", alrmInst.start);
        let mEnd = moment(alrmInst.end || new Date());
        console.log("alrmInst.end", alrmInst.end);

        let hour = mStart.hour() % 12 || 12; // converts hour to 12hr time format (1-12)
        let angle = ((hour + mStart.minute() / 60) / 12) * 360;
        console.log("angle", angle);

        let duration = mEnd.diff(mStart, "minutes");
        console.log("duration", duration);
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

        if (alrmInst) {
            console.log("formatting timeAwake: ", alrmInst.timeAwake);
            let mTimeAwake = moment.duration(alrmInst.timeAwake, "minutes");
            let mins = mTimeAwake.minutes() + "";
            timeAwakeFmt = `${mTimeAwake.hours()}:${mins.padStart(2, "0")}`;
        }

        return (
            <View style={[styles.generalInfoPage]}>
                {/* <View style={styles.textGeneralInfoTitleSec}>
                    <Text style={styles.textGeneralInfoTitle}>{title}</Text>
                </View> */}
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
                                    { backgroundColor: "#EEC166" }
                                    // { backgroundColor: "#CE3333" }
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
                {/* <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignContent: "center",
                            alignItems: "center"
                        }
                    ]}
                >
                    <MaterialComIcon
                        name="chevron-left"
                        size={35}
                        // onPress={() => {
                        //     let { alarmInstIdx, alarmInstAll } = this.state;

                        //     alarmInstIdx--;

                        //     if (alarmInstIdx <= 0) {
                        //         alarmInstIdx = alarmInstAll.length - 1;
                        //     }
                        //     this.setState({
                        //         alarmInstIdx: alarmInstIdx
                        //     });
                        // }}
                    />
                    <MaterialComIcon
                        name="chevron-right"
                        size={35}
                        // onPress={() => {
                        //     let { alarmInstIdx } = this.state;
                        //     let alarmInstAll = realm
                        //         .objects("AlarmInstance")
                        //         .sorted("start", false);
                        //     let nextAlmInst = null;
                        //     if (alarmInstIdx > 0) {
                        //         alarmInstIdx--;
                        //         nextAlmInst = alarmInstAll[alarmInstIdx];
                        //     }
                        //     this.setState({
                        //         alarmInst: nextAlmInst,
                        //         alarmInstIdx: alarmInstIdx
                        //     });
                        // }}
                    />
                </View> */}
            </View>
        );
    };

    _renderPagingDots = genInfoPage => {
        console.log("genInfoPage", genInfoPage);
        return (
            <View style={styles.generalInfoFooter}>
                <View
                    style={[
                        styles.pageDot,
                        genInfoPage == 0 && styles.pageDotActive
                    ]}
                />
                <View
                    style={[
                        styles.pageDot,
                        genInfoPage == 1 && styles.pageDotActive
                    ]}
                />
                <View
                    style={[
                        styles.pageDot,
                        genInfoPage == 2 && styles.pageDotActive
                    ]}
                />
                <View
                    style={[
                        styles.pageDot,
                        genInfoPage == 3 && styles.pageDotActive
                    ]}
                />
            </View>
        );
    };

    _renderEmptyPage = (isLoading, date) => {
        return (
            <View style={{ flex: 1 }}>
                <DimmableView
                    isDimmed={false}
                    style={styles.generalInfoSectionWrap}
                >
                    <View
                        style={[
                            styles.generalInfoSectionWrap
                            // {
                            //     borderBottomColor: "#898989",
                            //     borderBottomWidth: 0.8
                            // }
                        ]}
                        ref={target => {
                            this.refGenInfo = target;
                            tooltipMap.genInfo.ref = target;
                        }}
                    >
                        {this._renderGeneralInfoPage(0, {})}
                    </View>
                </DimmableView>
                <DimmableView style={{ flex: 1 }} isDimmed={false}>
                    <ActivityIndicator />
                    {isIphoneX() ? (
                        <View
                            style={{
                                height: 34 // height of bottom safe area in Portrait mode
                                // backgroundColor: "green"
                            }}
                        />
                    ) : null}
                </DimmableView>
            </View>
        );
    };

    _updateScreenTitle(alrmInst) {
        if (alrmInst == null) {
            return;
        }

        let title = "";
        if (this.headerTitleRef == null) {
            console.error("headerTitle is null!");
        } else if (typeof this.headerTitleRef != "string") {
            if (!alrmInst) {
                title = "";
            } else {
                let minDate = moment(alrmInst.start);
                let maxDate = moment(alrmInst.end);

                if (minDate.isSame(maxDate, "day")) {
                    title = maxDate.format("MMM D");
                } else {
                    let minDateFmt = minDate.format("MMM D - ");
                    let maxDateFmt = maxDate.format("MMM D");
                    title = minDateFmt + maxDateFmt;
                }
            }
            this.headerTitleRef.setNativeProps({
                text: title
            });
        } else {
            console.warn("this.headerTitleRef is: " + this.headerTitleRef);
        }
    }

    render() {
        console.log("SleepLog -- render() ");
        // console.log(this.state);
        let wtIdx = this.state.walkthroughIdx;
        let { alarmInstAll, alarmInstIdx } = this.state;
        console.log("alarmInstIdx ", alarmInstIdx);
        console.log("pageIdx", this.pageIdx);
        // console.log("alarmInstAll count", alarmInstAll.length);

        let instGroup = alarmInstAll.slice(
            Math.max(alarmInstIdx - 10, 0),
            alarmInstIdx + 1
        );

        for (let i = 0; i < instGroup.length; i++) {
            console.debug(i, instGroup[i].start);
        }

        return (
            <ImageBackground
                // source={require("../img/paper_texture1.jpg")}
                // style={{ width: "100%", height: "100%", }}
                style={{ flex: 1, backgroundColor: Colors.brandMidGrey }}
                // style={{ flex: 1, backgroundColor: "#E1D5CC" }}
                ref={target => {
                    this.refScreenContainer = target;
                }}
            >
                <Pager
                    ref={elem => (this.pagerRef = elem)}
                    style={styles.wrapper}
                    showsButtons={true}
                    showsPagination={false}
                    loadMinimal
                    loadMinimalSize={1}
                    index={instGroup.length - 1}
                    loop={false}
                    ListEmptyComponent={this._renderEmptyPage}
                    onIndexChanged={idx => {
                        if (this.ignoreNext) {
                            this.ignoreNext = false;
                            return;
                        }

                        let { alarmInstIdx } = this.state;
                        console.log("onIndexChanged", idx);

                        console.log("current alarmInstIdx", alarmInstIdx);
                        if (idx <= 2 && this.pageIdx == idx + 1) {
                            console.log(
                                "Idx has decreased and reached lower bound (2)"
                            );
                            alarmInstIdx -= 5;
                            if (alarmInstIdx > 0) {
                                //this.ignoreNext = true;
                                console.log(
                                    "setting new alarmInstIdx",
                                    alarmInstIdx
                                );
                                this.setState(
                                    {
                                        alarmInstIdx: alarmInstIdx
                                    },
                                    () => {
                                        this.pagerRef.scrollBy(5, false);
                                    }
                                );
                            } else {
                                this.pageIdx = idx;
                                alarmInstIdx += 5; // reset alarmInstIdx since we need to use it below
                            }
                        } else if (idx >= 7 && this.pageIdx == idx - 1) {
                            console.log(
                                "Idx has increased and reached upper bound (7)"
                            );
                            alarmInstIdx += 5;
                            if (
                                alarmInstIdx <
                                this.state.alarmInstAll.length - 1
                            ) {
                                //this.ignoreNext = true;
                                this.setState(
                                    {
                                        alarmInstIdx: alarmInstIdx
                                    },
                                    () => {
                                        this.pagerRef.scrollBy(-5, false);
                                    }
                                );
                            } else {
                                this.pageIdx = idx;
                                alarmInstIdx -= 5; // reset alarmInstIdx since we need to use it below
                            }
                        } else {
                            this.pageIdx = idx;
                        }

                        let lowerBoundIdx = Math.max(alarmInstIdx - 7, 0);

                        this.currAlmInstIdx = lowerBoundIdx + this.pageIdx;
                        console.log("this.pageIdx", this.pageIdx);
                        console.log("lowerBoundIdx", lowerBoundIdx);
                        console.log("this.currAlmInstIdx", this.currAlmInstIdx);

                        let alrmInst = this.state.alarmInstAll[
                            this.currAlmInstIdx
                        ];

                        this._updateScreenTitle(alrmInst);
                    }}
                >
                    {instGroup // slice of up to 10 items including the one @ alarmInstIdx
                        .map((almInst, key) => {
                            // console.log(
                            //     `almInst: ${almInst.start} | key: ${key}`
                            // );
                            return (
                                <View
                                    key={key}
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
                                            {this._renderGeneralInfoPage(
                                                0,
                                                almInst
                                            )}
                                        </View>
                                    </DimmableView>
                                    <DimmableView
                                        style={{
                                            height: SCREEN_HEIGHT - 210
                                        }}
                                        isDimmed={wtIdx != null && wtIdx != 2}
                                    >
                                        <FlatList
                                            data={
                                                almInst && almInst.disturbances
                                            }
                                            keyExtractor={item => item.id}
                                            ListEmptyComponent={
                                                <View
                                                    style={{
                                                        alignContent: "stretch",
                                                        justifyContent:
                                                            "center",
                                                        alignItems: "center",
                                                        flex: 1
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 28,
                                                            fontFamily: "Quesha"
                                                        }}
                                                    >
                                                        No Recordings for Date
                                                        Range
                                                    </Text>
                                                </View>
                                            }
                                            renderItem={
                                                this._renderDisturbanceItem
                                            }
                                            ref={target => {
                                                this.refFlatlist = target;
                                                tooltipMap.flatlist.ref = target;
                                            }}
                                            extraData={
                                                this.state.playingDisturbance
                                            }
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
                                                alarmInstIdx: groupIdx,
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
                        })}
                </Pager>

                {wtIdx != null && (
                    <TouchableWithoutFeedback onPress={() => this._playIntro()}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                )}
                {this.state.menuIsOpen && (
                    <TouchableBackdrop
                        style={{
                            position: "absolute",
                            top: 0, // - (isIphoneX() ? 15 : 0),
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.4)"
                        }}
                        onPress={() => {
                            // console.log(
                            //     "Pressed touchable without feedback"
                            // );
                            // let nextMenuIsOpen = !isMenuOpen;

                            this._setMenuState(false);
                        }}
                    />
                )}
                {/* {this.state.isDatePickerVisible && (
                    <DateTimePicker
                        date={this.state.dayRange} // time has been converted into a Date() for this Component
                        mode={"time"}
                        titleIOS={
                            // "Set the cutoff time for disturbances to be classified as part of the next day"
                            "Set the time to use as the start of day.\nRecordings will be grouped \
                            by day using this cutoff time."
                        }
                        isVisible={true}
                        onConfirm={newDayRange => {
                            let secs = this._dateTimeToSecs(newDayRange);
                            realm.write(() => {
                                this.dayRangeDBSetting.value = secs;
                            });

                            this.setState({
                                dayRange: newDayRange,
                                isDatePickerVisible: false
                            });
                            this._updateDisturbanceList(
                                this.state.selectedDate,
                                this.state.genInfoPage,
                                newDayRange
                            );
                        }}
                        onCancel={this._hideDateTimePicker}
                    />
                )} */}
                <Animated.View
                    style={{
                        position: "absolute",
                        top: Header.HEIGHT - 20, // - (isIphoneX() ? 20 : 0),
                        left: 0,
                        right: 0,
                        height: 240,
                        overflow: "hidden",
                        transform: [
                            {
                                translateY: _menuIconAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-290, -Header.HEIGHT + 20]
                                })
                            }
                        ]
                        // backgroundColor: "blue"
                    }}
                    pointerEvents="box-none"
                >
                    {/* <MenuHeader title="Alarm Options" open={isMenuOpen} /> */}
                    {/* <MenuItem
                        left={
                            <MaterialComIcon
                                size={29}
                                name="timelapse"
                                color={Colors.brandDarkPurple}
                            />
                        }
                        center={"Start of Day"}
                        right={
                            <Text>
                                {this.state.dayRange &&
                                    moment(this.state.dayRange).format(
                                        "h:mm A"
                                    )}
                            </Text>
                        }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={() => {
                            this._setMenuState(false, {
                                isDatePickerVisible: true
                            });
                        }}
                    /> */}
                    <MenuItem
                        left={
                            <MaterialComIcon
                                size={29}
                                name="delete"
                                color={Colors.brandDarkPurple}
                            />
                        }
                        centerRight={<Text>Delete this Entry</Text>}
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={() => {
                            let {
                                alarmInstIdx: groupIdx,
                                alarmInstAll
                            } = this.state;

                            let actualIndex = groupIdx - this.pageIdx;
                            // alert(
                            //     "group idx: " +
                            //         groupIdx +
                            //         " | pageIdx: " +
                            //         this.pageIdx +
                            //         " | total: " +
                            //         alarmInstAll.length +
                            //         " | actualIndex: " +
                            //         this.currAlmInstIdx
                            // );

                            let currAlmInst = alarmInstAll[this.currAlmInstIdx];

                            console.log(
                                "this.currAlmInstIdx",
                                this.currAlmInstIdx
                            );
                            alert(
                                "not fully implemented. Delete almInst with index " +
                                    this.currAlmInstIdx +
                                    ", and start-date: "
                                // currAlmInst.start
                            );
                            this._setMenuState(false);
                        }}
                    />
                    <MenuItem
                        left={
                            <MaterialComIcon
                                name={"information-variant"}
                                color={Colors.brandDarkPurple}
                                underlayColor={Colors.brandDarkPurple}
                                size={29}
                            />
                        }
                        centerRight={<Text>Help</Text>}
                        // right={
                        //     <Text>{`${this.state.alarm.snoozeTime} min`}</Text>
                        // }
                        separatorPosition={SCREEN_WIDTH * 0.15}
                        onPressItem={() => {
                            this._setMenuState(false);
                            this._playIntro();
                        }}
                    />
                </Animated.View>
                {this.state.showNoRecAlert && (
                    <AwesomeAlert
                        alertContainerStyle={{
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            width: "auto"
                        }}
                        // contentContainerStyle={{}}
                        show={true}
                        showProgress={false}
                        title="No Recording Available"
                        message={`No recording was saved for this disturbance, as it occurred too soon after another disturbance. You can increase the number of disturbances that are recorded in the Settings screen.`}
                        messageStyle={{ textAlign: "center" }}
                        closeOnTouchOutside={true}
                        closeOnHardwareBackPress={false}
                        showConfirmButton={true}
                        showCancelButton={true}
                        cancelText="Ok"
                        confirmText="Go to Settings"
                        confirmButtonColor="#54c0ff"
                        onConfirmPressed={() => {
                            // this.setState({ showNoRecAlert: false });
                            alert(
                                "not implemented (should navigate to Settings Screen)"
                            );
                        }}
                        onCancelPressed={() => {
                            this.setState({ showNoRecAlert: false });
                        }}
                        onDismiss={() => {
                            if (this.state.showDurationInfo) {
                                this.setState({ showNoRecAlert: false });
                            }
                        }}
                    />
                )}
            </ImageBackground>
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
    }
});
