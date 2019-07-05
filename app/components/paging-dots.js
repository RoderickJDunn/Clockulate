import React, { Component } from "react";
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
    ScrollView,
    Easing
} from "react-native";
import _ from "lodash";

// import * as Animatable from "react-native-animatable";

import Colors from "../styles/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FADED_STATES = {
    NONE: 0,
    FULL: 1
};
// const DEFAULT_DURATION = 1000; // ms DEV: should be 250
const DEFAULT_DURATION = 250; // ms

// console.log("STEP_HEIGHT", STEP_HEIGHT);
export default class PagingDots extends Component {
    _xTranslateAnim = new Animated.Value(0);
    _jumpAnim = new Animated.Value(0);

    constructor(props) {
        super(props);

        if (props.pageCount > props.dotCount) {
            if (props.dotCount % 2 == 0)
                console.error(
                    "DotCount must be odd number if pageCount>dotCount"
                );
        }

        this.state = {
            dotCount: props.dotCount,
            pageCount: props.pageCount,
            /* The pageIdx, below which the activeDot moves when pageIdx changes */
            motionRangeL: Math.trunc(props.dotCount / 2),
            /* The pageIdx, above which the activeDot moves when pageIdx changes */
            motionRangeH: props.pageCount - Math.trunc(props.dotCount / 2),
            pageIdx: props.pageIdx,
            activeDotIdx: props.pageIdx
        };

        /***** define all opacity interpolations *****/

        /* Out-of-bounds animations (the 2 extra views, in addition to dotCount)*/
        // Left-OOB <-> Left-edge, 0 <-> 0.2  (-17 <-> 0)
        this._animOobFullL = this._xTranslateAnim.interpolate({
            inputRange: [0, 17],
            outputRange: [0, 0.2]
        });

        // Right-OOB <-> Right-edge, 0.2 <-> 0 (0 <-> 17)
        this._animOobFullR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0],
            outputRange: [0.2, 0]
        });

        this._animOobTransL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 0.2, 1]
        });

        // Right-OOB <-> Right-edge, 0.2 <-> 0 (0 <-> 17)
        this._animOobTransR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 0.2, 1]
        });

        // Left-OOB <-> Left-edge, 0 <-> 0.2  (-17 <-> 0)
        this._animOobEndL = this._xTranslateAnim.interpolate({
            inputRange: [0, 17],
            outputRange: [0, 1]
        });

        // Right-OOB <-> Right-edge, 0.2 <-> 0 (0 <-> 17)
        this._animOobEndR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0],
            outputRange: [1, 0]
        });

        /* Edge animations */
        // Left-edge (0) <-> (idx 1), 0.2 <-> 0.5 (-17 <-> 0) -- for when pageIdx stays within STILL_RANGE
        this._animEdgeFullL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0, 0.2, 0.5]
        });

        // Right-edge (DC - 1) <-> (DC - 2), 0.2 <-> 0.5 (0 <-> 17) -- for when pageIdx stays within STILL_RANGE
        this._animEdgeFullR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.5, 0.2, 0]
        });

        this._animEdgeTransL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.5, 0.2, 1]
        });

        // Right-OOB <-> Right-edge, 0.2 <-> 0 (0 <-> 17)
        this._animEdgeTransR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 0.2, 0.5]
        });

        // Left-edge (0) <-> (idx 1), 0.5 <-> 0.8 (-17 <-> 0) -- for when pageIdx exits/enters STILL_RANGE
        this._animEdgeEndL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0],
            outputRange: [0, 1]
        });

        // Right-edge (DC - 1) <-> (DC - 2), 0.8 <-> 0.5 (0 <-> 17) -- for when pageIdx exits/enters STILL_RANGE
        this._animEdgeEndR = this._xTranslateAnim.interpolate({
            inputRange: [0, 17],
            outputRange: [1, 0]
        });

        /* Animations for dots adjecent to edge (idx 1 or dotCount-2) */

        // (Idx 1) <-> (idx 2), 0.5 <-> 1 (0 <-> 17) -- for when pageIdx stays within STILL_RANGE
        this._animAdjFullL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.2, 0.5, 1]
        });

        // (DC - 2) <-> (DC - 3), 0.5 <-> 1 (17 <-> 0) -- for when pageIdx stays within STILL_RANGE
        this._animAdjFullR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 0.5, 0.2]
        });

        this._animAdjTransL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.2, 0.5, 1]
        });

        // Right-OOB <-> Right-edge, 0.2 <-> 0 (0 <-> 17)
        this._animAdjTransR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 0.5, 0.2]
        });

        this._animAdjEndL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.2, 1, 1]
        });

        // (DC - 2) <-> (DC - 3), 0.8 <-> 1 (17 <-> 0) -- for when pageIdx exits/enters STILL_RANGE
        this._animAdjEndR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 1, 0.2]
        });

        /* Animations for dots 2 from the edge (idx 2 or dotCount-3) (the center dot when dotCount==5) */
        // NOTE: If there are only 5 dots, these need to be applied to a dot created 'behind' the active dot
        //       If there are >5 dots, then these must be applied to the dots 3rd from the edges
        this._animMidFullL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.5, 1, 1]
        });

        // (DC - 2) <-> (DC - 3), 0.5 <-> 1 (17 <-> 0) -- for when pageIdx stays within STILL_RANGE
        this._animMidFullR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 1, 0.5]
        });

        this._animMidTransL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.5, 1, 0.5]
        });

        // Right-OOB <-> Right-edge, 0.2 <-> 0 (0 <-> 17)
        this._animMidTransR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.5, 1, 0.5]
        });

        // (Idx 1) <-> (idx 2), 0.8 <-> 1 (0 <-> 17) -- for when pageIdx exits/enters STILL_RANGE
        this._animMidEndL = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [0.5, 1, 1]
        });

        // (DC - 2) <-> (DC - 3), 0.8 <-> 1 (17 <-> 0) -- for when pageIdx exits/enters STILL_RANGE
        this._animMidEndR = this._xTranslateAnim.interpolate({
            inputRange: [-17, 0, 17],
            outputRange: [1, 1, 0.5]
        });

        console.log("PageingDots initial state: ", this.state);
    }

    static getMidDotIdx(dotCount) {
        return Math.trunc(dotCount / 2);
    }

    static calcNextActiveDotIdx(prevPageIdx, newPageIdx, state) {
        // This assumes pageIdx can only change by 1 (either direction)

        let pageDiff = prevPageIdx - newPageIdx;
        let { dotCount, pageCount, motionRangeH, motionRangeL } = state;

        if (pageDiff == 0) {
            return state.activeDotIdx; // return current idx, it doesn't need to change
        } else if (Math.abs(pageDiff) > 1) {
            console.info("Page idx changed by >1. May not work correctly.");
            pageDiff = pageDiff > 0 ? 1 : -1;
            // return 0; // FIXME: Recover from this error
        } else if (
            prevPageIdx < 0 ||
            prevPageIdx >= pageCount ||
            newPageIdx < 0 ||
            newPageIdx >= pageCount
        ) {
            console.error(
                `Index error. prevPageIdx==${prevPageIdx}   newPageidx==${newPageIdx}`
            );
        }

        // NOTE: There is a simpler way of doing this with far fewer checks if I only cared about what
        //          the final value activeDotIdx. However, I may want to add transition animations,
        //          in which case the prev/new logic below is needed to determine what type of animation
        //          should play.

        let activeDotIdx = 0;
        let xTransRequired = 0;

        if (prevPageIdx < motionRangeL) {
            if (newPageIdx < motionRangeL) {
                // page has changed within motionRangeL
                activeDotIdx = newPageIdx;
            } else if (newPageIdx <= motionRangeH) {
                // page has changed from motionRangeL into STILL_RANGE
                activeDotIdx = PagingDots.getMidDotIdx(dotCount);
            } else {
                console.error(
                    `Invalid newPageIdx [${newPageIdx}], for prevPageIdx [${prevPageIdx}]`
                );
            }
        } else if (prevPageIdx < motionRangeH) {
            // prevPage was in STILL_RANGE
            if (newPageIdx < motionRangeL) {
                // page has moved from STILL_RANGE to motionRangeL
                activeDotIdx = newPageIdx;
            } else if (newPageIdx < motionRangeH) {
                // page has changed within STILL_RANGE
                activeDotIdx = PagingDots.getMidDotIdx(dotCount);
                xTransRequired = pageDiff; // translate X left or right depending if pageDiff is -/+
            } else if (newPageIdx < pageCount) {
                // page has changed from STILL_RANGE to motionRangeH
                activeDotIdx = dotCount - (pageCount - newPageIdx);
            } else {
                // ERROR: Outside pageCount boundary....
                console.error("Invalid newPageidx [${newPageIdx}]");
            }
        } else if (prevPageIdx < pageCount) {
            // prevPage was in
            if (newPageIdx >= motionRangeH) {
                // page has moved within motionRangeH
                activeDotIdx = dotCount - (pageCount - newPageIdx);
            } else if (newPageIdx < motionRangeH) {
                // page has changed from motionRangeH to STILL_RANGE
                activeDotIdx = PagingDots.getMidDotIdx(dotCount);
            } else {
                console.error(
                    `Invalid newPageIdx [${newPageIdx}], for prevPageIdx [${prevPageIdx}]`
                );
            }
        } else {
            console.error(
                `Invalid prevPageIdx (${prevPageIdx}). Should never happen`
            );
        }

        // DEV: Extra checks to die early
        if (activeDotIdx < 0 || activeDotIdx > pageCount - 1) {
            console.error(
                `Failed to calculated activeDotIdx. Got: ${activeDotIdx}`
            );
        }

        console.log("Calc'd activeDotIdx: ", activeDotIdx);
        console.log("xTransRequired: ", xTransRequired);

        return {
            activeDotIdx: activeDotIdx,
            xTransRequired: xTransRequired
        };
    }

    static getDerivedStateFromProps(nextProps, state) {
        console.log("getDerivedStateFromProps");
        // TODO: If dotCount/pageCount we need to handle that before the next step.

        console.log("old State", state);

        let upcomingState = PagingDots.calcNextActiveDotIdx(
            state.pageIdx,
            nextProps.pageIdx,
            state
        );

        console.log("upcomingState", upcomingState);

        if (upcomingState.xTransRequired) {
            return {
                xTransRequired: upcomingState.xTransRequired,
                // Temporary stores of the next activeDotIdx and next pageIdx, to be applied to permanent state vars after animation completes
                upcomingPageIdx: nextProps.pageIdx,
                upcomingActDotIdx: upcomingState.activeDotIdx
            };
        } else {
            return {
                pageIdx: nextProps.pageIdx,
                ...upcomingState
            };
        }
    }

    // TODO: Desired behavior/design
    // DEFS
    //  CURRENT_PAGE    -- The page index of the InteractableView that the user is currently viewing
    //  ACTIVE_DOT      -- solid dot that represents the current page
    //  X               -- The number of dots being displayed to represent page navigation (assuming X >= 5, and an odd # of dots)
    //  DOTS            -- A group of X dots that represent a subset of X pages of the InteractableView.
    //  ACTV_DOT_IDX    -- The index of the ACTIVE_DOT, within the group of DOTS
    //  FADED_DOT       -- partially tranparent dot, that appears at the second-most right/left positions, but only when there are other pages
    //                      beyond the corresponding end. For example, the 2nd dot should only be a FADED_DOT if the current idx position is > 2.
    //                      If position is 0/1/2, then all pages on the left are currently represented by the visable dots.
    //  FADED_EDGE_DOT  -- a very transparent dot, that appears at the ends of the group (ie. the first and last dot *may* be FADED_EDGE_DOTS).
    //                      As with FADED_DOTS, edge dots should only be faded if there are additional pages not currently being represented
    //                      by the dots group.
    //  PAGE_COUNT      -- Total number of pages in the InteractableView
    //  STILL_RANGE     -- The range within PAGE_COUNT, where the ACTV_DOT_IDX is the median of 0 and X. ie) The range where the ACTIVE_DOT
    //                      remains in the very center.
    //      _MIN        -- The lowest value of STILL_RANGE
    //      _MAX        -- The highest value of STILL_RANGE
    //  MOTION_RANGE_L  -- The lower range within PAGE_COUNT where the ACTV_DOT_IDX can change, as it is approaching the start of the list
    //  MOTION_RANGE_H  -- The upper range within PAGE_COUNT where the ACTV_DOT_IDX can change, as it is approaching the end of the list

    // 1. CURRENT_PAGE in     :   ACTIVE_DOT_IDX == CURRENT_PAGE
    //      MOTION_RANGE_L          Dots on the left are NOT faded
    //                              The last 2 dots on the right can be "faded out", if there are > X pages in total
    //                              Eg) X == 7, PAGE_COUNT >= 7, CURRENT_PAGE = 0/1/2/3
    //      --Examples--
    //      CURRENT_PAGE == 0 :   ACTIVE_DOT on left edge (there should be no dots to its left), and its not faded.
    //                              The second dot is also NOT faded (since there are no additional pages to represent on the left)
    //                              The last 2 dots on the right can be "faded out", if there are > X pages in total
    //      CURRENT_PAGE == 1 :   ACTIVE_DOT at idx 1 (there should be 1 dot to its left).
    //                              Neither the edge dot, or ACTIVE_DOT are faded
    //                              The last 2 dots on the right can be "faded out", if there are > X pages in total
    //      CURRENT_PAGE == 2 :   ACTIVE_DOT at idx 2  (there should be 2 dots to its left)
    //                              No dots on the left are faded
    //                              The last 2 dots on the right can be "faded out", if there are > X pages in total
    //
    // 2. CURRENT_PAGE in     :   ACTIVE_DOT in center (ACTV_DOT_IDX == truncate(X / 2))
    //      STILL_RANGE             When the page changes within the STILL_RANGE, I need an animation to demonstrate page movement, but the dot still
    //                                  needs to end up in the centers
    //                              The FADED_EDGE_DOT and FADED_DOT should be showing at both ends, indicating that there are additional
    //                                  unrepresented pages
    //                              Eg) X == 5, PAGE_COUNT == 10, CURRENT_PAGE = 2/3/4/5/6/7
    //                              Eg) X == 7, PAGE_COUNT == 10, CURRENT_PAGE = 3/4/5/6
    //                                     --> Since there are 7 dots, the dot at idx 3 (middle) will be active when CURRENT_PAGE is in STILL_RANGE.
    //                                          Since there are 10 total pages, there are
    //                                          0/1/2 are the first three dots, and 7/8/9 are the last three
    //
    // 3. CURRENT_PAGE     :   ACTIVE_DOT_IDX == X - (PAGE_COUNT - CURRENT_PAGE)
    //      in MOTION_RANGE_H       Dots on the left are faded (@ idx's 0/1), if PAGE_COUNT > X
    //                              Dots on right are NOT faded
    //
    //

    // componentDidUpdate() {
    //     let { xTransRequired } = this.state;
    //     if (xTransRequired) {
    //         Animated.timing(this._xTranslateAnim, {
    //             toValue: 17 * xTransRequired,
    //             duration: DEFAULT_DURATION,
    //             easing: Easing.inOut(Easing.ease),
    //             useNativeDriver: true
    //         }).start(() => {
    //             this._xTranslateAnim.setValue(0);
    //         });
    //         Animated.timing(this._jumpAnim, {
    //             toValue: 17 * xTransRequired,
    //             duration: DEFAULT_DURATION,
    //             easing: Easing.bezier(0.13, 0.62, 0.87, 0.36),
    //             useNativeDriver: true
    //         }).start(() => {
    //             this._jumpAnim.setValue(0);
    //         });
    //     }
    // }

    shouldComponentUpdate(nextProps, nextState) {
        let { xTransRequired } = nextState;
        if (xTransRequired) {
            Animated.timing(this._xTranslateAnim, {
                toValue: 17 * xTransRequired,
                duration: DEFAULT_DURATION,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true
            }).start(() => {
                this._xTranslateAnim.setValue(0);
                this.setState({
                    pageIdx: nextState.upcomingPageIdx,
                    activeDotIdx: nextState.upcomingActDotIdx,
                    xTransRequired: false
                });
            });
            Animated.timing(this._jumpAnim, {
                toValue: 17 * xTransRequired,
                duration: DEFAULT_DURATION,
                easing: Easing.bezier(0.13, 0.62, 0.87, 0.36),
                useNativeDriver: true
            }).start(() => {
                this._jumpAnim.setValue(0);
            });

            return false;
        }
        return true;
    }

    render() {
        let { dotCount } = this.props;
        let { pageIdx, activeDotIdx, pageCount } = this.state;
        let leftEdgeFaded, rightEdgeFaded;

        let leftOobAnim, rightOobAnim;
        let leftEdgeAnim, rightEdgeAnim;
        let leftAdjAnim, rightAdjAnim;
        let leftMidAnim, rightMidAnim;

        console.log("render() this.state", this.state);

        // FIXME: I need to rethink this if/else logic... change it to the following
        //  For simplicity, say dotCount==5 and PageCount==10
        //     if pageIdx>3,
        //          --> activeDotIdx==2 (mid),
        //          --> central dot must
        if (pageIdx == 3) {
            // This is a special case where the EdgeL and OobL must be able to animate
            //  to opacity==1 (This is because if BACK is pushed, that will cause the dots to be
            //  scrolled to the LEFT as far as possible.)
            leftOobAnim = this._animOobTransL;
            leftEdgeAnim = this._animEdgeTransL;
            leftAdjAnim = this._animAdjTransL;
            leftMidAnim = this._animMidTransL;
        } else if (pageIdx > Math.trunc(dotCount / 2)) {
            console.log("Faded State == FULL");
            leftEdgeFaded = FADED_STATES.FULL;
            leftOobAnim = this._animOobFullL;
            leftEdgeAnim = this._animEdgeFullL;
            leftAdjAnim = this._animAdjFullL;
            leftMidAnim = this._animMidFullL;
        } else {
            console.log("Faded State == NONE");
            leftEdgeFaded = FADED_STATES.NONE;
            leftOobAnim = this._animOobEndL;
            leftEdgeAnim = this._animEdgeEndL;
            leftAdjAnim = this._animAdjEndL;
            leftMidAnim = this._animMidEndL; // no END anim required for dot @ mid position, so just set to Half
        }

        if (pageIdx == pageCount - 4) {
            rightOobAnim = this._animOobTransR;
            rightEdgeAnim = this._animEdgeTransR;
            rightAdjAnim = this._animAdjTransR;
            rightMidAnim = this._animMidTransR;
        } else if (pageIdx < pageCount - Math.trunc(dotCount / 2) - 1) {
            rightEdgeFaded = FADED_STATES.FULL;
            rightOobAnim = this._animOobFullR;
            rightEdgeAnim = this._animEdgeFullR;
            rightAdjAnim = this._animAdjFullR;
            rightMidAnim = this._animMidFullR;
        } else {
            rightEdgeFaded = FADED_STATES.NONE;
            rightOobAnim = this._animOobEndR;
            rightEdgeAnim = this._animEdgeEndR;
            rightAdjAnim = this._animAdjEndR;
            rightMidAnim = this._animMidEndR; // no END anim required for dot @ mid position, so just set to Half
        }

        return (
            <View
                style={[
                    styles.pagingDotsWrapper,
                    {
                        width: 17 * dotCount + 3 // add 3 extra for active dot
                    }
                ]}
            >
                <Animated.View
                    style={[
                        styles.pagingDotsCont,
                        {
                            transform: [
                                {
                                    translateX: this._xTranslateAnim
                                }
                            ]
                        }
                    ]}
                >
                    <Animated.View
                        key={"edgeL"}
                        style={[
                            styles.pageDot,
                            {
                                opacity: leftOobAnim
                            }
                        ]}
                    />
                    {_.times(dotCount, i => {
                        let extraStyle;
                        if (activeDotIdx == i) {
                            return (
                                <View
                                    key={i}
                                    style={{ justifyContent: "center" }}
                                >
                                    {dotCount == 5 ? (
                                        <Animated.View
                                            style={[
                                                styles.pageDot,
                                                {
                                                    opacity: leftMidAnim
                                                }
                                            ]}
                                        />
                                    ) : (
                                        <View style={styles.pageDot} />
                                    )}
                                    <Animated.View
                                        style={[
                                            styles.pageDot,
                                            styles.pageDotActive,
                                            {
                                                transform: [
                                                    {
                                                        translateX: this._xTranslateAnim.interpolate(
                                                            {
                                                                inputRange: [
                                                                    -1,
                                                                    0,
                                                                    1
                                                                ],
                                                                outputRange: [
                                                                    1,
                                                                    0,
                                                                    -1
                                                                ]
                                                            }
                                                        )
                                                    },
                                                    {
                                                        translateY: this._jumpAnim.interpolate(
                                                            {
                                                                inputRange: [
                                                                    -17,
                                                                    -8,
                                                                    0,
                                                                    8,
                                                                    17
                                                                ],
                                                                outputRange: [
                                                                    0,
                                                                    -10,
                                                                    0,
                                                                    -10,
                                                                    0
                                                                ]
                                                            }
                                                        )
                                                    }
                                                ]
                                            }
                                        ]}
                                    />
                                </View>
                            );
                        } else if (i < 2) {
                            extraStyle =
                                i == 1
                                    ? { opacity: leftAdjAnim }
                                    : { opacity: leftEdgeAnim };
                        } else if (i >= dotCount - 2) {
                            extraStyle =
                                i == dotCount - 2
                                    ? { opacity: rightAdjAnim }
                                    : { opacity: rightEdgeAnim };
                        }

                        return (
                            <Animated.View
                                key={i}
                                style={[styles.pageDot, extraStyle]}
                            />
                        );
                    })}
                    <Animated.View
                        key={"edgeR"}
                        style={[
                            styles.pageDot,
                            {
                                opacity: rightOobAnim
                            }
                        ]}
                    />
                </Animated.View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    pagingDotsWrapper: {
        alignSelf: "center",
        alignContent: "center",
        justifyContent: "center",
        height: 40,
        overflow: "hidden"
        // backgroundColor: "yellow"
    },
    pagingDotsCont: {
        height: 20,
        flexDirection: "row",
        alignSelf: "center"
        // alignContent: "center",
        // backgroundColor: "red"
        // justifyContent: "center"
    },
    pageDot: {
        height: 7,
        width: 7,
        borderRadius: 7,
        alignSelf: "center",
        backgroundColor: "#989898",
        marginHorizontal: 5,
        alignContent: "center",
        justifyContent: "center"
    },
    pageDotActive: {
        height: 10,
        width: 10,
        borderRadius: 7,
        position: "absolute",
        backgroundColor: "#BABABA"
    }
});
