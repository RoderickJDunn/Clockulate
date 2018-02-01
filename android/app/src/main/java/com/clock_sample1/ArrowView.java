package com.clock_sample1;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathMeasure;
import android.graphics.Point;
import android.graphics.PointF;
import android.graphics.Rect;
import android.graphics.Region;
import android.text.TextPaint;
import android.util.Log;
import android.view.View;
import android.widget.ImageView;

import com.clock_sample1.RNConvert.RNConvert;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Arrays;

/**
 * Created by rdunn on 2018-01-30.
 */

public class ArrowView extends View {

    private static String TAG = "ArrowView";
    private Point start;
    private Point end;
    private double curve = 0;
    private double skew = 0;
    private double spread = 0;

    private int capHeight = 70; // TODO: Revisit. Why is this so much larger on Android compared to swift.
    private int capWidth = 35; // TODO: Revisit. Why is this so much larger on Android compared to swift.

    private Path arrow;
    // private Path initialPath;
    private Point topCorner;

    private double arrowAngle = 0;
    private double endSegmentSlope = 0;

    public ArrowView(Context context) {
        super(context);
//        this.setBackgroundColor(Color.parseColor("#3D9A10"));

        // TODO: setters will need this conversion as well (if I end up adding them as props)
//        this.capHeight = pxToDp(this.capHeight);
//        this.capWidth = pxToDp(this.capWidth);


    }

    public void setShape(ReadableMap shape) {
        this.start = RNConvert.arrowPoint(shape.getArray("start"));
        this.end = RNConvert.arrowPoint(shape.getArray("end"));

        Log.d(TAG, this.start.toString());
        Log.d(TAG, this.end.toString());

        if (shape.hasKey("curve")) {
            this.curve = shape.getDouble("curve");
        }
        if (shape.hasKey("skew")) {
            this.skew = shape.getDouble("skew");
            Log.d(TAG, "skew: " + this.skew);
        }
        if (shape.hasKey("spread")) {
            this.spread = shape.getDouble("spread");
        }
        Log.i(TAG, "set shape props. Calling invalidate");
        this.invalidate();
    }

    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        Log.d(TAG, "Drawing...");

        // TODO: If start/end not set, do not draw anything!

        if (this.end == null || this.start == null) {
            return;
        }

        Log.d(TAG, "onDraw after null checks");


        Paint pLine = new Paint() {{
            setStyle(Paint.Style.FILL_AND_STROKE);
            setAntiAlias(true);
            setStrokeWidth(1.5f);
            setColor(Color.MAGENTA); // Line color
        }};

        Paint pLineBorder = new Paint(Paint.ANTI_ALIAS_FLAG) {{
            setStyle(Paint.Style.STROKE);
            setAntiAlias(true);
            setStrokeWidth(3.0f);
            setStrokeCap(Cap.ROUND);
            setColor(Color.MAGENTA); // Darker version of the color
        }};


        Path linePath = this.createLine(this.start, this.end, this.curve, this.skew, this.spread);
//        Path p = new Path ();
//        Point mid = new Point();
//        // ...
//        Point start =new Point (30,90);
//        Point end =new Point (canvas.getWidth ()-30,140);
//        mid.set ((start.x + end.x) / 2, (start.y + end.y) / 2);
//
//        // Draw line connecting the two points:
//        p.reset ();
//        p.moveTo (start.x, start.y);
//        p.quadTo ((start.x + mid.x) / 2, start.y, mid.x, mid.y);
//        p.quadTo ((mid.x + end.x) / 2, end.y, end.x, end.y);


        Path capPath = this.createCap(this.end, this.capWidth, this.capHeight);

//
        // TODO: Rotate the cap based on end-direction of linePath.

