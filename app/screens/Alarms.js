/**
 * Created by rdunn on 2017-07-16.
 */

import React, {Component} from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    AppRegistry,
    Button
} from 'react-native';

import realm from '../data/DataSchemas';
import moment from 'moment';

import { ListStyle } from '../styles/list'

class Alarms extends Component {

    // static navigationOptions = ({navigation}) => ({
    //     title: "Alarms",
    //     headerRight: <Button title="Add" onPress={() => navigation.state.params.handleAddAlarm()}/>
    // });

    constructor() {
        super();

        console.log("Fetching Alarms...");
        this.alarmList = realm.objects('Alarm'); // TODO: filter by 'visible'=true

        console.log("Registering listener");
        this.alarmList.addListener((name, changes) => {
            // console.log("Changed: " + JSON.stringify(changes));
        });

    }

    componentDidMount(){
        console.debug("Alarms --- ComponentDidMount");
        // setParams updates the object 'navigation.state.params'
        // When this Screen is going to be rendered, any code in navigationOptions is run (ie: the code within
        // the onPress property of a Button (in headerRight)). This code in navigationOptions can have access to
        // the navigation object that we are updating here - so long as you pass in navigation to navigationOptions
        this.props.navigation.setParams({ handleAddAlarm: this.handleAddAlarm.bind(this)});
    }

    /*
    Handler for 'Add-Alarm' button press. Navigates to AlarmDetail screen sending no Alarm data.
    SIDE-NOTE: This is a NORMAL function (NOT an arrow function). Therefore, this function creates its own 'this'
                context. 'this.props' is only accessible from within this function because I 'bound' the external
                'this' context (the class's "this") within the render method. A different way of doing this is to use
                an arrow function, which uses the 'this' value of the enclosing execution context. Therefore, when
                referencing an arrow function, you don't need to bind 'this' in order for it to be access the outer
                scope 'this'.
     */
    handleAddAlarm() {
        console.log("Adding alarm");
        // alert("Adding alarm!");
        this.props.navigation.navigate('AlarmDetail', {newAlarm: true});
    }

    _keyExtractor = (item, index) => {
        return item.id;
    };

    _onPressItem = (item) => {
        console.debug("_onPressItem called");
        console.log("--------- " + item.id + " -----------");
        // console.log(item);

        this.props.navigation.navigate('AlarmDetail', item);
    };

    _renderItem = ({item}) => (
        <TouchableOpacity style={ListStyle.item} id={item.id}
              label={item.label}
              onPress={this._onPressItem.bind(this, item)}
        >
            <Text>{moment.unix(item.wakeUpTime).utc().format("h:mm A")}</Text>
            <Text>{item.label}</Text>
        </TouchableOpacity>
    );

    render() {
        return (
            <View style={ListStyle.container}>
                <StatusBar />
                <FlatList
                    data={this.alarmList}
                    renderItem={this._renderItem}
                    keyExtractor={this._keyExtractor}
                >
                </FlatList>
            </View>
        )
    }
}

export default Alarms;

