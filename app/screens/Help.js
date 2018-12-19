import React from "react";
import {
    View,
    TouchableOpacity,
    Dimensions,
    Switch,
    TouchableWithoutFeedback,
    StyleSheet
} from "react-native";

import Svg, {
    Circle,
    Ellipse,
    G,
    TSpan,
    TextPath,
    Polygon,
    Polyline,
    Line,
    Rect,
    Use,
    Image,
    Symbol,
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    ClipPath,
    Pattern,
    Mask,
    Text
} from "react-native-svg";

const points = [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 }
];

const colors = ["red", "blue", "green", "yellow", "purple"];

// TODO: Intro/Tutorial
export default class Help extends React.Component {
    /*
    Props: 
     */

    width = Dimensions.get("window").width; //full width
    height = Dimensions.get("window").height; //full height

    renderGradient(c1, c2, p1, p2) {
        const x1 = p1.x,
            y1 = p1.y,
            x2 = p2.x,
            y2 = p2.y;

        const id = "grad" + c2 + c2 + x1 + x2 + y1 + y2;
        const x = x1 < x2 ? x1 : x2;
        const y = y1 < y2 ? y1 : y2;

        return (
            <Svg key={id} height="150" width="300">
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="170" y2="0">
                        <Stop
                            offset="0"
                            stopColor="rgb(255,255,0)"
                            stopOpacity="0"
                        />
                        <Stop offset="1" stopColor="red" stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
            </Svg>
        );
    }

    render() {
        let canvasSize = 350;

        const x1 = points[0].x,
            y1 = points[0].y,
            x2 = points[0].x,
            y2 = points[0].y;

        return (
            <View
                style={[
                    StyleSheet.absoluteFill,
                    { alignItems: "center", justifyContent: "center" }
                ]}
            >
                <Svg width="100%" height="100%" viewBox="0 0 800 300">
                    <Defs>
                        <LinearGradient
                            id="Gradient"
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            y1="0"
                            x2="800"
                            y2="0"
                        >
                            <Stop
                                offset="0"
                                stopColor="#00FF00"
                                stopOpacity="1"
                            />
                            <Stop
                                offset="1"
                                stopColor="#FF0000"
                                stopOpacity="1"
                            />
                        </LinearGradient>
                        <Mask
                            id="Mask"
                            maskUnits="userSpaceOnUse"
                            x="0"
                            y="0"
                            width="800"
                            height="300"
                        >
                            <Text
                                id="Text"
                                x="400"
                                y="200"
                                fontFamily="Verdana"
                                fontSize="100"
                                textAnchor="middle"
                                fill={"green"}
                            >
                                Masked text
                            </Text>
                        </Mask>
                        <Rect
                            id="aRect"
                            x="0"
                            y="0"
                            width="800"
                            height="300"
                            fill="url(#Gradient)"
                        />
                    </Defs>
                    <Use href="#aRect" mask="url(#Mask)" />
                    {/* <Use
                        href="#Text"
                        fill="none"
                        stroke="black"
                        stroke-width="2"
                    /> */}
                </Svg>
            </View>
        );

        // return (
        //     <View style={{ flex: 1 }}>
        //         <Text>Introduction to Clockulate</Text>
        //         <Text>Intro</Text>
        //         <Text>blah</Text>
        //         <Text>tutorial</Text>
        //         <Text>blah</Text>
        //         <Svg width={canvasSize} height={canvasSize} viewBox="0 0 1 1">
        //             <Circle
        //                 cx="50"
        //                 cy="50"
        //                 r="45"
        //                 stroke="blue"
        //                 strokeWidth="2.5"
        //                 fill="green"
        //             />
        //             <Defs>
        //                 <Mask
        //                     id="mask"
        //                     x="0"
        //                     y="0"
        //                     width={100}
        //                     height={100}
        //                     maskUnits="userSpaceOnUse"
        //                 >
        //                     <Circle
        //                         cx="50"
        //                         cy="50"
        //                         r="45"
        //                         stroke="blue"
        //                         strokeWidth="2.5"
        //                         fill="green"
        //                     />

        //                 </Mask>
        //             </Defs>
        //             <G mask={"url(#mask)"}>
        //                 {this.renderGradient(
        //                     colors[0],
        //                     colors[1],
        //                     points[0],
        //                     points[1]
        //                 )}
        //                 {this.renderGradient(
        //                     colors[1],
        //                     colors[2],
        //                     points[1],
        //                     points[2]
        //                 )}
        //                 {this.renderGradient(
        //                     colors[2],
        //                     colors[3],
        //                     points[2],
        //                     points[3]
        //                 )}
        //                 {this.renderGradient(
        //                     colors[3],
        //                     colors[4],
        //                     points[3],
        //                     points[0]
        //                 )}
        //             </G>
        //         </Svg>
        //     </View>
        // );
    }
}

{
    /* <ArcShape
    key={idx}
    radius={radius}
    width={width}
    color={color}
    startAngle={startAngle}
    arcAngle={arcAngle}
    strokeCap={strokeCap}
/> */
}
