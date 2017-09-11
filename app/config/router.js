/**
 * Created by rdunn on 2017-07-16.
 */

import React from 'react';
import {View, Text, Button} from 'react-native';
import {TabNavigator, StackNavigator} from 'react-navigation';
import {Icon} from 'react-native-elements';

import Alarms from '../screens/Alarms';
import AlarmDetail from '../screens/AlarmDetail';
import AlarmDetailBasic from '../screens/AlarmDetailBasic';
import TaskDetail from '../screens/TaskDetail';
import Colors from '../styles/colors'

// export const AlarmTabs = TabNavigator({
//     AlarmDetail: {
//         screen: AlarmDetail,
//         navigationOptions: {
//             tabBarLabel: 'Auto-Calc',
//             tabBarIcon: ({tintColor}) => ( <Icon name="list" size={35} color={tintColor}/> ),
//         },
//     },
// });

/*
    This is an optional object to be passed into StackNavigator when it is created. It provides
    default configuration for every screen within the StackNavigator. These configurations can then
    be overwritten on a per-screen basis if needed.
 */
const navigationConfig = {
    initialRouteName: 'AlarmsList',
    headerMode: 'float',
    navigationOptions: {
        title: 'Alarms',
        headerStyle: {  // Style the header view itself (aka. the nav bar)
            backgroundColor: Colors.brandDarkGrey,
        },
        headerTitleStyle: { // style the Title text of the header
            color: Colors.brandLightGrey
        },
        headerTintColor: Colors.brandLightGrey // this sets color for 'Back' icon and text
    }
};

export const MainStack = StackNavigator({
    AlarmsList: {
        screen: Alarms,
        // navigationOptions: ({navigation}) => ({
        //     title: "Alarms10",
        //     // Use this method to provide a custom header (Navigation bar)
        //     // header: (
        //     //     <View style={{
        //     //         height: 80,
        //     //         marginTop: 20// only for IOS to give StatusBar Space
        //     //     }}>
        //     //         <Text>This is my HEADER</Text>
        //     //     </View>
        //     // )
        //     // headerRight: ({state}) => ( <Button title="Add" onPress={state.params.handleAddAlarm} />)
        //     headerRight: <Button title="Add" onPress={navigation.handleAddAlarm()} />
        // }),
        navigationOptions: ({navigation}) => ({
                title: "Alarms",
                headerRight: <Button title="Add" onPress={() => navigation.state.params.handleAddAlarm()}/>
            }),
    },
    AlarmDetail: {
        screen: AlarmDetail,
        navigationOptions: ({navigation}) => ({
            headerStyle: {
                backgroundColor: Colors.brandDarkGrey,
            },
            headerTitleStyle: {
                color: Colors.brandLightGrey
            },
        }),
    },
    TaskDetail: {
        screen: TaskDetail,
        navigationOptions: ({navigation}) => ({
            headerStyle: {
                backgroundColor: Colors.brandDarkGrey,
            },
            headerTitleStyle: {
                color: Colors.brandLightGrey
            },
            headerRight: <Button title="Save" onPress={() => navigation.state.params.handleSave()}/>
        }),

    }
}, navigationConfig);








