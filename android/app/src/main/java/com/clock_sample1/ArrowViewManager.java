package com.clock_sample1;

import android.view.View;

import com.clock_sample1.RNConvert.RNConvert;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
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

    @ReactProp(name = "shape")
    public void setShape(ArrowView view, ReadableMap shape) {
        view.setShape(shape);

//        view.makeArrow();
        // TODO: Call something like 'view.flag_for_redraw()'
        // Also, in ArrowView, within 'onDraw()', we can have code that
        // checks if start and end have been set yet, and if not, don't draw anything!
    }

}
