/**
 * Created by rdunn on 2017-07-16.
 */

import React from 'react';
import {TabNavigator, StackNavigator} from 'react-navigation';
import {Icon} from 'react-native-elements';

import AlarmDetail from '../screens/AlarmDetail';
import TestTab from '../screens/Alarms';

export const Tabs = TabNavigator({
   AlarmDetail: {
       screen: AlarmDetail,
   },
   TestTab: {
       screen: TestTab,
   }

});

export default Tabs;