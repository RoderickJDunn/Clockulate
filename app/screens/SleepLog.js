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
    ActivityIndicator
} from "react-native";
import moment, { max } from "moment";
import Sound from "react-native-sound";

import { isIphoneX } from "react-native-iphone-x-helper";
import Interactable from "react-native-interactable";
import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
// import AwesomeAlert from "react-native-awesome-alerts";
import RNTooltips from "react-native-tooltips";
import CalendarStrip from "react-native-calendar-strip";
import { Header } from "react-navigation";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "react-native-modal-datetime-picker";
import Pager from "react-native-swiper";

import realm from "../data/DataSchemas";
import Colors from "../styles/colors";
import DimmableView from "../components/dimmable-view";
import MenuItem from "../components/menu-item";
import TouchableBackdrop from "../components/touchable-backdrop";

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
            "Select date to view data on sleep disturbances and associated recordings"
    },
    genInfo: {
        ref: [null, null, null],
        text: "Swipe left/right to view stats by Day, Week, and Month"
    },
    flatlist: {
        ref: null,
        text:
            "Browse times of sleep disturbances for selected date(s), and tap to listen to a recording (if available)"
    }
};

let ttNameToIdx = {
    0: "calendar",
    1: "genInfo",
    2: "flatlist"
};

let _menuIconAnim = new Animated.Value(0);

