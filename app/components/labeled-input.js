/**
 * Created by rdunn on 2017-08-07.
 */
import React, {Component} from 'react';
import {StyleSheet, Text, View, TextInput, Button} from 'react-native';
import { randomColor } from '../styles/colors'
class LabeledInput extends Component {

    constructor(props) {
        super(props);
        if (!props.handleTextInput) {
            console.error("Prop 'handleTextInput' is required!");
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.fieldLabelText}>{this.props.labelText}</Text>
                <TextInput
                    style={styles.fieldText}
                    placeholder={this.props.placeHolder}
                    value={this.props.fieldText}
                    onChangeText={this.onChangeTextField.bind(this)}/>
                {/*<Text style={styles.fieldLabelText}>Fake:O0</Text>*/}

            </View>
        );
    }

    onChangeTextField = (text) => {
        this.props.handleTextInput(text);
    }
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        justifyContent: 'center',
        paddingBottom: 9,
        paddingTop: 2,
        borderBottomColor: "#e9e9e9",
        borderBottomWidth: 1,
    },
    fieldLabelText: {
        fontSize: 13,
        paddingBottom: 7
    },
    fieldText: {
        fontSize: 23,
        height: 20,
    },

});

export default LabeledInput;


