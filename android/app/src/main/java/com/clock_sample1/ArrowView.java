package com.clock_sample1;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.widget.ImageView;

import com.facebook.react.bridge.ReadableArray;

import java.lang.reflect.Array;
import java.util.ArrayList;

/**
 * Created by rdunn on 2018-01-30.
 */

public class ArrowView extends View {

    private double[] start;
    private double[] end;
    private float curve = 0;
    private float skew = 0;
    private float spread = 0;

    public ArrowView(Context context) {
        super(context);
        this.setBackgroundColor(Color.parseColor("#3D9A10"));
    }

    public void setStart(double[] startPoint) {
        this.start = startPoint;
    }

    public void setEnd(double[] endPoint) {
        this.end = endPoint;
    }

    public void setCurve(float curve) {
        this.curve = curve;
    }

    public void setSkew(float skew) {
        this.skew = skew;
    }

    public void setSpread(float spread) {
        this.spread = spread;
    }
}