        canvas.drawPath(capPath, pLine);
        canvas.drawPath(linePath, pLineBorder);
    }

    private Path createCap(Point end, int capWidth, int capHeight) {

        Point btmCenter = end;
        Point pRight, pTop, pLeft;

        pRight = new Point((btmCenter.x + (capWidth / 2)), btmCenter.y);
        pTop = new Point(btmCenter.x, (btmCenter.y - capHeight));
        pLeft = new Point((btmCenter.x - (capWidth / 2)), btmCenter.y);

        Log.d(TAG, pRight.toString());
        Log.d(TAG, pTop.toString());
        Log.d(TAG, pLeft.toString());

        Path capPath = new Path();
        capPath.setFillType(Path.FillType.EVEN_ODD);

        capPath.moveTo(btmCenter.x, btmCenter.y);
        capPath.lineTo(pRight.x, pRight.y);
        capPath.lineTo(pTop.x, pTop.y);
//        capPath.lineTo(pTop.x, pTop.y); // TODO: in Swift added this twice to create extra corner for animation to work properly
        capPath.lineTo(pLeft.x, pLeft.y);
        capPath.lineTo(btmCenter.x, btmCenter.y);
        capPath.close();

        return capPath;
    }

    private Path createLine(Point start, Point end, double curve, double skew, double spread) {

        Log.d(TAG, "Spread: " + spread);
        float spreadF = (float) spread;
        double flatX = (start.x + end.x) / 2;
        double flatY = (start.y + end.y) / 2;
        Point midPoint = new Point((int) flatX, (int) flatY);

        double rise = end.y - start.y;
        double run = end.x - start.x;

        double slope = rise == 0 ? 0 : rise / run;
        double invSlope = -1 / slope;  // NOTE: Think is actually a mirror-image slope. not perpendicular
        double invYint = midPoint.y - (invSlope * midPoint.x);

        Log.d(TAG, "Slope: " + slope);
        Log.d(TAG, "invSlope: " + invSlope);


        Point rightTriPoint;

        if (slope != 0) {
            // we have a diagonal line
            rightTriPoint = new Point(end.x, start.y);
        } else if (rise == 0) {
            // the line is horizontal
            rightTriPoint = new Point((int) flatX, (int) (flatX + (run / 2)));
        } else {
            // the line is vertical
            rightTriPoint = new Point((int) (flatY + (rise / 2)), (int) flatY);
        }

        // Calculate x range of curvature
        double rangeX = Math.abs(flatX - rightTriPoint.x);

        // calculate CurvedPoint based on 'curve' prop and rangeX.
        double curvedPointX = rangeX * curve + flatX;
        double curvedPointY;

        if (slope == 0) {
            Log.d(TAG, "Slope is ZERO. Calculate curvature as function of line length ");
            curvedPointY = flatY + curve * (run / 2);
        } else {
            curvedPointY = (invSlope * curvedPointX) + invYint;
        }
        PointF curvedPoint = new PointF((float) curvedPointX, (float) curvedPointY);

        Log.d(TAG, "Curved Point: " + curvedPoint.toString());

        /***** Calculate Skew *****/
        Path straightLine = new Path();
        straightLine.moveTo(this.start.x, this.start.y);
        straightLine.lineTo(this.end.x, this.end.y);
        float distance = (new PathMeasure(straightLine, false)).getLength();
        float skewX, skewY;
        float skewProp = (float) skew;

        if (rise == 0) {
            // horizontal line
            skewX = distance * skewProp;
            skewY = 0;
        } else if (run == 0) {
            skewX = 0;
            skewY = distance * skewProp;
        } else {
            skewY = distance * skewProp * (float) slope;
            skewX = distance * skewProp;
        }

        curvedPoint.x += skewX;
        curvedPoint.y += skewY;

        Log.d(TAG, "Skewed/Curved Point: " + curvedPoint.toString());


        /***** Calculate Spread *****/
        PointF spreadPoint1 = new PointF(curvedPoint.x, curvedPoint.y);
        PointF spreadPoint2 = new PointF(curvedPoint.x, curvedPoint.y);

        Log.d(TAG, "Pre-spread 1: " + spreadPoint1.toString());
        Log.d(TAG, "Pre-spread 2: " + spreadPoint2.toString());
        // Apply spread
        if (rise == 0) {
            spreadPoint1.x -= (float) (spreadF * distance);
            spreadPoint2.x += (float) (spreadF * distance);
        } else if (run == 0) {
            spreadPoint1.y -= (float) (spreadF * distance);
            spreadPoint2.y += (float) (spreadF * distance);
        } else {
            spreadPoint1.y -= (float) (spreadF * distance * slope);
            spreadPoint1.x -= (float) (spreadF * distance);

            spreadPoint2.y += (float) (spreadF * distance * slope);
            spreadPoint2.x += (float) (spreadF * distance);
        }
        Log.d(TAG, "Post-spread 1: " + spreadPoint1.toString());
        Log.d(TAG, "Post-spread 2: " + spreadPoint2.toString());

        // TODO: finish calculating curve, skew, and spread

        // TODO: Probably need to use 'quadTo' for drawing the curved path.
//        p.quadTo ((start.x + mid.x) / 2, start.y, mid.x, mid.y);
//        p.quadTo ((mid.x + end.x) / 2, end.y, end.x, end.y);

        Path line = new Path();
        line.moveTo(this.start.x, this.start.y);
//        line.quadTo(curvedPoint.x, curvedPoint.y, this.end.x, this.end.y);
        line.cubicTo(spreadPoint1.x, spreadPoint1.y, spreadPoint2.x, spreadPoint2.y, this.end.x, this.end.y);
        return line;
    }

    public static int pxToDp(int px) {
        return (int) (px / Resources.getSystem().getDisplayMetrics().density);
    }

    public static int dpToPx(int dp) {
        return (int) (dp * Resources.getSystem().getDisplayMetrics().density);
    }


}
