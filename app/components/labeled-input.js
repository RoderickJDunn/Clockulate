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
        let onBlur, height;
        if (this.props.onTextInputBlur) {
            onBlur = this.props.onTextInputBlur;
        }
        if (this.props.height) {
            height = this.props.height;
        }
        return (
            <View style={styles.container}>
                <Text style={[TextStyle.labelText, styles.fieldLabelText]}>
                    {this.props.labelText}
                </Text>
                <TextInput
                    style={[styles.fieldText, TextStyle.editableText]}
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
        alignSelf: "stretch",
        justifyContent: "center",
        paddingBottom: 18,
        paddingTop: 2,
        borderBottomColor: "#e9e9e9",
        borderBottomWidth: 1
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
