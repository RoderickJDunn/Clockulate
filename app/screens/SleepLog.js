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
    Animated
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

        this.state = {
            menuIsOpen: false,
            isDatePickerVisible: false,
            selectedDate: today12am,
            genInfoPage: GEN_INFO_PAGES.day.idx,
            walkthroughIdx: null,
            disturbances: realm
                .objects("SleepDisturbance")
                .filtered(
                    "time >= $0 && time < $1",
                    today12am.toDate(),
                    tmrw12am.toDate()
                )
                .sorted("time", true),
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
        console.log(
            "_updateDisturbanceList. selectedDate: ",
            selectedDate.toDate()
        );
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

        console.log("item", item);
        console.log("playingDisturbance", this.state.playingDisturbance);
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

    _renderGeneralInfoPage = (idx, selectedDate) => {
        let now = moment();
        let weekStart;
        let title;
        let { dayRange } = this.state;
        switch (idx) {
            case GEN_INFO_PAGES.day.idx:
                if (dayRange.getHours() == 0 && dayRange.getMinutes() == 0) {
                    // dayRange is Midnight-Midnight
                    if (selectedDate.isSame(now, "day")) {
                        title = "Today";
                    } else if (
                        selectedDate.isSame(now.subtract(1, "day"), "day")
                    ) {
                        title = "Yesterday";
                    } else {
                        title = selectedDate.format("MMMM DD,  YYYY");
                    }
                } else {
                    let minDate = moment(selectedDate);
                    let maxDate = moment(selectedDate);

                    minDate.startOf("day");

                    maxDate.add(1, "days");
                    maxDate.startOf("day");

                    // apply dayRange offset
                    minDate.add(dayRange.getHours(), "hours");
                    minDate.add(dayRange.getMinutes(), "minutes");

                    maxDate.add(dayRange.getHours(), "hours");
                    maxDate.add(dayRange.getMinutes(), "minutes");

                    let minDateFmt = minDate.format("MMM DD - ");
                    let maxDateFmt = maxDate.format("MMM DD");
                    title = minDateFmt + maxDateFmt;
                }

                break;
            case GEN_INFO_PAGES.week.idx:
                // get start of current week, to check if selectedDate is in this week
                weekStart = moment(now).startOf("isoWeek");
                if (selectedDate.isSame(weekStart, "isoWeek")) {
                    title = "This Week";
                } else {
                    // Selected date is not this week.
                    // get start of week for selected date
                    weekStart = moment(selectedDate).startOf("isoWeek");
                    title = [];
                    title.push(weekStart.format("MMM DD"));
                    title.push(" - ");

                    weekStart.endOf("isoWeek");
                    title.push(weekStart.format("MMM DD"));
                    title.push(",  ");
                    title.push(weekStart.format("YYYY"));
                    title = title.join("");
                }
                break;
            case GEN_INFO_PAGES.month.idx:
                // monthStart = moment(selectedDate).startOf("month");
                // monthStart.startOf("month");
                title = selectedDate.format("MMMM YYYY");
                break;
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
                                {this.state.disturbances.length}
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
                                {
                                    this.state.disturbances.filtered(
                                        "recording != null"
                                    ).length
                                }
                            </Text>
                        </View>
                        <Text>Recordings</Text>
                    </View>
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

    render() {
        console.log("SleepLog -- render() ");
        // console.log(this.state);
        let wtIdx = this.state.walkthroughIdx;
        let { selectedDate } = this.state;
        console.log("selectedDate", selectedDate.toDate());
        // console.log("this.refGenInfo", this.refGenInfo && "true");
        return (
            <View
                style={{ flex: 1 }}
                ref={target => {
                    this.refScreenContainer = target;
                }}
            >
                <DimmableView isDimmed={wtIdx != null && wtIdx != 0}>
                    <CalendarStrip
                        calendarAnimation={{ type: "sequence", duration: 30 }}
                        daySelectionAnimation={{
                            type: "border",
                            duration: 200,
                            borderWidth: 1,
                            borderHighlightColor: "white"
                        }}
                        style={{
                            height: 100,
                            paddingTop: 10,
                            paddingBottom: 5
                        }}
                        calendarHeaderStyle={{ color: "white" }}
                        calendarColor={Colors.brandLightPurple}
                        dateNumberStyle={{ color: "white" }}
                        dateNameStyle={{ color: "white" }}
                        highlightDateNumberStyle={{ color: "#EEC166" }}
                        highlightDateNameStyle={{ color: "#EEC166" }}
                        disabledDateNameStyle={{ color: "grey" }}
                        disabledDateNumberStyle={{ color: "grey" }}
                        // datesWhitelist={datesWhitelist}
                        // datesBlacklist={datesBlacklist}
                        // iconLeft={require('./img/left-arrow.png')}
                        // iconRight={require('./img/right-arrow.png')}
                        iconContainer={{ flex: 0.1 }}
                        ref={target => {
                            this.refCalendarView = target;
                            tooltipMap.calendar.ref = target;
                        }}
                        onLayout={() => {}}
                        onDateSelected={selectedDate => {
                            console.log("onDateSelected");
                            InteractionManager.runAfterInteractions(() => {
                                this._updateDisturbanceList(
                                    selectedDate,
                                    this.state.genInfoPage
                                );
                            });
                        }}
                        onWeekChanged={startOfWeek => {
                            if (this.refCalendarView) {
                                setImmediate(() =>
                                    this.refCalendarView.setSelectedDate(
                                        startOfWeek
                                    )
                                );
                            }
                            InteractionManager.runAfterInteractions(() => {
                                this._updateDisturbanceList(
                                    startOfWeek,
                                    this.state.genInfoPage
                                );
                            });
                        }}
                    />
                </DimmableView>
                <DimmableView
                    isDimmed={wtIdx != null && wtIdx != 1}
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
                        <Interactable.View
                            //  ref={interactableRef}
                            horizontalOnly={true}
                            snapPoints={[
                                { x: 0, id: "day" },
                                { x: -SCREEN_WIDTH, id: "week" },
                                { x: -SCREEN_WIDTH * 2, id: "month" }
                            ]}
                            dragWithSpring={{ tension: 1000, damping: 0.5 }}
                            animatedNativeDriver={true}
                            // animatedValueX={this._position}
                            onDrag={event => {
                                // console.log("Snapping");
                                let {
                                    state,
                                    targetSnapPointId
                                } = event.nativeEvent;
                                if (state == "end") {
                                    this._updateDisturbanceList(
                                        selectedDate,
                                        GEN_INFO_PAGES[targetSnapPointId].idx
                                    );
                                }
                            }}
                            style={[styles.generalInfoSection]}
                        >
                            {this._renderGeneralInfoPage(0, selectedDate)}
                            {this._renderGeneralInfoPage(1, selectedDate)}
                            {this._renderGeneralInfoPage(2, selectedDate)}
                        </Interactable.View>
                        {this._renderPagingDots(this.state.genInfoPage)}
                    </View>
                </DimmableView>
                <DimmableView
                    style={{ flex: 1 }}
                    isDimmed={wtIdx != null && wtIdx != 2}
                >
                    <FlatList
                        style={{ flex: 1 }}
                        data={this.state.disturbances}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={
                            <View
                                style={{
                                    alignContent: "stretch",
                                    justifyContent: "center",
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
                                    No Recordings for Date Range
                                </Text>
                            </View>
                        }
                        renderItem={this._renderDisturbanceItem}
                        ref={target => {
                            this.refFlatlist = target;
                            tooltipMap.flatlist.ref = target;
                        }}
                        extraData={this.state.playingDisturbance}
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
