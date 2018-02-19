package com.clock_sample1;

import android.app.Activity;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathMeasure;
import android.graphics.Point;
import android.graphics.PointF;
import android.graphics.Rect;
import android.graphics.Region;
import android.text.TextPaint;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.clock_sample1.RNConvert.RNConvert;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Arrays;

import static java.lang.Math.atan;
import static java.lang.Math.cos;
import static java.lang.Math.sin;

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

    private int capHeight = 20;
    private int capWidth = 10;

    private Path linePath;
    private Path capPath;
    private Point topCorner;

    private double arrowAngle = 0;
    private double endSegmentSlope = 0;
    private double lineLength = 0;

    private long animDuration = 0;
    private static float animSpeedInMs = 0.7f;
    private static long animMsBetweenStrokes = 1;
    private long animLastUpdate;
    private boolean animRunning = false;
    private int animCurrentCountour;
    private float animCurrentPos;
    private int animCapIdx = 0;
    private Path animPath;
    private Path animCapPath;
    private PathMeasure animPathMeasure;

    ArrayList<Path> capPathsExp = new ArrayList<>();

    public ArrowView(Context context) {
        super(context);
//        this.setBackgroundColor(Color.parseColor("#3D9A10"));

        // TODO: setters will need this conversion as well (if we end up adding them as props)
        this.capHeight = dpToPx(this.capHeight);
        this.capWidth = dpToPx(this.capWidth);

    }


    public void setShape(ReadableMap shape) {
        Log.v(TAG, "setShape:");
        this.start = RNConvert.arrowPoint(shape.getArray("start"));
        this.end = RNConvert.arrowPoint(shape.getArray("end"));

        Log.d(TAG, "Start: " + this.start.toString());
        Log.d(TAG, "End: " + this.end.toString());


        this.start = dpToPx(this.start);
        this.end = dpToPx(this.end);

        Log.d(TAG, "Start: " + this.start.toString());
        Log.d(TAG, "End: " + this.end.toString());

        int screenW = Resources.getSystem().getDisplayMetrics().widthPixels;
        int screenH = Resources.getSystem().getDisplayMetrics().heightPixels;

        Log.d(TAG, "ScreenW: " + screenW);
        Log.d(TAG, "ScreenH: " + screenH);

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

        createFullArrow();
    }

    public void setAnimInfo(ReadableMap animInfo) {
        // animProps: {
        //  duration: 0.5,
        //  initialDelay?
        //  repeatCount?
        //  delayBetween?
        // }
        // duration = totalFrames * fps
        Log.d(TAG, "setAnimInfo: ");
        if (animInfo.hasKey("duration")) {
            this.animDuration = (long) animInfo.getDouble("duration");
            Log.d(TAG, "animDuration: " + this.animDuration);
        }
        Log.i(TAG, "setAnimDuration");
        Log.i(TAG, "lineLength: " + lineLength);
    }

    public void didSetProps() {
        if (lineLength > 0 ) {
            Log.d(TAG, "didSetProps: Calculating animation speed");
            animSpeedInMs = (float) (animDuration / lineLength);
            animRunning = true;
            this.invalidate();
        }
    }



    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (this.linePath == null){
            createFullArrow();
        }
        if (animRunning) {
            drawAnimation(canvas);
        }
        else {
            drawPath(canvas, linePath, capPath);
        }
    }

    protected Path nextCapSeg() {
        try {
            Path p = this.capPathsExp.get(this.animCapIdx);
            this.animCapIdx++;
            return p;
        }
        catch (IndexOutOfBoundsException iob) {
            Log.d(TAG, "capPath index out of bounds");
            animCapIdx = 0;
            return this.capPath;
        }

    }



    protected void drawAnimation(Canvas canvas) {
        Log.d(TAG, "drawAnimation: ");
        if (animPathMeasure == null) {
            Log.d(TAG, "initializing animation ");

            // Set up line animation.
            animPathMeasure = new PathMeasure(this.linePath, false);
            animPathMeasure.nextContour();
            animPath = new Path();
            animCapPath = null;
            animLastUpdate = System.currentTimeMillis();
            animCurrentCountour = 0;
            animCurrentPos = 0.0f;
        } else {
            // Get time since last frame
            long now = System.currentTimeMillis();
            long timeSinceLast = now - animLastUpdate;
            Log.d(TAG, "timeSinceLast: " + timeSinceLast);
            if (animCurrentPos == 0.0f) {

                timeSinceLast -= animMsBetweenStrokes;
            }
            Log.d(TAG, "timeSinceLast: " + timeSinceLast);

            if (timeSinceLast > 0) {
                Log.d(TAG, "timeSinceLast > 0");
                // Get next segment of path
                // timeSinceLast / (ms per frame)   +  animCurrPos
                float newPos = (float)(timeSinceLast) / animSpeedInMs + animCurrentPos;
                boolean moveTo = (animCurrentPos == 0.0f);

                animPathMeasure.getSegment(animCurrentPos, newPos, animPath, moveTo);
                Log.d(TAG, "got next segment from animPathMeasure");
                animPath.rLineTo(0, 0);
                animCurrentPos = newPos;
                animLastUpdate = now;


                // If this stroke is done, move on to next
                Log.d(TAG, "newPos         : " + newPos);
                Log.d(TAG, "animPathMeasure: " + animPathMeasure.getLength());
                if (newPos > animPathMeasure.getLength()) {
//                    animCurrentPos = 0.0f;
//                    animCurrentCountour++;
                    boolean more = animPathMeasure.nextContour();
                    // Check if finished
                    if (!more) {
                        Log.d(TAG, "Cap path segment");
                        animCapPath = this.nextCapSeg();
                        if (animCapPath == this.capPath) {
                            Log.d(TAG, "Cap path finished");
                            animRunning = false;
                        }
                    }
                }
            }

            // Draw path
            this.drawPath(canvas, animPath, animCapPath);
        }
        Log.d(TAG, "------------------------------------------\n");
//        invalidate();
        postInvalidateDelayed(10);
    }

    protected void drawPath(Canvas canvas, Path linePath, Path capPath) {
        Log.d(TAG, "drawPath() ");

        Paint pCap = new Paint() {{
            setStyle(Style.FILL);
            setAntiAlias(true);
            setStrokeWidth(2.5f);
            setColor(Color.MAGENTA); // Line color
        }};

        Paint pLine = new Paint(Paint.ANTI_ALIAS_FLAG) {{
            setStyle(Paint.Style.STROKE);
            setAntiAlias(true);
            setStrokeWidth(2.0f);
            setStrokeCap(Cap.ROUND);
            setColor(Color.MAGENTA); // Darker version of the color
        }};
        if (linePath != null) {
            canvas.drawPath(linePath, pLine);
        }
        if (capPath != null) {
            canvas.drawPath(capPath, pCap);
        }

    }

    protected void createFullArrow() {

        Log.d(TAG, "Drawing...");

        // If start/end not set, do not create anything!
        if (this.end == null || this.start == null) {
            return;
        }

        Log.d(TAG, "onDraw after null checks");


        linePath = this.createLine(this.start, this.end, this.curve, this.skew, this.spread);

        PathMeasure pm = new PathMeasure(linePath, false);
        pm.nextContour();
        lineLength = 0;
        while (true) {
            lineLength += pm.getLength();
            if (!pm.nextContour()) {
                break;
            }
        }
        this.createCaps(this.end, this.capWidth, this.capHeight);




//        this.capPathsExp = createCapList(capPath);
//        this.capPathsExp.add(initCap);

//        linePath.op(capPath, Path.Op.UNION);

    }

