/**
 * Created by rdunn on 2017-08-07.
 */
import React, { Component } from "react";
import { StyleSheet, Animated, View, Dimensions, Easing } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";

import { scale, scaleByFactor } from "../util/font-scale";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

class EdgeSwiper extends Component {
    constructor(props) {
        super(props);
        // if (!props.handleTextInput) {
        //     console.error("Prop 'handleTextInput' is required!");
        // }
        this.state = {
            stGestureHandlerEnabled: true
        };

        this._onGestureStateChanged = this._onGestureStateChanged.bind(this);
    }

    _onGestureStateChanged({ nativeEvent }) {
        console.log("_onGestureStateChanged");
        if (nativeEvent.state != State.END) {
            return;
        }
        if (nativeEvent.translationX > -45 && nativeEvent.velocityX > -800) {
            // console.log(
            //     "Translation too small or velocity too slow. Snapping back"
            // );
            // Animated.spring back to 0
            Animated.spring(this.props.animValue, {
                toValue: 0,
                tension: 300,
                friction: 11,
                useNativeDriver: true
            }).start();
        } else {
            this.setState({ stGestureHandlerEnabled: false });

            // translationX is less than -70, finish the flip (Animated.spring to 1)
            Animated.timing(this.props.animValue, {
                toValue: -230,
                duration: 200,
                easing: Easing.bounce,
                useNativeDriver: true
            }).start(() => {
                this.setState({ stGestureHandlerEnabled: true });
                this.props.animValue.setValue(0);
                this.props.onAnimComplete();
            });
        }
    }

    render() {
        console.log("render", "EdgeSwiper");
        // console.log("render labeledInput");
        // console.log("this.state.inputText", this.state.inputText);
        // console.log("this.props.fieldText", this.props.fieldText);

        return (
            <PanGestureHandler
                ref={el => (this.startTimesPanRef = el)}
                onGestureEvent={Animated.event(
                    [
                        {
                            nativeEvent: {
                                translationX: this.props.animValue
                            }
                        }
                    ]
                    // { useNativeDriver: true }
                )}
                shouldCancelWhenOutside={false}
                onHandlerStateChange={this._onGestureStateChanged}
                minDist={1}
                enabled={this.state.stGestureHandlerEnabled}
            >
                {/* <-- NEEDS TO BE Animated.View for PanGestureHandler*/}
                <Animated.View
                    style={[
                        // StyleSheet.absoluteFill,
                        {
                            position: "absolute",
                            // right: 0,
                            left: SCREEN_WIDTH - 30,
                            // left: 0,
                            // top: 173,
                            top: 50,
                            bottom: 0,
                            width: 230,
                            // paddingBottom: scaleByFactor(10, 0.4),

                            // paddingVertical: scaleByFactor(10, 0.4)
                            backgroundColor: "transparent"
                            // backgroundColor: "red"
                            // borderRadius: 10
                            // backgroundColor: Colors.brandDarkGrey
                        }
                    ]}
                    shouldRasterizeIOS={true}
                    renderToHardwareTextureAndroid={true}
                />
            </PanGestureHandler>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.5,
        alignSelf: "stretch",
        justifyContent: "center",
        paddingTop: scale(3)
    },
    fieldLabelText: {
        // paddingBottom: 0,
        backgroundColor: "transparent"
    },
    fieldText: {
        fontSize: scaleByFactor(25, 0.7)
    }
});

export default EdgeSwiper;
