import React from "react";
import {
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback,
    Image,
    StyleSheet,
    Animated,
    LayoutAnimation,
    ActivityIndicator,
    Platform
} from "react-native";
import { Header, NavigationEvents } from "react-navigation";
import LinearGradient from "react-native-linear-gradient";
import Interactable from "react-native-interactable";
import FAIcon from "react-native-vector-icons/FontAwesome";
import AutoHeightImage from "react-native-auto-height-image";
import * as Animatable from "react-native-animatable";
import _ from "lodash";

import { getFullImgNameForPxDensity } from "../img/image_map";
import Colors from "../styles/colors";
import ClkAlert from "../components/clk-awesome-alert";
import IntrvHelpPage from "../components/intrv-help-page";
import MiscStorage from "../config/misc_storage";
import WelcomePage from "../components/welcome-page";
import PagingDots from "../components/paging-dots";
import MenuItem from "../components/menu-item";
import TouchableBackdrop from "../components/touchable-backdrop";

import { scaleByFactor } from "../util/font-scale";
import { isIphoneX, ifIphoneX } from "react-native-iphone-x-helper";
import { HEADER } from "../data/licenses";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_HEIGHT = Header.HEIGHT; // + STATUS_BAR_HEIGHT;

const HELPPAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;

let HELP_SECTIONS = [
    {
        name: "The Basics",
        subtitle: "Edit Alarm", // "Overview",
        images: [
            {
                path: "basics_img1",
                subtitle: "Overview",
                style: { paddingVertical: SCREEN_HEIGHT * 0.05 }
            },
            {
                path: "basics_img2",
                style: null
            },
            {
                path: "basics_img3",
                style: null
            },
            {
                path: "basics_img4",
                style: {
                    paddingTop: SCREEN_HEIGHT * 0.08,
                    paddingBottom: SCREEN_HEIGHT * 0.03
                }
            }
        ],
        pageCount: 4,
        snapOffsets: []
    },
    {
        name: "Tasks",
        // subtitle: "Edit Alarm",
        images: [
            {
                path: "tasks_img1",
                style: null
            },
            {
                path: "tasks_img2",
                style: null
            },
            {
                path: "tasks_img3",
                style: null
            },
            {
                path: "tasks_img4",
                style: null
            }
        ],
        pageCount: 4
    },
    {
        name: "Alarm Modes",
        // subtitle: "Edit Alarm",
        images: [
            {
                path: "modes_img1",
                subtitle: "Clockulate Mode",
                style: { paddingVertical: SCREEN_HEIGHT * 0.14 }
            },
            {
                path: "modes_img2",
                subtitle: "Classic Mode",
                style: { paddingVertical: SCREEN_HEIGHT * 0.28 }
            }
        ],
        pageCount: 2,
        isFinalSect: true
    },
    {
        name: "Alarms List",
        images: [
            {
                path:
                    "alarmslist_img1" +
                    Platform.select({ ios: "_ios", android: "_android" }),
                style: { marginBottom: 5 }
            },
            {
                path:
                    "alarmslist_img2" +
                    Platform.select({ ios: "_ios", android: "_android" }),
                style: { marginBottom: 5 }
            },
            {
                path: "alarmslist_img3",
                style: null
            }
        ],
        pageCount: 5, // different from image count, due to images 2/3 sharing a page
        snapOffsets: [SCREEN_HEIGHT * 0.6, SCREEN_HEIGHT]
    }
];

let totalPages = 0;

let IMG_URLS = HELP_SECTIONS.reduce((accum, sect, idx) => {
    let sectImgUrls = sect.images.map(img =>
        getFullImgNameForPxDensity(img.path)
    );
    accum.push(...sectImgUrls);

    /* NOTE: Unrelated functionality. Updates this section of HELP_SECTIONS, with an startingIdx property,
        which indicates the overall pageIdx that this section begins with
    */
    HELP_SECTIONS[idx].startingIdx = totalPages;
    totalPages += sect.images.length;
    /* END */

    return accum;
}, []);
// console.log("IMG_URLS", IMG_URLS);

