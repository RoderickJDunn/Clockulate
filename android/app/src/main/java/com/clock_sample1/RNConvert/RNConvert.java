package com.clock_sample1.RNConvert;

import android.graphics.Point;

import com.facebook.react.bridge.ReadableArray;

import java.util.ArrayList;

/**
 * Created by rdunn on 2018-01-30.
 */

public class RNConvert {
    public static Point arrowPoint(ReadableArray point) {
        Point p = new Point((int) point.getDouble(0), (int) point.getDouble(1));
        return p;
    }
}
