import React, { Component } from "react";
import { View, StyleSheet, Animated } from "react-native";
// import { Svg } from "expo";
import Svg, { Path } from "react-native-svg";

import PropTypes from "prop-types";

import MetricsPath from "art/metrics/path";

export default class AnimatedView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            transition: new Animated.Value(0),
            ...this.init(props)
        };

        setTimeout(() => {
            this.animate(this.props.animationDuration);
        }, 0);
    }

    init(props) {
        const { path, segmentCount } = props;

        const pathMetrics = new MetricsPath(path);
        const length = pathMetrics.length;
        const segmentLength = length / segmentCount;
        const pointCount = segmentCount + 1;

        const inputRange = new Array(pointCount);
        const outputRangeX = new Array(pointCount);
        const outputRangeY = new Array(pointCount);

        for (let i = 0; i < pointCount; i++) {
            const offset = i * segmentLength;
            const { x, y } = pathMetrics.point(offset);
            inputRange[i] = i;
            outputRangeX[i] = x;
            outputRangeY[i] = y;
        }

        return {
            path,
            segmentCount,
            svgWidth: pathMetrics.right - pathMetrics.left,
            svgHeight: pathMetrics.bottom - pathMetrics.top,
            interpolationConfig: {
                translateX: {
                    inputRange,
                    outputRange: outputRangeX
                },
                translateY: {
                    inputRange,
                    outputRange: outputRangeY
                }
            }
        };
    }

    render() {
        const {
            path,
            transition,
            svgWidth,
            svgHeight,
            interpolationConfig
        } = this.state;

        const animatedStyle = {
            transform: [
                {
                    translateX: Animated.add(
                        transition.interpolate(interpolationConfig.translateX),
                        -SQUARE_WIDTH / 2 + PADDING
                    )
                },
                {
                    translateY: Animated.add(
                        transition.interpolate(interpolationConfig.translateY),
                        -SQUARE_HEIGHT / 2 + PADDING
                    )
                },
                {perspective: 1000}
            ]
        };

        return (
            <View style={styles.main}>
                <Svg height={svgHeight} width={svgWidth}>
                    <Path
                        d={path}
                        stroke="#9b59b6"
                        strokeWidth="3"
                        fill="none"
                    />
                    <Path
                        d={"M1,1 L2,1 L1.5,2 Z"}
                        stroke="#90d006"
                        strokeWidth="3"
                        fill="#90d006"
                    />
                </Svg>
                <Animated.View style={[styles.square, animatedStyle]} />
            </View>
        );
    }

    animate(duration) {
        const { transition, segmentCount } = this.state;

        Animated.timing(transition, {
            toValue: segmentCount,
            duration
        }).start(() => {
            this.state.transition.setValue(0);
        });
    }
}

AnimatedView.propTypes = {
    animationDuration: PropTypes.number.isRequired,
    segmentCount: PropTypes.number.isRequired,
    path: PropTypes.string.isRequired
};

const SQUARE_WIDTH = 10;
const SQUARE_HEIGHT = 10;
const PADDING = 10;

const styles = StyleSheet.create({
    main: {
        padding: 10
    },
    square: {
        backgroundColor: "red",
        position: "absolute",
        width: SQUARE_WIDTH,
        height: SQUARE_HEIGHT
    }
});
