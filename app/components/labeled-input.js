/**
 * Created by rdunn on 2017-08-07.
 */
import React, {Component} from 'react';
import {StyleSheet, Text, View, TextInput} from 'react-native';

class LabeledInput extends Component {

    constructor(props) {
        super(props);
        // console.log(`props for ${TaskItem.count++}`);
        // console.log(props);
        this.state = {
            data: {
                labelText: props.labelText,
                fieldText: props.fieldText,
                placeHolder: props.placeholder
            }
        };

    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.fieldLabelText}>{this.state.data.labelText}</Text>
                <TextInput
                    placeholder={this.state.data.placeHolder}
                    style={[styles.fieldText]}
                    value={this.state.data.fieldText}>
                </TextInput>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        paddingBottom: 4,
        flex: 1
    },
    fieldLabelText: {
        fontSize: 13,
        paddingBottom: 15

    },
    fieldText: {
        fontSize: 23,
    },

});

export default LabeledInput;


