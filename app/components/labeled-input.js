/**
 * Created by rdunn on 2017-08-07.
 */
import React, { Component } from "react";
import { StyleSheet, Text, View, TextInput, Button } from "react-native";
import { randomColor } from "../styles/colors";
import { TextStyle } from "../styles/text";

class LabeledInput extends Component {
    constructor(props) {
        super(props);
        if (!props.handleTextInput) {
            console.error("Prop 'handleTextInput' is required!");
        }
    }

    render() {
        let onBlur, height, labelBottomPadding, flex;
        if (this.props.onTextInputBlur) {
            onBlur = this.props.onTextInputBlur;
        }
        if (this.props.height) {
            height = this.props.height;
        }
        if (this.props.separation) {
            labelBottomPadding = this.props.separation;
        }
        return (
            <View
                style={[
                    styles.container,
                    { height: height, flex: this.props.flex }
                ]}
            >
                <Text
                    style={[
                        TextStyle.labelText,
                        styles.fieldLabelText,
                        { paddingBottom: labelBottomPadding }
                    ]}
                >
                    {this.props.labelText}
                </Text>
                <TextInput
                    style={[
                        styles.fieldText,
                        TextStyle.editableText,
                        this.props.style
                    ]}
                    placeholder={this.props.placeHolder}
                    value={this.props.fieldText}
                    onChangeText={this.onChangeTextField.bind(this)}
                    onBlur={onBlur}
                />
            </View>
        );
    }

    onChangeTextField = text => {
        this.props.handleTextInput(text);
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignSelf: "stretch",
        justifyContent: "center",
        paddingBottom: 0,
        paddingTop: 2
    },
    fieldLabelText: {
        paddingBottom: 7
    },
    fieldText: {
        fontSize: 25,
        height: 30
    }
});

export default LabeledInput;
