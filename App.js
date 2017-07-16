import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
} from 'react-native';
import moment from 'moment';
import TaskList from './components/task-list';
import DurationText from './components/duration-text';

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            time: moment().format("LT"),
            date: moment().format("LL"),
        };
    }

    componentDidMount() {
        setInterval(() => {
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
                <Text style={styles.dateText}>
                    {this.state.date}
                </Text>
                {/*<TaskList/>*/}
                <DurationText minutes="2"/>
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

