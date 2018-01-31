package com.clock_sample1.RNConvert;

import android.graphics.Point;

import com.facebook.react.bridge.ReadableArray;

import java.util.ArrayList;

/**
 * Created by rdunn on 2018-01-30.
 */

public class RNConvert {
    public static double[] arrowPoint(ReadableArray point) {
        double pointArr[] = { point.getDouble(0), point.getDouble(1)};
        return pointArr;
    }
}
