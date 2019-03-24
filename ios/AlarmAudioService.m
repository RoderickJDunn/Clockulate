//
//  AlarmAudioService.m
//  Alarm_AutoSet
//
//  Created by Roderick Dunn on 2018-11-08.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(AlarmAudioService, RCTEventEmitter)

RCT_EXTERN_METHOD(initializeAlarm: (NSDictionary)alarmInfo: (NSDictionary)settings: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(snoozeAlarm: (double)minutes)
RCT_EXTERN_METHOD(turnOffAlarm)

@end
