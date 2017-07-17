/**
 * Created by rdunn on 2017-07-16.
 */

import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
} from 'react-native';
import moment from 'moment';
import TaskList from '../components/task-list';

class AlarmDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            time: moment().format("LT"),
            date: moment().format("LL"),
        };
    }

    componentDidMount() {
        setTimeout(() => {  // Temporarily disabled to save resources. (set back to setInterval).
            console.log("Updating time and date");
            this.setState({
                time: moment().format("LT"),
                date: moment().format("LL"),
            });
        }, 1000);
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar style={{backgroundColor: 'transparent'}}/>
                <Text style={styles.timeText}>
                    {this.state.time}
                </Text>
                {/*<Text style={styles.dateText}>*/}
                {/*{this.state.date}*/}
                {/*</Text>*/}
                <TaskList/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#446683',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        color: '#999999',
        fontSize: 80,
    },
    dateText: {
        color: '#999999',
        fontSize: 40,
    },
});

export default AlarmDetail;