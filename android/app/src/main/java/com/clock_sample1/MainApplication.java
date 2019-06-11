package com.clock_sample1;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.BV.LinearGradient.LinearGradientPackage;
import com.wix.reactnativenotifications.RNNotificationsPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.dooboolab.RNIap.RNIapPackage;
import com.rnfs.RNFSPackage;
import com.sbugert.rnadmob.RNAdMobPackage;
import com.wheelpicker.WheelPickerPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.apsl.versionnumber.RNVersionNumberPackage;
import com.zmxv.RNSound.RNSoundPackage;
//import com.zmxv.RNSound.RNSoundPackage;
// import com.reactlibrary.RNArrowsPackage;
import com.facebook.react.uimanager.ViewManager;
import com.wix.interactable.Interactable;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import io.realm.react.RealmReactPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(new MainReactPackage(),
            new LinearGradientPackage(),
            new RNNotificationsPackage(),
            new SplashScreenReactPackage(),
            new RNIapPackage(),
            new RNFSPackage(),
            new RNAdMobPackage(),
            new WheelPickerPackage(),
            new LottiePackage(),
            new RNGestureHandlerPackage(),
            new RNVersionNumberPackage(),
                    new RNNotificationsPackage(this.getApplication()), new RNSoundPackage(),
                    new LinearGradientPackage(),
                    // new RNArrowsPackage(),
                    new Interactable(), new ReactNativePushNotificationPackage(), new CalendarEventsPackage(),
                    new SvgPackage(), new VectorIconsPackage(), new PickerViewPackage(), new RealmReactPackage(),
                    new ArrowViewPackage());
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
    }
}