export default class SleepLog extends React.Component {
    static navigationOptions = ({ navigation }) => {
        console.log("blah");
        console.log("navigation", navigation.state);
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
            )
        };
    };

    refScreenContainer = null;
    refGenInfo = [null, null, null];
    refCalendarView = null;

    dayRangeDBSetting = null;
    /*
    Props: 
     */
    constructor(props) {
        super(props);

        console.log("SleepLog -- constructor ");

        let settings = realm.objects("Setting");

        console.log("settings: ", settings);

        this.dayRangeDBSetting = realm
            .objects("Setting")
            .filtered("name = 'dayRange'")[0];

        console.log("this.dayRangeDBSetting", this.dayRangeDBSetting);

        let dayRange = this._secondsToDateTime(this.dayRangeDBSetting.value);

        let today12am = moment();
        today12am.startOf("day");

        let tmrw12am = moment();
        tmrw12am.add(1, "days");
        tmrw12am.startOf("day");

        console.log("today12am", today12am.toDate());

        today12am.add(dayRange.getHours(), "hours");
        today12am.add(dayRange.getMinutes(), "minutes");

        tmrw12am.add(dayRange.getHours(), "hours");
        tmrw12am.add(dayRange.getMinutes(), "minutes");

        let alarmInstAll = realm
            .objects("AlarmInstance")
            .sorted("start", false);

        this.state = {
            menuIsOpen: false,
            isDatePickerVisible: false,
            selectedDate: today12am.s,
            genInfoPage: GEN_INFO_PAGES.day.idx,
            walkthroughIdx: null,
            alarmInstAll: alarmInstAll,
            alarmInst: alarmInstAll.length > 0 ? alarmInstAll[0] : null,
            alarmInstIdx: alarmInstAll.length - 1,
            playingDisturbance: null,
            activeSound: null,
            dayRange: dayRange
        };

        this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
        this._showDateTimePicker = this._showDateTimePicker.bind(this);
        console.log("done construction");
    }

    componentDidMount() {
        this.props.navigation.setParams({
            menuIsOpen: false,
            setMenuState: this._setMenuState.bind(this)
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

    _showDateTimePicker() {
        this.setState({ isDatePickerVisible: true });
    }

    _hideDateTimePicker() {
        this.setState({ isDatePickerVisible: false });
    }

    _updateDisturbanceList(selectedDate, rangeTypeIdx, newDayRange) {
        let dayRange = newDayRange;
        if (!newDayRange) {
            dayRange = this.state.dayRange;
        }

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
        minDate.add(dayRange.getHours(), "hours");
        minDate.add(dayRange.getMinutes(), "minutes");

        maxDate.add(dayRange.getHours(), "hours");
        maxDate.add(dayRange.getMinutes(), "minutes");

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
            <View style={styles.disturbanceItemWrap}>
                <View style={[styles.distItemSection, { flex: 0.7 }]}>
                    <Text>{timestamp}</Text>
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
                                <MaterialComIcon name="stop" size={25} />
                            ) : (
                                <MaterialComIcon name="play" size={25} />
                            )}
                        </TouchableOpacity>
                        <Text>{item.duration > 0 && "0:" + item.duration}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    _renderGeneralInfoPage = (idx = 0, alrmInst) => {
        let now = moment();
        let weekStart;
        let title;
        let { dayRange } = this.state;
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
        return (
            <View style={[styles.generalInfoPage]}>
                <View style={styles.textGeneralInfoTitleSec}>
                    <Text style={styles.textGeneralInfoTitle}>{title}</Text>
                </View>
                <View style={styles.textGeneralInfoContent}>
                    <View style={styles.statWrapper}>
                        <View
                            style={[
                                styles.genInfoCircle,
                                { backgroundColor: "#EEC166" }
                            ]}
                        >
                            <Text style={styles.textGeneralInfoStat}>
                                {alrmInst && alrmInst.disturbances.length}
                            </Text>
                        </View>
                        <Text>Disturbances</Text>
                    </View>
                    <View style={styles.statWrapper}>
                        <View
                            style={[
                                styles.genInfoCircle,
                                { backgroundColor: "#CE3333" }
                            ]}
                        >
                            <Text style={styles.textGeneralInfoStat}>
                                {alrmInst &&
                                    alrmInst.disturbances.filtered(
                                        "recording != null"
                                    ).length}
                            </Text>
                        </View>
                        <Text>Recordings</Text>
                    </View>
                </View>
                <View
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
                </View>
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
                            styles.generalInfoSectionWrap,
                            {
                                borderBottomColor: "#898989",
                                borderBottomWidth: 0.8
                            }
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
    pageIdx = 9;
    render() {
        console.log("SleepLog -- render() ");
        // console.log(this.state);
        let wtIdx = this.state.walkthroughIdx;
        let { alarmInstAll, alarmInstIdx } = this.state;
        console.log("alarmInstIdx ", alarmInstIdx);
        console.log("pageIdx", this.pageIdx);
        // console.log("alarmInstAll count", alarmInstAll.length);

        let instGroup = alarmInstAll.slice(alarmInstIdx - 9, alarmInstIdx + 1);

        for (let i = 0; i < instGroup.length; i++) {
            console.debug(i, instGroup[i].start);
        }

        return (
            <View
                style={{ flex: 1 }}
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
                    index={this.pageIdx}
                    loop={false}
                    ListEmptyComponent={this._renderEmptyPage}
                    onIndexChanged={idx => {
                        if (this.ignoreNext) {
                            this.ignoreNext = false;
                            return;
                        }

                        let { alarmInstIdx } = this.state;
                        console.log("onIndexChanged", idx);
                        if (idx == 0) {
                            alarmInstIdx -= 9;
                            if (alarmInstIdx > 0) {
                                this.ignoreNext = true;
                                this.pageIdx = 9;
                                this.setState(
                                    {
                                        alarmInstIdx: alarmInstIdx
                                        // pageIdx: 9
                                    },
                                    () => {
                                        this.pagerRef.scrollBy(9, false);
                                    }
                                );
                            }
                        } else if (idx == 9) {
                            alarmInstIdx += 9;
                            if (
                                alarmInstIdx <
                                this.state.alarmInstAll.length - 1
                            ) {
                                this.ignoreNext = true;
                                this.pageIdx = 0;
                                this.setState(
                                    {
                                        alarmInstIdx: alarmInstIdx
                                        // pageIdx: 0
                                    },
                                    () => {
                                        // this.pagerRef.scrollTo(9);
                                        this.pagerRef.scrollBy(1);
                                    }
                                );
                            }
                        }
                    }}
                >
                    {alarmInstAll
                        .slice(alarmInstIdx - 9, alarmInstIdx + 1) // slices 10 items including the one @ alarmInstIdx
                        .map((almInst, key) => {
                            // console.log(
                            //     `almInst: ${almInst.start} | key: ${key}`
                            // );
                            return (
                                <View key={key} style={{ flex: 1 }}>
                                    <DimmableView
                                        isDimmed={wtIdx != null && wtIdx != 1}
                                        style={styles.generalInfoSectionWrap}
                                    >
                                        <View
                                            style={[
                                                styles.generalInfoSectionWrap,
                                                {
                                                    borderBottomColor:
                                                        "#898989",
                                                    borderBottomWidth: 0.8
                                                }
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
                                        style={{ flex: 1 }}
                                        isDimmed={wtIdx != null && wtIdx != 2}
                                    >
                                        <FlatList
                                            style={{ flex: 1 }}
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
                {this.state.isDatePickerVisible && (
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
                )}
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
                    <MenuItem
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
        paddingRight: 10,
        borderBottomColor: Colors.disabledGrey,
        borderBottomWidth: 1
    },
    generalInfoSectionWrap: {
        height: 190,
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
        width: SCREEN_WIDTH,
        height: "100%"
        // backgroundColor: "green"
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
        alignItems: "center"
    },
    textGeneralInfoTitleSec: {
        paddingBottom: 12,
        paddingHorizontal: 10
    },
    genInfoCircle: {
        borderRadius: 40,
        width: 75,
        height: 75,
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 7,
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
        fontSize: 37,
        fontFamily: "Quesha"
    },
    textGeneralInfoContent: {
        flexDirection: "row",
        justifyContent: "space-around"
    },
    textGeneralInfoStat: {
        fontSize: 22,
        color: Colors.backgroundBright
        // color: Colors.brandDarkGrey
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
