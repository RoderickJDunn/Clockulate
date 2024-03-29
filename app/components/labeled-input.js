/**
 * Created by rdunn on 2017-08-07.
 */
import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableWithoutFeedback
} from "react-native";
import Colors from "../styles/colors";
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
        // console.log("text", text);
        this.props.handleTextInput(text);
        this.setState({ inputText: text });
    }

    render() {
        // console.log("render", "LabeledInput");
        // console.log("this.state.inputText", this.state.inputText);
        // console.log("this.props.fieldText", this.props.fieldText);
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

        if (this.props.separation) {
            labelBottomPadding = this.props.separation;
        }

        return (
            <TouchableWithoutFeedback
                onPress={() => this._refTextInput.focus()}
            >
                {/* <TouchableOpacity > */}
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
                            { paddingBottom: this.props.separation }
                        ]}
                    >
                        {this.props.labelText}
                    </Text>
                    {/* </TouchableOpacity> */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center"
                        }}
                    >
                        <TextInput
                            ref={component => (this._refTextInput = component)}
                            style={[
                                styles.fieldText,
                                TextStyle.editableText,
                                this.props.textInputStyle,
                                {
                                    // height: inputHeight + scaleByFactor(23, 0.5),
                                    // paddingVertical: 3,
                                    margin: 0,
                                    flex: 1
                                    // backgroundColor: "#ededed"
                                    // borderRadius: 5
                                }
                            ]}
                            // underlineColorAndroid="transparent"
                            placeholderTextColor={Colors.disabledGrey}
                            placeholder={this.props.placeholder}
                            defaultValue={this.props.fieldText}
                            onChangeText={this._onChangeTextInput.bind(this)}
                            onBlur={e => {
                                // console.log("TextInput blurred: " + e.nativeEvent.text);
                                this._onBlur(this);
                                if (onBlur != null) onBlur(e);
                            }}
                            onFocus={() => {
                                this._onFocus();
                                if (onFocus != null) onFocus();
                            }}
                            blurOnSubmit={true}
                            onContentSizeChange={e =>
                                this.updateSize(
                                    e.nativeEvent.contentSize.height
                                )
                            }
                            multiline={false}
                            underlineColorAndroid="transparent"
                            editable={
                                this.props.editable == null
                                    ? true
                                    : this.props.editable
                            }
                            textAlign={
                                this.props.textAlign == null
                                    ? "left"
                                    : this.props.textAlign
                            }
                        />
                        {this.state.isEditing == true
                            ? this.props.clearButton
                            : null}
                    </View>
                </View>
            </TouchableWithoutFeedback>
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

export default LabeledInput;
