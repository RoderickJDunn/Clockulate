/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import "RNSplashScreen.h"
#import <React/RCTPushNotificationManager.h>
#import "RNNotifications.h"
@import GoogleMobileAds;


@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  
  [UIDevice currentDevice].proximityMonitoringEnabled = NO;
  
  NSURL *jsCodeLocation;

  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
//  jsCodeLocation = [NSURL URLWithString:@"http://192.168.2.25:8081/index.ios.bundle?platform=ios&dev=true"];
  // jsCodeLocation = [NSURL URLWithString:@"http://169.254.239.224:8081/index.bundle?platform=ios&dev=true"];

  
  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"Clockulate"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  
  [[GADMobileAds sharedInstance] startWithCompletionHandler:nil];

//  NSLog(@"Testing my own log in AppDelegate -------- ******************** ---------------");
//  NSLog(@"%@", jsCodeLocation.absoluteString);
//  NSLog (@" host:%@", [jsCodeLocation host]);
//  NSLog (@" port:%@", [jsCodeLocation port]);
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [UNUserNotificationCenter currentNotificationCenter].delegate = self;
  
  /* @Roderick
   IMPORTANT: The next 3 lines were added as a tip found in react-native docs (https://facebook.github.io/react-native/docs/running-on-device.html#troubleshooting). They prevent the screen from flashing white between the splash screen and mounting the root view!
   */
//  UIView* launchScreenView = [[[NSBundle mainBundle] loadNibNamed:@"LaunchScreen" owner:self options:nil] objectAtIndex:0];
//  launchScreenView.frame = self.window.bounds;
//  rootView.loadingView = launchScreenView;
  
  [RNSplashScreen show];
  return YES;
}

@end
