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

@property (nonatomic) int points;

@end

@implementation ArrowViewManager

RCT_EXPORT_MODULE()



RCT_EXPORT_VIEW_PROPERTY(shape, NSDictionary)

//RCT_CUSTOM_VIEW_PROPERTY(shape, NSDictionary, ArrowView) {
//
//  NSLog(@"debug custom view property");
//  NSArray *start = json[@"start"];
//  float startX = [(NSNumber *) start[0] floatValue];
//  float startY = [(NSNumber *) start[1] floatValue];
//
//  NSArray *end = json[@"end"];
//  float endX = [(NSNumber *) end[0] floatValue];
//  float endY = [(NSNumber *) end[1] floatValue];
//
//  view.start = CGPointMake((CGFloat) startX, (CGFloat) startY);
//  view.end = CGPointMake((CGFloat) endX, (CGFloat) endY);
//
//}

- (UIView *)view {
  return [[ArrowView alloc] init];
}

@end
