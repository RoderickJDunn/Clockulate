/**
 * Created by rdunn on 2017-08-07.
 */
import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableWithoutFeedback,
    FlatList
} from "react-native";
import Colors from "../styles/colors";
import { TextStyle } from "../styles/text";
import { scale, scaleByFactor } from "../util/font-scale";
import { TaskListStyle, TaskItemStyle } from "../styles/list";

class StartTimesList extends Component {
    constructor(props) {
        super(props);
        // if (!props.handleTextInput) {
        //     console.error("Prop 'handleTextInput' is required!");
        // }
    }

    render() {
        let itemCount = this.props.data.length;
        return (
            <FlatList
                data={this.props.data}
                renderItem={item => {
                    return (
                        <View
                            style={[
                                TaskListStyle.taskRow,
                                {
                                    borderBottomColor: "black",
                                    borderBottomWidth: 0.8,
                                    backgroundColor: Colors.transparent
                                    // borderBottomLeftRadius:
                                    //     item.item.key == itemCount - 1 ? 20 : 0
                                }
                            ]}
                        >
                            <View
                                style={[
                                    TaskListStyle.taskRow,
                                    {
                                        height: 54,
                                        // borderBottomColor: "black",
                                        // borderBottomWidth: 0.6,
                                        backgroundColor:
                                            Colors.brandSuperLightPurple,
                                        borderBottomLeftRadius:
                                            item.item.key == itemCount - 1
                                                ? 20
                                                : 0
                                    }
                                ]}
                            >
                                <View
                                    style={{
                                        paddingLeft: 16
                                    }}
                                >
                                    <Text>{item.item.value}</Text>
                                </View>
                            </View>
                        </View>
                    );
                }}
                style={[this.props.style]}
            />
        );
    }
}

export default StartTimesList;
