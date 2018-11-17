import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
    FlatList,
    StyleSheet
} from "react-native";

import { isIphoneX } from "react-native-iphone-x-helper";
import Interactable from "react-native-interactable";
import MaterialComIcon from "react-native-vector-icons/MaterialCommunityIcons";
// import AwesomeAlert from "react-native-awesome-alerts";
import RNTooltips from "react-native-tooltips";

import CalendarStrip from "react-native-calendar-strip";
import Colors from "../styles/colors";
// import MultiOverlay from "../components/multi-overlay";
import DimmableView from "../components/dimmable-view";
import Tooltip from "react-native-walkthrough-tooltip";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

let dummyDisturbances = [
    {
        key: "0"
    },
    {
        key: "1"
    },
    {
        key: "2"
    },
    {
        key: "3"
    }
];

const GEN_INFO_PAGES = {
    day: 0,
    week: 1,
    month: 2
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
            "Browse times of sleep disturbances for selected date, and tap to listen to a recording (if available)"
    }
};

let ttNameToIdx = {
    0: "calendar",
    1: "genInfo",
    2: "flatlist"
};

export default class SleepLog extends React.Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerRight: (
                <TouchableOpacity
                    onPress={() => {
                        console.log("pressed info in recordings screen");
                        navigation.state.params.playIntro();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 20, right: 0 }}
                    style={{
                        paddingLeft: 20,
                        paddingRight: 10
                    }}
                >
                    <MaterialComIcon
                        name={"information-variant"}
                        color={Colors.brandLightGrey}
                        underlayColor={Colors.brandDarkGrey}
                        size={29}
                    />
                </TouchableOpacity>
            )
        };
    };

    refScreenContainer = null;
    refGenInfo = [null, null, null];
    refCalendarView = null;
    /*
    Props: 
     */
    constructor(props) {
        super(props);

        console.log("SleepLog -- constructor ");

        this.state = {
            genInfoPage: GEN_INFO_PAGES.day,
            walkthroughIdx: null
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({
            playIntro: this._playIntro
        });

        if (this.state.walkthroughIdx != null) {
            setTimeout(() => {
                this.forceUpdate();
            }, 300);
        }
    }

    _playIntro = () => {
        let { walkthroughIdx: wtIdx } = this.state;
        if (wtIdx == null) {
            wtIdx = 0;
        } else {
            RNTooltips.Dismiss(tooltipMap[ttNameToIdx[wtIdx]].ref);
            wtIdx++;
            if (wtIdx > 2) {
                wtIdx = null;
            }
        }
        this.setState({ walkthroughIdx: wtIdx });

        if (wtIdx != null) {
            // guard
            if (tooltipMap[ttNameToIdx[wtIdx]].ref == null) {
                return;
            }

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
        }
    };

    _renderDisturbanceItem = () => {
        return (
            <View style={styles.disturbanceItemWrap}>
                <View style={[styles.distItemSection, { flex: 0.8 }]}>
                    <Text>12:32 AM</Text>
                </View>

                <View
                    style={[
                        styles.distItemSection,
                        { flex: 0.2, alignItems: "flex-end" }
                    ]}
                >
                    <View style={[styles.distItemSection, { flex: 0.8 }]}>
                        <Text>Listen or STOP</Text>
                    </View>
                </View>
            </View>
        );
    };

    _renderGeneralInfoPage = idx => {
        let bgd = "white";
        switch (idx) {
            case 0:
                bgd = "red";
                break;
            case 1:
                bgd = "blue";
                break;
            case 2:
                bgd = "yellow";
                break;
            default:
                console.error("No index");
        }
        return (
            <View style={[styles.generalInfoPage]}>
                <View style={styles.textGeneralInfoTitleSec}>
                    <Text style={styles.textGeneralInfoTitle}>Today</Text>
                </View>
                <View style={styles.textGeneralInfoContent}>
                    <View style={styles.statWrapper}>
                        <View
                            style={[
                                styles.genInfoCircle,
                                { backgroundColor: "#EEC166" }
                            ]}
                        >
                            <Text style={styles.textGeneralInfoStat}>13</Text>
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
                            <Text style={styles.textGeneralInfoStat}>6</Text>
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
        console.log(this.state);
        let wtIdx = this.state.walkthroughIdx;
        console.log(
            "this.refScreenContainer",
            this.refScreenContainer && "true"
        );
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
                    />
                </DimmableView>
                <DimmableView
                    isDimmed={wtIdx != null && wtIdx != 1}
                    style={styles.generalInfoSectionWrap}
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
                                this.setState({
                                    genInfoPage:
                                        GEN_INFO_PAGES[targetSnapPointId]
                                });
                            }
                        }}
                        style={[styles.generalInfoSection]}
                    >
                        {this._renderGeneralInfoPage(0)}
                        {this._renderGeneralInfoPage(1)}
                        {this._renderGeneralInfoPage(2)}
                    </Interactable.View>
                    {this._renderPagingDots(this.state.genInfoPage)}
                </DimmableView>
                <DimmableView
                    style={{ flex: 1 }}
                    isDimmed={wtIdx != null && wtIdx != 2}
                    ref={target => {
                        this.refFlatlist = target;
                        tooltipMap.flatlist.ref = target;
                    }}
                >
                    {/* <View style={styles.sectionSeparator} /> */}
                    <FlatList
                        data={dummyDisturbances}
                        renderItem={this._renderDisturbanceItem}
                    />
                </DimmableView>
                {wtIdx != null && (
                    <TouchableWithoutFeedback onPress={() => this._playIntro()}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                )}
                {/* <RNTooltips
                    text={
                        wtIdx != null
                            ? tooltipMap[ttNameToIdx[wtIdx]].text
                            : null
                    }
                    visible={true}
                    parent={this.refScreenContainer}
                    target={
                        // this.refCalendarView
                        wtIdx != null
                            ? tooltipMap[ttNameToIdx[wtIdx]].ref
                            : null
                    }
                    autoHide={false}
                    onHide={() => {
                        console.log("On Hide");
                        let { walkthroughIdx } = this.state;
                        walkthroughIdx++;
                        if (walkthroughIdx > 2) {
                            walkthroughIdx = null;
                        }
                        this.setState({ walkthroughIdx: walkthroughIdx });
                    }}
                    clickToHide={true}
                    textSize={18}
                    corner={10}
                    gravity={3}
                    align={0}
                    position={4}
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
        height: 2,
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
        fontSize: 24
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
