// ArrowViewBridge.m
#import <React/RCTBridgeModule.h>
#import "RCTViewManager.h"

@interface RCT_EXTERN_MODULE(ArrowViewManager, RCTViewManager)

//RCT_EXTERN_METHOD(printHello)
RCT_EXPORT_VIEW_PROPERTY(start, CGPoint);
RCT_EXPORT_VIEW_PROPERTY(end, CGPoint);

@end
