// ArrowViewBridge.m
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTComponent.h>
#import "Alarm_AutoSet-Swift.h"
//
//@interface RCT_EXTERN_MODULE(ArrowViewManager, RCTViewManager)
//@end
//
//@implementation ArrowViewManager
////RCT_EXTERN_METHOD(printHello)
//RCT_EXPORT_VIEW_PROPERTY(start, int);
//RCT_EXPORT_VIEW_PROPERTY(end, int);
//
//@end


@interface ArrowViewManager : RCTViewManager
@end

@implementation ArrowViewManager

RCT_EXPORT_MODULE()



RCT_EXPORT_VIEW_PROPERTY(points, int)

- (UIView *)view {
  return [[ArrowView alloc] init];
}

@end
