/**
 * Created by rdunn on 2017-08-07.
 */
import React, { Component } from "react";
import { StyleSheet, Text, View, TextInput, Button } from "react-native";
import { randomColor } from "../styles/colors";
import { TextStyle } from "../styles/text";
import { scale, scaleByFactor } from "../util/font-scale";

class LabeledInput extends Component {
    constructor(props) {
        super(props);
        // if (!props.handleTextInput) {
        //     console.error("Prop 'handleTextInput' is required!");
        // }
        this.state = {
            inputHeight: null,
            isEditing: false,
            inputText: null
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

    _onChangeTextInput(text) {
        this.props.handleTextInput(text);
        this.setState({ inputText: text });
    }

    render() {
        let onBlur, onFocus, height, labelBottomPadding, flex;
        let multiline = this.props.multiline;
        let inputHeight = 0;
        // console.log(this.props.placeholder);
        if (this.props.onTextInputBlur) {
            onBlur = this.props.onTextInputBlur;
        }

        if (this.props.onTextInputFocus) {
            onFocus = this.props.onTextInputFocus;
        }

        height = this.props.height;

        // console.log("LabeledInput -- this.state", this.state);
        // console.log("LabeledInput -- this.props", this.props);

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
                    {
                        height: height
                    },
                    this.props.style,
                    this.props.viewStyle
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
                        this.props.textInputStyle,
                        {
                            height: inputHeight + scaleByFactor(30, 0.5)
                        }
                    ]}
                    placeholder={this.props.placeholder}
                    value={this.state.inputText || this.props.fieldText}
                    onChangeText={this._onChangeTextInput.bind(this)}
                    onBlur={e => {
                        // console.log("TextInput blurred: " + e.nativeEvent.text);
                        this._onBlur(this);
                        if (onBlur != null) onBlur(e);
                    }}
                    onFocus={() => {
                        this._onFocus.bind(this);
                        if (onFocus != null) onFocus();
                    }}
                    blurOnSubmit={true}
                    onContentSizeChange={e =>
                        this.updateSize(e.nativeEvent.contentSize.height)
                    }
                    multiline={false}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0.5,
        alignSelf: "stretch",
        justifyContent: "center",
        paddingTop: 2
    },
    fieldLabelText: {
        paddingBottom: 7,
        backgroundColor: "transparent"
    },
    fieldText: {
        fontSize: 25
    }
});

export default LabeledInput;