// SCREEN_HEIGHT -= 88; // add 88 since the Nav bar is transparent
export default class Help extends React.Component {
    /*
    Props: 
     */
    constructor(props) {
        super(props);

        this.state = {
            imgHeight: 135,
            sectIdx: 0,
            showInfoPopup: false,
            isFirstStep: this.props.screenType != "modal",
            isLoading: true,
            downloadSuccess: false,
            isFocused: true,
            menuIsOpen: false
        };

        this._snapPoints = Array(IMG_URLS.length)
            .fill(null)
            .map((unusedElm, i) => {
                return {
                    x: -SCREEN_WIDTH * i,
                    id: i + "",
                    tension: 1000,
                    damping: 0.4
                };
            });

        console.log("this._snapPoints", this._snapPoints);

        if (this.props.screenType == "modal") {
            this._isModal = true;
            this._welcomeOffset = 1;
            let nextSnapIdx = this._snapPoints.length;
            this._snapPoints.push({
                x: -SCREEN_WIDTH * nextSnapIdx,
                id: nextSnapIdx + ""
            });
            this._pageRefs.push(null);
        }

        console.log("Help -- constructor ", this.props.screenType);
    }

    _bgdPosition = new Animated.Value(0);
    _interactable = null;
    _idx = 0;
    _welcomeOffset = 0;
    _pageRefs = [null, null, null, null];

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    componentDidMount() {
        this.props.navigation.setParams({
            toggleInfoPopup: this.toggleInfoPopup,
            setMenuState: this.setMenuState
        });
        if (MiscStorage.visitedHelp !== true) {
            MiscStorage.setVistedHelp(true);
            // setTimeout(this.toggleInfoPopup, 500);
        }
    }

    setMenuState = (nextMenuState, nextState) => {
        if (nextMenuState == this.state.menuIsOpen) return;

        Animated.timing(this.props.menuAnim, {
            toValue: nextMenuState ? 1 : 0,
            duration: 200,
            // delay: nextMenuState ? 0 : 100,
            useNativeDriver: true
        }).start();

        LayoutAnimation.configureNext({
            duration: 200,
            update: {
                duration: 200,
                type: "easeInEaseOut"
                // springDamping: 0.5,
                // property: "scaleXY"
            },
            ...(nextMenuState == false && {
                create: {
                    delay: 50,
                    duration: 150,
                    type: "spring",
                    springDamping: 1,
                    // property: "opacity"
                    property: "scaleXY"
                }
            })
        });

        if (nextState) {
            this.setState({ menuIsOpen: nextMenuState, ...nextState });
        } else {
            this.setState({ menuIsOpen: nextMenuState });
        }
        this.props.navigation.setParams({ menuIsOpen: nextMenuState });
    };

    _fetchImages = () => {
        let preFetchTasks = [];

        this.setState({ isLoading: true, downloadSuccess: false });

        IMG_URLS.forEach(u => {
            // console.log("fetching : ", u);
            preFetchTasks.push(Image.prefetch(u));
        });

        Promise.all(preFetchTasks)
            .then(results => {
                let downloadedAll = true;
                results.forEach(result => {
                    if (!result) {
                        // console.log("Failed Result: ", result);
                        //error occurred downloading a pic
                        downloadedAll = false;
                    } /* else {
                        console.log("Success Result: ", result);
                    } */
                });

                if (downloadedAll) {
                    console.log("Downloaded all images!");
                    // const { mountTime } = this.state;

                    // Image.queryCache(IMG_URLS).then(map => {
                    //     IMG_URLS.forEach((url, i) => {
                    //         const result = map[url];
                    //         console.log("\nCache result for ", IMG_URLS[i]);
                    //         if (result) {
                    //             console.log(
                    //                 `✔ queryCache "${result}" (+${new Date() -
                    //                     mountTime}ms))`
                    //             );
                    //         } else {
                    //             console.log(
                    //                 `✘ queryCache (+${new Date() -
                    //                     mountTime}ms)`
                    //             );
                    //         }
                    //     });
                    // });

                    this.setState({ isLoading: false, downloadSuccess: true });
                    // alert("Downloed all images!");
                } else {
                    console.log("Failed to download all images");
                    this.handleImgLoadError("Failed to receive all images");
                }
            })
            .catch(e => {
                this.handleImgLoadError(e);
            });
    };

