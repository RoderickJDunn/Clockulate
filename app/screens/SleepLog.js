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
    ImageBackground,
    Alert
} from "react-native";
import moment, { max } from "moment";

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
import SwiperFlatList from "react-native-swiper-flatlist";
import RNFS from "react-native-fs";

import realm from "../data/DataSchemas";
import Colors from "../styles/colors";
import DimmableView from "../components/dimmable-view";
import MenuItem from "../components/menu-item";
import TouchableBackdrop from "../components/touchable-backdrop";
import SleepLogPage from "../components/sleep-log-page";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

let _menuIconAnim = new Animated.Value(0);

export default class SleepLog extends React.Component {
    static navigationOptions = ({ navigation }) => {
        // console.log("blah");
        // console.log("navigation", navigation.state);
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
                                // console.log(
                                //     "navigation.state.params",
                                //     navigation.state.params
                                // );
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

        // console.log("settings: ", settings);

        // this.dayRangeDBSetting = realm
        //     .objects("Setting")
        //     .filtered("name = 'dayRange'")[0];

        // console.log("this.dayRangeDBSetting", this.dayRangeDBSetting);

        // let dayRange = this._secondsToDateTime(this.dayRangeDBSetting.value);

        // console.log("alarmInstAll INFO ------------- ");
        // console.log("alarmInstAll.length", alarmInstAll.length);

        // for (let i = 0; i < alarmInstAll.length; i++) {
        //     console.debug(i, alarmInstAll[i].start);
        // }

        this.state = {
            menuIsOpen: false,
            isDatePickerVisible: false,
            // genInfoPage: GEN_INFO_PAGES.day.idx,
            walkthroughIdx: null,
            alarmInstAll: [],
            alarmInst: null,
            alarmInstGroupIdx: 0,
            // alarmInstGroupIdx: alarmInstAll.length - 1 - 2,
            playingDisturbance: null,
            activeSound: null,
            // dayRange: dayRange,
            showNoRecAlert: false,
            isLoading: true
        };

        this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
        this._showDateTimePicker = this._showDateTimePicker.bind(this);

        this.onNoRecordingFound = this.onNoRecordingFound.bind(this);
    }

    screenDidFocus = payload => {
        if (!this.state.isLoading) {
            this.setState({ isLoading: true });
        }
        InteractionManager.runAfterInteractions(() => {
            let alarmInstAll = realm
                .objects("AlarmInstance")
                .sorted("start", false);

            if (alarmInstAll.length > 0) {
                this.currAlmInstIdx = alarmInstAll.length - 1;
                this.pageIdx = Math.min(9, alarmInstAll.length - 1);

                this.setState({
                    alarmInstAll: alarmInstAll.slice(),
                    alarmInst:
                        alarmInstAll.length > 0
                            ? alarmInstAll[this.currAlmInstIdx]
                            : null,
                    alarmInstGroupIdx: alarmInstAll.length - 1,
                    isLoading: false
                });

                this._updateScreenTitle(this.state.alarmInst);
            } else {
                this.setState({
                    isLoading: false
                });
                this._updateScreenTitle(null);
            }
        });
    };

    componentDidMount() {
        this.props.navigation.setParams({
            menuIsOpen: false,
            setMenuState: this._setMenuState.bind(this),
            setTitleRef: this._setTitleRef.bind(this)
        });

        // setImmediate(() => {
        //     this.screenDidFocus();
        //     this._updateScreenTitle(this.state.alarmInst);
        //     // this.pagerRef.scrollToIndex(
        //     //     this.state.alarmInstAll.length - 1,
        //     //     false
        //     // );
        // });

        this._didFocusListener = this.props.navigation.addListener(
            "didFocus",
            this.screenDidFocus
        );

        // if (this.state.walkthroughIdx != null) {
        //     setTimeout(() => {
        //         this.forceUpdate();
        //     }, 300);
        // }
    }