//    private ArrayList<Path> createCapList(Path capPath) {
//
//    }

    private void createCaps(Point end, int capWidth, int capHeight) {

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

        capPath.moveTo(pRight.x, pRight.y);
        capPath.lineTo(pTop.x, pTop.y);
        capPath.lineTo(pLeft.x, pLeft.y);
        capPath.close();

        Matrix matrix = new Matrix();
        Log.d(TAG, "Rotation Angle: " + this.arrowAngle);
        matrix.setRotate((float) this.arrowAngle, end.x, end.y);

        capPath.transform(matrix);

        this.capPath = capPath;


        // Calculate List of CapPaths for animation
        // 1. Using length of cap, and duration of animation, determine how many capPath segments to create
        // 2. Create capPath segments and add them to the array. They will all have 4 points (trapezoidal)


        // All paths will have pRight and pLeft as their bottom corners
        // All paths must be transformed by the rotation matrix in the calling method.

        // assign short-var names for bottom right and bottom left corners
        float xR0 = pRight.x;
        float yR0 = pRight.y;
        float xL0 = pLeft.x;
        float yL0 = pLeft.y;

        // calculate slopes for right and left side of triangle
        float mR = (pTop.y - pRight.y) / (pTop.x - pRight.x);
        float mL = (pTop.y - pLeft.y) / (pTop.x - pLeft.x);



        float interval = 10; // distance increased per animation segment
        float d = interval;
        int animSegs = (int) (capHeight / d);

        Log.d(TAG, "Cap Segments Count: " + animSegs);

        for (int i=0; i<animSegs; i++) {

            // Formula (x) : x - x0 = d * (1 / sqrt(1 + m^2))
            //         (y) : y - y0 = d * (m / sqrt(1 + m^2))

            float xR1 = (-d * (1 / (float) Math.sqrt(1 + mR*mR))) + xR0;
            float yR1 = (-d * (mR / (float)  Math.sqrt(1 + mR*mR))) + yR0;
            float xL1 = (d * (1 / (float) Math.sqrt(1 + mL*mL))) + xL0;
            float yL1 = (d * (mL / (float) Math.sqrt(1 + mL*mL))) + yL0;


            Path p = new Path();
            p.setFillType(Path.FillType.EVEN_ODD);
            p.moveTo(xR0, yR0);
            Log.d(TAG, "[" + xR0 + ", " + yR0 + "]");
            p.lineTo(xR1, yR1);
            Log.d(TAG, "[" + xR1 + ", " + yR1 + "]");
            p.lineTo(xL1, yL1);
            Log.d(TAG, "[" + xL1 + ", " + yL1 + "]");
            p.lineTo(xL0, yL0);
            Log.d(TAG, "[" + xL0 + ", " + yL0 + "]");
            p.close();


            p.transform(matrix);
            this.capPathsExp.add(p);

            d += interval;
        }

        this.capPathsExp.add(capPath);

    }

    private Path createLine(Point start, Point end, double curve, double skew, double spread) {

        Log.d(TAG, "Spread: " + spread);
        float spreadF = (float) spread;
        double flatX = (start.x + end.x) / 2;
        double flatY = (start.y + end.y) / 2;
        Point midPoint = new Point((int) flatX, (int) flatY);

        double rise = end.y - start.y;
        double run = end.x - start.x;

        double slope = rise == 0 || run == 0 ? 0 : rise / run;
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
            rightTriPoint = new Point((int) (flatX + (rise / 2)), (int) flatY);
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
            spreadPoint1.y -= (float) (spreadF * distance);
            spreadPoint1.x -= (float) (spreadF * distance) / slope;

            spreadPoint2.y += (float) (spreadF * distance);
            spreadPoint2.x += (float) (spreadF * distance) / slope;
        }
        Log.d(TAG, "Post-spread 1: " + spreadPoint1.toString());
        Log.d(TAG, "Post-spread 2: " + spreadPoint2.toString());

        Path line = new Path();
        line.moveTo(this.start.x, this.start.y);
        line.cubicTo(spreadPoint1.x, spreadPoint1.y, spreadPoint2.x, spreadPoint2.y, this.end.x, this.end.y);


        // Calculate the rotation angle for arrow head.
        double endSegRise = end.y - spreadPoint2.y;
        double endSegRun = end.x - spreadPoint2.x;

        double endSegSlope = endSegRise / endSegRun;

        double angleToXAxis = atan(endSegSlope);
        double referenceAngle = endSegRise > 0 ? (Math.PI + Math.PI / 2) : Math.PI / 2;

        if (angleToXAxis == 0) {
            referenceAngle *= endSegRun > 0 ? 1 : -1;
        }
        else {
            referenceAngle *= endSegSlope > 0 ? -1 : 1;
        }

        this.arrowAngle = referenceAngle + angleToXAxis;
        this.arrowAngle = Math.toDegrees(this.arrowAngle);

        return line;
    }

    public static int pxToDp(int px) {
        return (int) (px / Resources.getSystem().getDisplayMetrics().density);
    }

    public static int dpToPx(int dp) {
        return (int) (dp * Resources.getSystem().getDisplayMetrics().density);
    }

    public static Point dpToPx(Point dp) {
        return new Point(dpToPx(dp.x), dpToPx(dp.y));
    }


}
