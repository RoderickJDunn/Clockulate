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
        // if (!props.handleTextInput) {
        //     console.error("Prop 'handleTextInput' is required!");
        // }
        this.state = {
            inputHeight: null,
            isEditing: false
        };
    }

    updateSize = inputHeight => {
        this.setState({
            inputHeight
        });
    };

    _onFocus() {
        this.setState({ isEditing: true });
    }

    _onBlur() {
        this.setState({ isEditing: false });
    }

    render() {
        let onBlur, height, labelBottomPadding, inputHeight, flex;
        let multiline = false;
        // console.log(this.props.placeholder);
        if (this.props.onTextInputBlur) {
            onBlur = this.props.onTextInputBlur;
        }
        if (this.props.height) {
            height = this.props.height;
        }

        console.log("LabeledInput -- this.state", this.state);
        console.log("LabeledInput -- this.props", this.props);

        let { autoResize } = this.props;
        if (
            autoResize == true ||
            (autoResize == "editing" && this.state.isEditing)
        ) {
            // If 1) we are editing text input, 2) autoResize prop is True, 3) inputHeight is not null
            // set textInput height explicitly
            inputHeight = this.state.inputHeight;
            multiline = true;
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
                        this.props.style,
                        { height: inputHeight + 10 }
                    ]}
                    placeholder={this.props.placeholder}
                    value={this.props.fieldText}
                    onChangeText={this.props.handleTextInput.bind(this)}
                    onBlur={() => {
                        this._onBlur(this);
                        if (onBlur != null) onBlur();
                    }}
                    onFocus={this._onFocus.bind(this)}
                    blurOnSubmit={true}
                    onContentSizeChange={e =>
                        this.updateSize(e.nativeEvent.contentSize.height)
                    }
                    {...this.props}
                    multiline={multiline}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignSelf: "stretch",
        justifyContent: "center",
        paddingTop: 2
    },
    fieldLabelText: {
        paddingBottom: 7,
        backgroundColor: "transparent"
    },
    fieldText: {
        fontSize: 25,
        height: 30
    }
});

export default LabeledInput;
