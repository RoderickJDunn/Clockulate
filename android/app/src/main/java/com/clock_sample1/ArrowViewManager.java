package com.clock_sample1;

import android.util.Log;
import android.view.View;

import com.clock_sample1.RNConvert.RNConvert;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.lang.reflect.Array;

/**
 * Created by rdunn on 2018-01-30.
 */

public class ArrowViewManager extends SimpleViewManager<ArrowView> {

    public static final String TAG = "ArrowViewManager";
    public static final String REACT_CLASS = "ArrowView";
    public static final int PROP_COUNT = 2;

    public int propsSet = 0;

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ArrowView createViewInstance(ThemedReactContext reactContext) {
        return new ArrowView(reactContext);
    }

    @ReactProp(name = "shape")
    public void setShape(ArrowView view, ReadableMap shape) {
        Log.d("ArrowManager", "setShape ");
        view.setShape(shape);
    }

    @ReactProp(name = "animateDrawIn", defaultDouble = 0)
    public void setAnimInfo(ArrowView view, ReadableMap animInfo) {
        Log.d("ArrowManager", "setAnimDuration ");
        view.setAnimInfo(animInfo);
    }

//    public void didSetProp(ArrowView view) {
//        if (++propsSet >= PROP_COUNT) {
//            view.didSetProps();
//            Log.d(TAG, "didSetProp: Finished setting props");
//        }
//    }

    @Override
    protected void onAfterUpdateTransaction(ArrowView view) {
        view.didSetProps();
    }

}
