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
    ActivityIndicator
} from "react-native";
import { Header, NavigationEvents } from "react-navigation";
import LinearGradient from "react-native-linear-gradient";
import Interactable from "react-native-interactable";
import FAIcon from "react-native-vector-icons/FontAwesome";
import AutoHeightImage from "react-native-auto-height-image";
import * as Animatable from "react-native-animatable";

import { getFullImgNameForPxDensity } from "../img/image_map";
import Colors from "../styles/colors";
import ClkAlert from "../components/clk-awesome-alert";
import IntrvHelpPage from "../components/intrv-help-page";
import MiscStorage from "../config/misc_storage";
import WelcomePage from "../components/welcome-page";

import { scaleByFactor } from "../util/font-scale";
import { isIphoneX, ifIphoneX } from "react-native-iphone-x-helper";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADER_HEIGHT = Header.HEIGHT; // + STATUS_BAR_HEIGHT;

const HELPPAGE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;

let HELP_SECTIONS = [
    {
        name: "Alarms List",
        images: [
            {
                path: "AlarmItem_final_step0",
                style: { marginBottom: 5 }
            },
            {
                path: "AlarmItem_final_step1",
                style: { marginBottom: 5 },
                sharePageWithNext: 1
            },
            {
                path: "AlarmItem_final_step2",
                style: { paddingBottom: 0 },
                sharedWithPrev: true,
                // NOTE: Aspect ratio is required when sharedWithPrev=true, since AutoHeightImage
                //       determines the height of the image asynchronously, so LayoutAnimation
                //       doesn't work when the image appears
                aspectRatio: 664 / 454
            },
            {
                path: "AlarmItem_final_step3",
                style: null
            },
            {
                path: "AlarmItem_final_step4",
                style: null
            }
        ],
        pageCount: 4, // different from image count, due to images 2/3 sharing a page
        snapOffsets: [SCREEN_HEIGHT * 0.6, SCREEN_HEIGHT]
    },
    {
        name: "Edit Alarm",
        subtitle: "How it Works", // "Overview",
        images: [
            {
                path: "AlarmDetail_final_step1",
                style: { paddingVertical: SCREEN_HEIGHT * 0.05 }
            },
            {
                path: "AlarmDetail_final_step2",
                style: null
            },
            {
                path: "AlarmDetail_final_step3",
                style: null
            },
            {
                path: "AlarmDetail_final_step4",
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
        name: "Edit Alarm",
        subtitle: "Tasks",
        images: [
            {
                path: "ADTasks_final_step1",
                style: null
            },
            {
                path: "ADTasks_final_step2",
                style: null
            },
            {
                path: "ADTasks_final_step3",
                style: null
            },
            {
                path: "ADTasks_final_step4",
                style: null
            }
        ],
        pageCount: 4
    },
    {
        name: "Edit Alarm",
        subtitle: "Modes",
        images: [
            {
                path: "ADModes_final_step1",
                style: { paddingVertical: SCREEN_HEIGHT * 0.14 }
            },
            {
                path: "ADModes_final_step2",
                style: { paddingVertical: SCREEN_HEIGHT * 0.28 }
            }
        ],
        pageCount: 2,
        isFinalSect: true
    }
];

let IMG_URLS = HELP_SECTIONS.reduce((accum, sect) => {
    let sectImgUrls = sect.images.map(img =>
        getFullImgNameForPxDensity(img.path)
    );

    accum.push(...sectImgUrls);
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
            isFocused: true
        };

        this._snapPoints = [
            { x: 0, id: "0" },
            { x: -SCREEN_WIDTH, id: "1" },
            { x: -SCREEN_WIDTH * 2, id: "2" },
            { x: -SCREEN_WIDTH * 3, id: "3" }
        ];

        if (this.props.screenType == "modal") {
            this._isModal = true;
            this._welcomeOffset = 1;
            this._snapPoints.push({ x: -SCREEN_WIDTH * 4, id: "4" });
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
            toggleInfoPopup: this.toggleInfoPopup
        });
        if (MiscStorage.visitedHelp !== true) {
            MiscStorage.setVistedHelp(true);
            // setTimeout(this.toggleInfoPopup, 500);
        }
    }

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

    toggleInfoPopup = () => {
        let { showInfoPopup } = this.state;
        this.setState({ showInfoPopup: !showInfoPopup });
    };

    _nextStep = () => {
        if (
            this._pageRefs &&
            this._pageRefs.length == 4 + this._welcomeOffset
        ) {
            let currPageRef = this._pageRefs[this._idx];

            if (!currPageRef) {
                alert(
                    "Unable to download help documentation. Please make sure you have a Wi-Fi or Data connection."
                );
                return; // can occur if Help images do not load
            }

            if (!currPageRef.nextStep()) {
                this.goToNextSect();
            }
        } else {
            console.warn("Pagerefs not working correctly.");
            console.log("Pageref length: ", this._pageRefs.length);
        }
    };

    _prevStep = () => {
        if (
            this._pageRefs &&
            this._pageRefs.length == 4 + this._welcomeOffset
        ) {
            let currPageRef = this._pageRefs[this._idx];

            if (!currPageRef) {
                return; // can occur if Help images do not load
            }

            if (!currPageRef.prevStep()) {
                this.goToPrevSect();
            }
        } else {
            console.warn("Pagerefs not working correctly.");
            console.log("Pageref length: ", this._pageRefs.length);
        }
    };

    goToNextSect = () => {
        console.log("next section");
        this._idx++;
        console.log(this._idx);
        if (this._idx <= 3 + this._welcomeOffset) {
            this._interactable.snapTo({
                index: this._idx
            });
            this.setState({
                sectIdx: this._idx
            });
        } else {
            this._idx = 3 + this._welcomeOffset;
        }
    };

    goToPrevSect = () => {
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
    };

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

    _renderPagingDots = idx => {
        // console.log("idx", idx);
        return (
            <View style={styles.pagingDotsCont}>
                <View
                    style={[styles.pageDot, idx == 0 && styles.pageDotActive]}
                />
                <View
                    style={[styles.pageDot, idx == 1 && styles.pageDotActive]}
                />
                <View
                    style={[styles.pageDot, idx == 2 && styles.pageDotActive]}
                />
                <View
                    style={[styles.pageDot, idx == 3 && styles.pageDotActive]}
                />
                {this._isModal && (
                    <View
                        style={[
                            styles.pageDot,
                            idx == 4 && styles.pageDotActive
                        ]}
                    />
                )}
            </View>
        );
    };

    render() {
        // console.log("Upgrade -- render() ");
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
                <Interactable.View
                    ref={elm => (this._interactable = elm)}
                    style={{
                        flex: 1,
                        width: SCREEN_WIDTH * (4 + this._welcomeOffset),
                        alignSelf: "stretch",
                        // marginTop: isIphoneX() ? -88 : -64,
                        flexDirection: "row"
                        // backgroundColor: "green"
                    }}
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
                                let currPageRef = this._pageRefs[this._idx];
                                currPageRef.updateBoundaryFlags &&
                                    currPageRef.updateBoundaryFlags();
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
                            goToNextSect={this.goToNextSect}
                            ref={elm => (this._pageRefs[0] = elm)}
                        />
                    )}
                    {this.state.isFocused &&
                    !this.state.isLoading &&
                    this.state.downloadSuccess ? (
                        HELP_SECTIONS.map((section, idx) => {
                            return (
                                <IntrvHelpPage
                                    ref={elm =>
                                        (this._pageRefs[
                                            idx + this._welcomeOffset
                                        ] = elm)
                                    }
                                    key={idx + this._welcomeOffset}
                                    idx={idx + this._welcomeOffset}
                                    sectionInfo={section}
                                    currSectIdx={this._idx}
                                    setBoundaryFlag={this.setBoundaryFlag}
                                />
                            );
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
                        <FAIcon
                            name={"info"}
                            color={Colors.brandLightGrey}
                            underlayColor={Colors.brandDarkGrey}
                            size={24}
                            onPress={() => {
                                // ClKAlert -- how to use Help
                                this.toggleInfoPopup();
                            }}
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 20,
                                right: 0
                            }}
                            style={{
                                paddingRight: 20,
                                marginLeft: scaleByFactor(12, 0.9)
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
                        position: "absolute",
                        justifyContent: "space-between",
                        flexDirection: "row",
                        alignSelf: "stretch",
                        width: "100%",
                        height: 45,
                        paddingHorizontal: 20,
                        bottom: ifIphoneX(35, 20),
                        backgroundColor: "transparent",
                        fontFamily: "Gurmukhi MN",
                        fontSize: 30
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
                            onPress={this._prevStep}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    {
                                        opacity: this.state.isFirstStep ? 0 : 1
                                    }
                                ]}
                            >
                                Back
                            </Text>
                        </TouchableOpacity>
                    )}
                    {this._renderPagingDots(this._idx)}
                    <TouchableOpacity
                        style={{
                            flex: 1,
                            justifyContent: "center",
                            alignItems: "flex-end"
                        }}
                        onPress={this._nextStep}
                    >
                        <Text
                            style={[
                                styles.btnText,
                                {
                                    opacity: this.state.isFinalStep ? 0 : 1
                                }
                            ]}
                        >
                            Next
                        </Text>
                    </TouchableOpacity>
                </Animatable.View>
                {this.state.showInfoPopup && (
                    <ClkAlert
                        contHeight={"mid"}
                        headerIcon={
                            <FAIcon
                                name="info"
                                size={33}
                                color={Colors.brandLightPurple}
                            />
                        }
                        title="Quick Tip"
                        headerTextStyle={{ color: Colors.brandLightOpp }}
                        bodyText={`Tap anywhere to reveal the next tip for this section.\nSwipe left/right to jump between sections`}
                        dismissConfig={{
                            onPress: () => {
                                console.log("Dismissed Info popup");
                                this.setState({ showInfoPopup: false });
                            },
                            text: "Got it!"
                        }}
                        // confirmConfig={{
                        //     onPress: () => {
                        //         console.log(
                        //             "Confirmed Upgrade popup: Going to Upgrades screen"
                        //         );
                        //         this.setState({ showUpgradePopup: false });
                        //         this.props.navigation.navigate("Upgrade");
                        //     },
                        //     text: "Go to Upgrades"
                        // }}
                    />
                )}
            </LinearGradient>
        );
    }
}

const styles = StyleSheet.create({
    pagingDotsCont: {
        height: 20,
        flexDirection: "row",
        alignSelf: "center",
        alignContent: "center",
        // backgroundColor: "blue",
        justifyContent: "center"
    },
    pageDot: {
        height: 7,
        width: 7,
        borderRadius: 7,
        alignSelf: "center",
        backgroundColor: "#989898",
        marginHorizontal: 5
    },
    pageDotActive: {
        height: 10,
        width: 10,
        borderRadius: 7,
        backgroundColor: "#BABABA"
    },
    btnText: {
        color: Colors.brandLightOpp
    }
});