    handleImgLoadError = e => {
        this.setState({ isLoading: false, downloadSuccess: false });
        if (!this._isModal && this.state.isFirstStep) {
            alert(
                "Unable to download help documentation. Please make sure you have a Wi-Fi or Data connection."
            );
        }
        console.log(e);
    };

    nextPage = _.throttle(() => {
        console.log("next page");
        this._idx++;
        console.log(this._idx);
        if (this._idx <= IMG_URLS.length + this._welcomeOffset - 1) {
            console.log("Snapping to index: ", this._idx);
            this._interactable.snapTo({
                index: this._idx
            });
            this.setState({
                sectIdx: this._idx
            });
        } else {
            this._idx = IMG_URLS.length + this._welcomeOffset - 1;
            console.log("Not snapping. Already at final index ", this._idx);
        }
    }, 500);

    prevPage = _.throttle(() => {
        this._idx = Math.max(0, this._idx - 1);
        if (this._idx >= 0) {
            console.log(this._idx);
            this._interactable.snapTo({
                index: this._idx
            });
            this.setState({
                sectIdx: this._idx
            });
        }
    }, 500);

    setBoundaryFlag = ({ lastStep, firstStep }) => {
        // console.log("setBoundaryFlag");
        if (lastStep && this._idx == 3 + this._welcomeOffset) {
            // only set FinalStep to true if this is the last step, AND the last Page
            this.setState({ isFinalStep: true, isFirstStep: false });
        } else if (firstStep && this._idx == 0) {
            this.setState({ isFinalStep: false, isFirstStep: true });
        } else {
            if (this.state.isFinalStep || this.state.isFirstStep) {
                this.setState({ isFinalStep: false, isFirstStep: false });
            }
        }
    };

    _exitHelp = () => {
        let { navigation } = this.props;
        navigation.goBack();
        if (navigation.state.params && navigation.state.params.willExitHelp) {
            navigation.state.params.willExitHelp();
        }
    };

    _getSectionForImgIdx(targetIdx) {
        console.log("targetIdx", targetIdx);

        targetIdx -= this._welcomeOffset;

        let accumLen = 0;
        for (let section of HELP_SECTIONS) {
            accumLen += section.images.length;
            console.log("runningIdx", accumLen);
            if (targetIdx < accumLen) {
                return section;
            }
        }
    }

    _getPageIdxForSection(sectionIdx) {
        console.log("Getting pageIdx for sectionIdx", sectionIdx);

        let pageIdx = 0;
        for (let i = 0; i < sectionIdx; i++) {
            pageIdx += HELP_SECTIONS[i].images.length;
            console.log("runningIdx", pageIdx);
        }

        return pageIdx;
    }

    _jumpToSection = sectionIdx => {
        // prevent execution if menu is closed, since otherwise items can be tapped through the nav header
        if (!this.state.menuIsOpen) return;

        console.log("jumping to section ", sectionIdx);
        this._idx = this._getPageIdxForSection(sectionIdx);

        this._interactable.snapTo({
            index: this._idx
        });

        this.setMenuState(false, { sectIdx: this._idx });
    };

    renderHelpMenuItem = (section, sectionIdx) => {
        console.log("renderHelpMenuItem", section);

        return (
            <MenuItem
                key={sectionIdx}
                center={section.name}
                onPressItem={this._jumpToSection.bind(this, sectionIdx)}
                style={{
                    paddingLeft: 25
                }}
            />
        );
    };

