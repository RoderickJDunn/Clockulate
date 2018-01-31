package com.clock_sample1;

import android.view.View;

import com.clock_sample1.RNConvert.RNConvert;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.lang.reflect.Array;

/**
 * Created by rdunn on 2018-01-30.
 */

public class ArrowViewManager extends SimpleViewManager<ArrowView> { // TODO: revisit <WHATS_IN_HERE>

    public static final String REACT_CLASS = "ArrowView";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ArrowView createViewInstance(ThemedReactContext reactContext) {
        return new ArrowView(reactContext);
    }

    @ReactProp(name = "start")
    public void setStart(ArrowView view, ReadableArray startPoint) {
        view.setStart(RNConvert.arrowPoint(startPoint));
    }

    @ReactProp(name = "end")
    public void setEnd(ArrowView view, ReadableArray endPoint) {
        view.setEnd(RNConvert.arrowPoint(endPoint));
    }

    @ReactProp(name = "curve", defaultFloat = 0f)
    public void setCurve(ArrowView view, float curve) {
        view.setCurve(curve);
    }

    @ReactProp(name = "skew", defaultFloat = 0f)
    public void setSkew(ArrowView view, float skew) {
        view.setSkew(skew);
    }

    @ReactProp(name = "spread", defaultFloat = 0f)
    public void setSpread(ArrowView view, float spread) {
        view.setSpread(spread);
    }
}