    componentWillUnmount() {
        this.props.navigation.removeListener("didFocus");
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

    // _updateDisturbanceList(selectedDate, rangeTypeIdx, newDayRange) {
    //     // let dayRange = newDayRange;
    //     // if (!newDayRange) {
    //     //     dayRange = this.state.dayRange;
    //     // }

    //     let minDate = moment(selectedDate);
    //     let maxDate = moment(selectedDate);
    //     // console.log(
    //     //     "_updateDisturbanceList. selectedDate: ",
    //     //     selectedDate.toDate()
    //     // );
    //     switch (rangeTypeIdx) {
    //         case GEN_INFO_PAGES.day.idx:
    //             minDate.startOf("day");

    //             maxDate.add(1, "days");
    //             maxDate.startOf("day");
    //             break;
    //         case GEN_INFO_PAGES.week.idx:
    //             minDate.startOf("isoWeek");

    //             maxDate.add(1, "week");
    //             maxDate.startOf("isoWeek");
    //             break;
    //         case GEN_INFO_PAGES.month.idx:
    //             minDate.startOf("month");

    //             maxDate.add(1, "month");
    //             maxDate.startOf("month");
    //             break;
    //         default:
    //             console.log(
    //                 "Error: date range index not found: ",
    //                 rangeTypeIdx
    //             );
    //             return;
    //     }

    //     // apply dayRange offset
    //     // minDate.add(dayRange.getHours(), "hours");
    //     // minDate.add(dayRange.getMinutes(), "minutes");

    //     // maxDate.add(dayRange.getHours(), "hours");
    //     // maxDate.add(dayRange.getMinutes(), "minutes");

    //     let updatedDist = realm
    //         .objects("SleepDisturbance")
    //         .filtered(
    //             "time >= $0 && time < $1",
    //             minDate.toDate(),
    //             maxDate.toDate()
    //         )
    //         .sorted("time", true);

    //     this.setState({
    //         disturbances: updatedDist,
    //         selectedDate: selectedDate,
    //         genInfoPage: rangeTypeIdx
    //     });
    // }

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

    _renderPagingDots = genInfoPage => {
        // console.log("genInfoPage", genInfoPage);
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
                    <ActivityIndicator size={"large"} />
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
            this.headerTitleRef.setNativeProps({
                text: "Sample Log"
            });
            return;
        }

        console.log(
            `Updating header title. alrmInst: ${alrmInst.start}. Dist count: ${
                alrmInst.disturbances.length
            }`
        );

        let title = "";
        if (this.headerTitleRef == null) {
            console.error("headerTitle is null!");
        } else if (typeof this.headerTitleRef != "string") {
            if (!alrmInst) {
                title = "";
            } else {
                let minDate = moment(alrmInst.start);
                let maxDate;

                // protect agains end being null, which could happen due to crash etc.
                if (alrmInst.end) {
                    maxDate = moment(alrmInst.end);
                } else {
                    maxDate = moment(alrmInst.start);
                }

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

    onNoRecordingFound() {
        this.setState({ showNoRecAlert: true });
    }

    render() {
        let wtIdx = this.state.walkthroughIdx;
        let { alarmInstAll, alarmInstGroupIdx } = this.state;
        let eightHrsAgo;

        if (alarmInstAll.length == 0) {
            eightHrsAgo = new Date();
            eightHrsAgo.setMinutes(eightHrsAgo.getMinutes() - 8.5 * 60);
        }

        // console.log(
        //     "SleepLog -- render -------------------------------------------------- "
        // );
        // console.log(this.state);

        // console.log("alarmInstGroupIdx ", alarmInstGroupIdx);
        // console.log("pageIdx", this.pageIdx);
        // console.log("alarmInstAll count", alarmInstAll.length);

        // let instGroup = alarmInstAll.slice(
        //     Math.max(alarmInstGroupIdx - 9, 0),
        //     alarmInstGroupIdx + 1
        // );

        // for (let i = 0; i < instGroup.length; i++) {
        //     console.debug(i, instGroup[i].start);
        // }

        return (
            <View
                // source={require("../img/paper_texture1.jpg")}
                // style={{ width: "100%", height: "100%", }}
                style={{ flex: 1, backgroundColor: Colors.brandMidGrey }}
                // style={{ flex: 1, backgroundColor: "#E1D5CC" }}
                ref={target => {
                    this.refScreenContainer = target;
                }}
            >
                {this.state.isLoading ? (
                    <ActivityIndicator style={{ flex: 1 }} />
                ) : alarmInstAll.length > 0 ? (
                    <SwiperFlatList
                        ref={elem => (this.pagerRef = elem)}
                        style={styles.wrapper}
                        showsPagination={false}
                        // index={instGroup.length - 1}
                        index={alarmInstAll.length - 1}
                        renderAll={false}
                        onMomentumScrollEnd={info => {
                            console.log("onMomentumScrollEnd", info);
                            let alrmInst = this.state.alarmInstAll[info.index];
                            this.currAlmInstIdx = info.index;
                            // console.log("Next alrmInst", alrmInst);
                            this._updateScreenTitle(alrmInst);
                        }}
                        data={alarmInstAll}
                        renderItem={row => (
                            <SleepLogPage
                                almInst={row.item}
                                onNoRecordingFound={this.onNoRecordingFound}
                            />
                        )}
                        initialScrollIndex={alarmInstAll.length - 1}
                        getItemLayout={(data, index) => {
                            return {
                                length: SCREEN_WIDTH,
                                offset: SCREEN_WIDTH * index,
                                index
                            };
                        }}
                        initialNumToRender={2}
                    />
                ) : (
                    <View style={{ flex: 1 }}>
                        {/* TODO: Show a sample sleep-log page. Show ClkAlert explaining what's happening (no logs yet etc..) */}
                        <SleepLogPage
                            almInst={{
                                id: "string",
                                start: eightHrsAgo,
                                end: new Date(),
                                disturbances: [
                                    { id: "10" },
                                    { id: "11" },
                                    { id: "12" }
                                ],
                                timeAwake: 92
                            }}
                            onNoRecordingFound={this.onNoRecordingFound}
                            isSample
                        />
                        {/* <Text
                            style={{
                                fontSize: 16,
                                color: Colors.backgroundBright,
                                fontFamily: "Gurmukhi MN"
                            }}
                        >
                            No Logs yet! (placeholder)
                        </Text> */}
                    </View>
                )}
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
                                alarmInstGroupIdx: groupIdx,
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

                            if (!currAlmInst) {
                                alert("This Sleep Log is a sample.");
                                this._setMenuState(false);
                                return;
                            }

                            // console.log(
                            //     "this.currAlmInstIdx",
                            //     this.currAlmInstIdx
                            // );
                            // alert(
                            //     "not fully implemented. Delete almInst with index " +
                            //         this.currAlmInstIdx +
                            //         ", and start-date: "
                            //     // currAlmInst.start
                            // );

                            let recordings = currAlmInst.disturbances.filtered(
                                "recording != null AND recording != ''"
                            );
                            var path =
                                RNFS.DocumentDirectoryPath +
                                "/" +
                                currAlmInst.id;

                            recordings.forEach(rec => {
                                RNFS.unlink(path + rec).then(() => {
                                    console.log("Deleted " + rec);
                                });
                            });

                            realm.write(() => {
                                // Delete AlarmInstance, associated disturbances, and any recording files
                                realm.delete(currAlmInst.disturbances);
                                realm.delete(currAlmInst);
                            });

                            alarmInstAll = realm
                                .objects("AlarmInstance")
                                .sorted("start", false)
                                .slice();

                            this._setMenuState(false, {
                                alarmInstAll: alarmInstAll
                            });

                            console.log("alarmInstAll", alarmInstAll);

                            if (
                                this.currAlmInstIdx >= alarmInstAll.length &&
                                alarmInstAll.length > 0
                            ) {
                                console.log("1");
                                // After deletion, the current index is greater than highest bound of allInstances array. Set currIdx to most recent.
                                this.currAlmInstIdx = alarmInstAll.length - 1;
                            } else if (alarmInstAll.length == 0) {
                                console.log("2");
                                // user deleted the only AlarmInstance.
                                this.currAlmInstIdx = null;
                            } else {
                                console.log("3");
                                // user deleted an AlmInst and there was an adjacent one that was more recent. Do not
                                // change currAlmInstIdx, as this will now map to the next most recent AlmInst.
                                // this.currAlmInstIdx++;
                            }

                            if (this.currAlmInstIdx == null) {
                                console.log("4");
                                this._updateScreenTitle(null);
                            } else {
                                console.log("5");
                                let nextAlmInst =
                                    alarmInstAll[this.currAlmInstIdx];
                                this._updateScreenTitle(nextAlmInst);
                            }
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
                        contentContainerStyle={{
                            borderRadius: 20
                        }}
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
                        confirmButtonColor={Colors.brandGreen}
                        cancelButtonColor={Colors.disabledGrey}
                        onConfirmPressed={() => {
                            // this.setState({ showNoRecAlert: false });
                            this.props.navigation.navigate("Settings");
                            // alert(
                            //     "not implemented (should navigate to Settings Screen)"
                            // );
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
    }
});