    render() {
        // console.log("Upgrade -- render() ");

        let section = this._getSectionForImgIdx(this._idx);

        console.log("section", section);
        console.log("this._idx", this._idx);

        let idxInSect = this._idx - section.startingIdx - this._welcomeOffset;

        let subtitle;
        if (idxInSect >= 0) {
            subtitle = section.images[idxInSect].subtitle || section.subtitle;
        }

        return (
            <LinearGradient
                start={{ x: 0.0, y: 0.25 }}
                end={{ x: 0.0, y: 1.25 }}
                locations={[0, 1.0]}
                colors={["#110331", "#4B1F7A"]}
                style={{
                    flex: 1,
                    // backgroundColor: Colors.backgroundLightGrey,
                    alignContent: "stretch"
                }}
            >
                <NavigationEvents
                    onWillFocus={payload => {
                        this.setState({ isFocused: true });
                        this._fetchImages();
                    }}
                    onWillBlur={() => {
                        this.setState({ isFocused: false });
                    }}
                />
                <View
                    style={[
                        styles.sectionTitleWrap,
                        { marginTop: this._isModal ? 20 : 0 }
                    ]}
                >
                {(this._welcomeOffset == 0 || this._idx > 0) && (
                        <>
                            <Text style={styles.sectionTitle}>
                                {section.name}
                            </Text>
                        {subtitle && (
                                <Text style={styles.sectSubtitle}>
                                    {subtitle}
                                </Text>
                            )}
                        </>
                        )}
                    </View>
                <Interactable.View
                    ref={elm => (this._interactable = elm)}
                    style={{
                        flex: 0.8,
                        width:
                            SCREEN_WIDTH *
                            (IMG_URLS.length + this._welcomeOffset),
                        alignSelf: "stretch",
                        // backgroundColor: "blue",
                        // marginTop: isIphoneX() ? -88 : -64,
                        flexDirection: "row"
                    }}
                    dragToss={0.6}
                    horizontalOnly={true}
                    snapPoints={this._snapPoints}
                    animatedNativeDriver={true}
                    animatedValueX={this._bgdPosition}
                    dragEnabled={this.state.downloadSuccess}
                    onDrag={event => {
                        // console.log("onDrag");
                        let { state, y, targetSnapPointId } = event.nativeEvent;
                        if (state == "end") {
                            // console.log("onDrag end");

                            // console.log("targetSnapPointId", targetSnapPointId);
                            //     this.props.onSnap(targetSnapPointId);
                            this._idx = parseInt(targetSnapPointId);
                            // console.log("this._idx ", this._idx);

                            if (
                                this._pageRefs &&
                                this._pageRefs.length == 4 + this._welcomeOffset
                            ) {
                                // let currPageRef = this._pageRefs[this._idx];
                                // currPageRef.updateBoundaryFlags &&
                                //     currPageRef.updateBoundaryFlags();
                                // currPageRef.flashScrollIndicators &&
                                //     currPageRef.flashScrollIndicators();
                            } else {
                                console.warn("Pagerefs not working correctly.");
                                console.log(
                                    "Pageref length: ",
                                    this._pageRefs.length
                                );
                            }

                            this.setState({
                                sectIdx: this._idx
                            });
                        }
                    }}
                    initialPosition={{ x: 0 }}
                >
                    {this.state.isFocused && this._isModal && (
                        <WelcomePage
                            nextPage={this.nextPage}
                            // ref={elm => (this._pageRefs[0] = elm)}
                        />
                    )}
                    {this.state.isFocused &&
                    !this.state.isLoading &&
                    this.state.downloadSuccess ? (
                        HELP_SECTIONS.map((section, sectIdx) => {
                            return section.images.map((img, idx) => {
                                let key = sectIdx + "_" + idx;
                                return (
                                    <IntrvHelpPage
                                        // ref={elm =>
                                        //     (this._pageRefs[
                                        //         idx + this._welcomeOffset
                                        //     ] = elm)
                                        // }
                                        key={idx + this._welcomeOffset}
                                        idx={idx + this._welcomeOffset}
                                        image={img}
                                        section={section}
                                        currSectIdx={this._idx}
                                        setBoundaryFlag={this.setBoundaryFlag}
                                    />
                                );
                            });
                        })
                    ) : (
                        <View
                            style={{
                                width: SCREEN_WIDTH,
                                height: "auto",
                                alignContent: "center",
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                        >
                            {this.state.isLoading ? (
                                <ActivityIndicator style={{ flex: 1 }} />
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        padding: 10
                                    }}
                                    onPress={this._fetchImages}
                                >
                                    <Text
                                        style={{
                                            color: Colors.brandLightOpp,
                                            fontSize: 20
                                            // lineHeight: 20
                                            // textAlign: "center",
                                            // textAlignVertical: "center",
                                            // justifyContent: "center"
                                        }}
                                    >
                                        Tap to Reload
                                    </Text>
                                    <FAIcon
                                        name="refresh"
                                        color={Colors.brandLightOpp}
                                        size={15}
                                        style={{ marginLeft: 10 }}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Interactable.View>
                {this._isModal && this._idx > 0 && (
                    <Animatable.View
                        contentInsetAdjustmentBehavior="automatic"
                        useNativeDriver={true}
                        animation={"fadeIn"}
                        duration={300}
                        delay={500}
                        style={{
                            position: "absolute",
                            height: ifIphoneX(88, 64),
                            width: "100%",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            paddingBottom: 10,
                            // backgroundColor: "blue"
                            backgroundColor: "transparent"
                        }}
                    >
                        <FAIcon
                            name={"close"}
                            color={Colors.brandLightGrey}
                            underlayColor={Colors.brandDarkGrey}
                            size={24}
                            onPress={() => {
                                this._exitHelp();
                            }}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 20,
                                right: 0
                            }}
                            style={{
                                paddingLeft: 20,
                                marginRight: scaleByFactor(12, 0.9)
                            }}
                        />
                    </Animatable.View>
                )}
                <Animatable.View
                    contentInsetAdjustmentBehavior="automatic"
                    useNativeDriver={true}
                    animation={"fadeIn"}
                    duration={this._isModal ? 1500 : 0}
                    delay={this._isModal ? 4000 : 0}
                    style={{
                        justifyContent: "space-between",
                        flexDirection: "row",
                        alignSelf: "stretch",
                        width: "100%",
                        minHeight: 35,
                        paddingHorizontal: 20,
                        bottom: ifIphoneX(35, 0),
                        // backgroundColor: "red",
                        backgroundColor: "transparent",
                        fontFamily: "Gurmukhi MN",
                        fontSize: 30,
                        flex: 0.05
                    }}
                    // style={styles.playbackBox}
                >
                    {this._isModal && this._idx == 0 ? (
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                justifyContent: "center"
                            }}
                            onPress={this._exitHelp}
                        >
                            <Text style={styles.btnText}>Skip</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                justifyContent: "center"
                            }}
                            onPress={this.prevPage}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    {
                                        opacity: this._idx == 0 ? 0 : 1
                                    }
                                ]}
                            >
                                Back
                            </Text>
                        </TouchableOpacity>
                    )}
                    <PagingDots
                        dotCount={5}
                        pageCount={IMG_URLS.length + this._welcomeOffset} // TODO:
                        pageIdx={this._idx}
                    />
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "flex-end"
                        }}
                        onPress={this.nextPage}
                    >
                        <Text
                            style={[
                                styles.btnText,
                                {
                                    opacity:
                                        this._idx <
                                        IMG_URLS.length +
                                            this._welcomeOffset -
                                            1
                                            ? 1
                                            : 0
                                }
                            ]}
                        >
                            Next
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
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

                            this.setMenuState(false);
                        }}
                    />
                )}
                {!this._isModal && (
                    <Animated.View
                        style={{
                            position: "absolute",
                            top: HEADER_HEIGHT - 20, // - (isIphoneX() ? 20 : 0),
                            left: 0,
                            right: 0,
                            height: 240,
                            overflow: "hidden",
                            transform: [
                                {
                                    translateY: this.props.menuAnim.interpolate(
                                        {
                                            inputRange: [0, 1],
                                            outputRange: [
                                                -290,
                                                -HEADER_HEIGHT + 20
                                            ]
                                        }
                                    )
                                }
                            ]
                            // backgroundColor: "blue"
                        }}
                        pointerEvents="box-none"
                    >
                        {HELP_SECTIONS.map((section, sectIdx) =>
                            this.renderHelpMenuItem(section, sectIdx)
                        )}
                    </Animated.View>
                )}
            </LinearGradient>
        );
    }
}

const styles = StyleSheet.create({
    btnText: {
        color: Colors.brandLightOpp
    },
    sectionTitleWrap: {
        flex: 0.15,
        alignSelf: "center",
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center"
    },
    sectionTitle: {
        fontSize: scaleByFactor(20, 0.8),
        letterSpacing: 2,
        fontFamily: "Gurmukhi MN",
        textAlign: "center",
        color: Colors.brandLightOpp
    },
    sectSubtitle: {
        fontSize: scaleByFactor(14, 0.8),
        letterSpacing: 2,
        fontFamily: "Gurmukhi MN",
        color: Colors.brandMidOpp,
        alignSelf: "center",
        marginLeft: 5
    }
});
