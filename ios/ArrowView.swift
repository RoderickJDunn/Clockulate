//
//  ArrowView.swift
//  DrawSVGAnimationTest
//
//  Created by Roderick Dunn on 2017-12-29.
//  Copyright © 2017 Roderick Dunn. All rights reserved.
//

import UIKit
import Foundation

//@objc(ArrowViewManager)
//class ArrowViewManager: RCTViewManager {
//
//  override func view() -> UIView! {
//    print("returning arrowview!!!")
//    return ArrowView()
//  }
//}

@objc(ArrowView)
class ArrowView: UIView {
  
  var arrow = UIBezierPath()
  var initialPath = UIBezierPath()
  var topCorner = CGPoint()
  
  let shapeLayer = CAShapeLayer()
  let arrowLayer = CAShapeLayer()
  
  var arrowAngle = 0.0
  var endSegmentSlope: CGFloat = 0.0
  
  var finalMask = UIBezierPath()
  var animDuration: Int = 0
  
  let WAIT_FOR_PROPS = ["shape", "animInfo"]
  
  var shape:[String:Any] = [:] {
    didSet {
      print("setting shape dictionary")
      if let start = shape["start"] {
        let startArr = (start as! [CGFloat])
        self.start = CGPoint(x: startArr[0], y: startArr[1])

      }
      if let end = shape["end"] {
        let endArr = (end as! [CGFloat])
        self.end = CGPoint(x: endArr[0], y: endArr[1])
      }
      
      if let curve = shape["curve"] {
        self.curve = curve as! CGFloat
      }
      
      if let skew = shape["skew"] {
        self.skew = skew as! CGFloat
      }
      
      if let spread = shape["spread"] {
        self.spread = spread as! CGFloat
      }
      
      self.makeArrow()
    }
  }
  
  var animInfo:[String:Any] = [:] {
    didSet {
      print("setting animation info")
      if let duration = animInfo["duration"] as? Int {
        self.animDuration = duration
      }
    }
  }
  
  override func didSetProps(_ changedProps: [String]!) {
    print("DidSetProps()")
    print(changedProps)
    if let changedProps = changedProps {
      if changedProps.contains("animateDrawIn") && changedProps.contains("shape"){
      self.drawLineAnimate(nil)
      }
    }
    
  }
  
  var start:CGPoint = CGPoint()
  var end:CGPoint = CGPoint()
  var curve:CGFloat = 0
  var skew:CGFloat? = nil
  var spread:CGFloat? = nil

  var capWidth: CGFloat = 10
  var capHeight: CGFloat = 20
  
  @objc override init(frame: CGRect) {
    super.init(frame: frame)
    print("Frame: " + String(describing: frame))
    print("Init ArrowView")
    
  }
  
  func makeArrow() {
    print("creating arrow")

    //        let lineEnd = CGPoint(x: 350, y: 600)
    //        let lineEnd = CGPoint(x: 350, y: 200)
    //        let lineEnd = CGPoint(x: 100, y: 600)
    //        let lineEnd = CGPoint(x: 350, y: 350)
    //        let lineEnd = CGPoint(x: 250, y: 100)
    
    shapeLayer.path = createSimpleCurve(start: self.start, end: self.end,
                                        curvature: self.curve, skew: self.skew,
                                        spread: self.spread).cgPath
    
    let color = UIColor(red: 114.0/255.0, green: 72.0/255.0, blue: 173.0/255.0, alpha: 0.6).cgColor
//    shapeLayer.strokeColor = UIColor.purple.cgColor
    shapeLayer.strokeColor = color
    shapeLayer.fillColor = UIColor.clear.cgColor
    shapeLayer.lineWidth = 1.0
    shapeLayer.lineCap = kCALineCapRound
    
    self.arrow = createCapPath(btmCenter: self.end, height: self.capHeight, width: self.capWidth)
    //        self.arrow = initialPath
    arrowLayer.path = self.initialPath.cgPath
    
    print("Frame: " + String(describing: arrowLayer.frame))
    print("Bounds: " + String(describing: arrowLayer.bounds))
    
    
    arrowLayer.strokeColor = UIColor.clear.cgColor
    arrowLayer.fillColor = color
    arrowLayer.lineWidth = 1.0
    arrowLayer.lineCap = kCALineCapRound

    
    var pathTransform = CGAffineTransform.identity
    pathTransform = pathTransform.translatedBy(x: self.end.x, y: self.end.y)
    pathTransform = pathTransform.rotated(by: CGFloat(arrowAngle))
    pathTransform = pathTransform.translatedBy(x: -self.end.x, y: -self.end.y)
    finalMask.apply(pathTransform)
    
    shapeLayer.isHidden = true
    
    self.layer.addSublayer(shapeLayer)
    self.layer.addSublayer(arrowLayer)

    
    // DEV ONLY //
    //        var finalMaskLayer = CAShapeLayer()
    //        createFinalMask(top: lineEnd)
    //        finalMaskLayer.path = finalMask.cgPath
    //        finalMaskLayer.fillColor = UIColor.blue.cgColor
    //        finalMaskLayer.lineWidth = 2.0
    //        self.layer.addSublayer(finalMaskLayer)
    //
    //
//    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: {
//      print("executing async code")
//      self.drawLineAnimate(2)
//    })
  }
  
  @objc required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  func drawLineAnimate(_ repeatCount: Int?) {
    shapeLayer.isHidden = false
    print("drawing arrow")
    let totalDuration = Double(self.animDuration) / 1000
    let arwHeadRatio = 0.1
    
    let arrowDuration = totalDuration * arwHeadRatio
    let lineDuration = totalDuration - arrowDuration
    self.arrowLayer.removeAllAnimations() // THIS WAS THE SOLUTION TO RESET ARROWHEAD !!!
    
    print(String(describing: self.arrowLayer.path))
    CATransaction.begin()
    let drawAnimation = CABasicAnimation(keyPath: "strokeEnd")
    drawAnimation.fromValue = 0.0
    drawAnimation.byValue = 1.0
    drawAnimation.duration = lineDuration
    drawAnimation.fillMode = kCAFillModeForwards
    drawAnimation.isRemovedOnCompletion = false
    
    let arwAnimation = CABasicAnimation(keyPath: "path")
    arwAnimation.fromValue = initialPath.cgPath
    arwAnimation.toValue = arrow.cgPath
    arwAnimation.beginTime = CACurrentMediaTime() + lineDuration
    arwAnimation.duration = arrowDuration
    arwAnimation.fillMode = kCAFillModeForwards
    arwAnimation.isRemovedOnCompletion = false
    
    
    
    
    CATransaction.setCompletionBlock {
      self.arrowLayer.add(arwAnimation, forKey: "animatePath")
      
    }
    
    shapeLayer.add(drawAnimation, forKey: "drawLineAnimation")
    
    CATransaction.commit()
    
    if var repeatCount = repeatCount {
      print("recursive check")
      
      repeatCount -= 1
      if (repeatCount > 0) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: {
          print("executing other async code")
          
          self.drawLineAnimate(repeatCount)
        })
      }
    }
  }
  
  
  
  // map. start(250, 500) : end(350, 318)
  // curvature | control points
  //     0     |   avg
  //     1     |
  func createSimpleCurve(start: CGPoint, end: CGPoint, curvature: CGFloat, skew: CGFloat?, spread: CGFloat?) -> UIBezierPath {
    
    let flatX = CGFloat((start.x + end.x) / 2) // X-value of mid-way between start and end points
    let flatY = CGFloat((start.y + end.y) / 2) // Y-value of mid-way between start and end points
    
    let midpoint = CGPoint(x: flatX, y: flatY)
    
    let rise = (end.y - start.y)
    let run = (end.x - start.x)
    let slope: CGFloat
    if rise == 0 {
      slope = 0
    }
    else if run == 0 {
      slope = 0
    }
    else {
      slope = rise / run
    }
    
    //        let yIcpt = end.y - (slope * end.x) // y-intercept
    
    let invSlope = -1 / slope  // slope of perpendicular line at midpoint
    let inv_yIcpt = midpoint.y - (invSlope * midpoint.x) // y-intercept of perpendicular line
    
    
    print("Slope: " + String(describing: slope))
    let bezierPath = UIBezierPath()
    
    
    print(flatX)
    print(flatY)
    
    // NOTE: These 'tri' vars have nothing to do with the arrowHead. They are related
    // to the right-triangle geometry being carried out.
    let rightTriPoint: CGPoint
    if slope != 0 {
      rightTriPoint = CGPoint(x: end.x, y: start.y) // positive corner of right-angle triangle
    }
    else if rise == 0 {
      // The line is completely horizontal.
      // just use the half length of line, but in perpendicular direction
      let halfLength = run / 2
      rightTriPoint = CGPoint(x: flatX, y: flatX + halfLength)
    }
    else {
      let halfLength = rise / 2
      // TODO: When this was flatY in android. Curve prop had no affect on vertical lines.
      // Test this change       *flatY*
      rightTriPoint = CGPoint(x: flatX + halfLength, y: flatY)
    }
    
    
    // Find ranges to map to value of "1" curvature
    let rangeX = abs(flatX - rightTriPoint.x) // X distance from midpointX to left/right edge of triangle
    
    // Curvature Calc //
    print("inverse slope: " + String(describing: invSlope))
    let curvedPointX = rangeX * curvature + flatX
    let curvedPointY: CGFloat
    if slope == 0 {
      print("Slope is ZERO. Calculate curvature as function of line length ")
      curvedPointY = flatY + curvature * (run / 2)
      print(flatY)
      print(run / 2)
      print(curvedPointY)
    }
    else {
      curvedPointY = (invSlope * curvedPointX) + inv_yIcpt
    }
    
    var curvedPoint = CGPoint(x: curvedPointX, y: curvedPointY)
    ///////////
    
    print(curvedPoint)
    
    let distance = CGPointDistance(from: start, to: end)
    
    
    
    // Interpolate skew parameter to distance between points
    if let skew = skew {
      let skewY, skewX : CGFloat
      if rise == 0 {
        skewX = distance * skew
        skewY = 0
      }
      else if run == 0{
        skewX = 0
        skewY = distance * skew
      }
      else {
        skewY = distance * skew * slope
        skewX = distance * skew
      }
      
      // apply skew using slope and skew param
      curvedPoint.y = curvedPoint.y + skewY
      curvedPoint.x = curvedPoint.x + skewX
    }
    
    var skewedPoint1 = curvedPoint
    var skewedPoint2 = curvedPoint
    
    // Apply spread
    if let spread = spread {
      if rise == 0 {
        skewedPoint1.x -= spread * distance
        skewedPoint2.x += spread * distance
      }
      else if run == 0{
        skewedPoint1.y -= spread * distance
        skewedPoint2.y += spread * distance
      }
      else {
        print("Pre-spread 1: " + String(describing: skewedPoint1))
        print("Pre-spread 2: " + String(describing: skewedPoint2))
        
        skewedPoint1.y -= spread * distance
        skewedPoint1.x -= (spread * distance) / slope
        
        skewedPoint2.y += spread * distance
        skewedPoint2.x += (spread * distance) / slope
        
        print("Post-spread 1: " + String(describing: skewedPoint1))
        print("Post-spread 2: " + String(describing: skewedPoint2))
      }
      
      
    }
    
    
    let finalPoint1 = skewedPoint1
    let finalPoint2 = skewedPoint2
    
    print("1: " + String(describing: finalPoint1))
    print("2: " + String(describing: finalPoint2))
    // -------------- //
    
    bezierPath.move(to: start)
    bezierPath.addCurve(to: end, controlPoint1: finalPoint1, controlPoint2: finalPoint2)
    //        UIColor.clear.setFill()
    //        bezierPath.fill()
    
    /// Calculate Angle of rotation for Arrow head ///
    
    // calculate the slope of virtual line between 'controlPoint2' and 'end'.
    let endSegRise = end.y - finalPoint2.y
    let endSegRun = end.x - finalPoint2.x
    
    
    endSegmentSlope = endSegRise / endSegRun
    print("Slope of End Segment: " + String(describing: endSegmentSlope))
    let DEG_90 = Double.pi / 2
    
    let angleToXAxis = Double(atan(endSegmentSlope))
    
    var referenceAngle = endSegRise > 0 ? (Double.pi + DEG_90) : DEG_90
    
    if angleToXAxis == 0 {
      print("Slope is ZERO")
      referenceAngle *= endSegRun > 0 ? 1 : -1
    }
      //        else if endSegRun == 0 {
      //            print("Slope is ZERO")
      //            referenceAngle *= endSegRise == 0 ? -1 : 1
      //        }
    else {
      referenceAngle *= endSegmentSlope > 0 ? -1 : 1
    }
    
    print("referenceAngle: " + String(describing: referenceAngle))
    
    // calculate angle
    print("Angle to X Axis: " + String(describing: angleToXAxis))
    
    arrowAngle = referenceAngle + angleToXAxis
    return bezierPath
  }
  
  func CGPointDistanceSquared(from: CGPoint, to: CGPoint) -> CGFloat {
    return (from.x - to.x) * (from.x - to.x) + (from.y - to.y) * (from.y - to.y)
  }
  
  func CGPointDistance(from: CGPoint, to: CGPoint) -> CGFloat {
    return sqrt(CGPointDistanceSquared(from: from, to: to))
  }
  
  var linePath: UIBezierPath {
    //        return UIBezierPath.arrow(from: CGPoint(x: 200, y: 650), to: CGPoint(x: 250, y: 400),
    //                                       tailWidth: 10, headWidth: 25, headLength: 40)
    let start = CGPoint(x: 250, y: 500)
    let end = CGPoint(x: 350, y: 318)
    let bezierPath = UIBezierPath()
    bezierPath.move(to: start)
    bezierPath.addCurve(to: end, controlPoint1: CGPoint(x: 275, y: 500), controlPoint2: CGPoint(x: 350, y: 350))
    UIColor.clear.setFill()
    bezierPath.fill()
    return bezierPath
  }
  
  func createCapPath(btmCenter: CGPoint, height: CGFloat, width: CGFloat) -> UIBezierPath {
    let bezierPath = UIBezierPath()
    
    // start at bottom-center of triangle
    //        bezierPath.move(to: top)
    //        let rightCorner = CGPoint(x: top.x + CGFloat(width / 2), y: top.y)
    //        bezierPath.addLine(to: rightCorner)
    //        topCorner = CGPoint(x: top.x, y: top.y - CGFloat(height))
    //        bezierPath.addLine(to: topCorner)
    //        let leftCorner = CGPoint(x: top.x - CGFloat(width / 2), y: top.y)
    //        bezierPath.addLine(to: leftCorner)
    //        bezierPath.close()
    
    // try starting at top corner of triangle instead (for consistency with final path) -- THAT'S IT!!!!
    bezierPath.move(to: btmCenter)
    let rightCorner = CGPoint(x: btmCenter.x + (width / 2), y: btmCenter.y)
    bezierPath.addLine(to: rightCorner)
    
    topCorner = CGPoint(x: btmCenter.x, y: btmCenter.y - height)
    bezierPath.addLine(to: topCorner)
    bezierPath.addLine(to: topCorner) // add twice for consistency with trapezoidal initial path
    
    let leftCorner = CGPoint(x: btmCenter.x - (width / 2), y: btmCenter.y)
    bezierPath.addLine(to: leftCorner)
    bezierPath.close()
    
    var pathTransform  = CGAffineTransform.identity
    pathTransform = pathTransform.translatedBy(x: btmCenter.x, y: btmCenter.y)
    pathTransform = pathTransform.rotated(by: CGFloat(arrowAngle))
    pathTransform = pathTransform.translatedBy(x: -btmCenter.x, y: -btmCenter.y)
    bezierPath.apply(pathTransform)
    
    createInitialArrowPath(btmCenter: btmCenter, width: width)
    return bezierPath
  }
  
  // Needs to be a trapezoid shape, that grows in height until it becomes a triangle.
  func createInitialArrowPath(btmCenter: CGPoint, width: CGFloat) {
    initialPath = UIBezierPath()
    initialPath.move(to: btmCenter)
    let rightBtm = CGPoint(x: btmCenter.x + (width / 2), y: btmCenter.y)
    initialPath.addLine(to: rightBtm)
    let rightTop = CGPoint(x: btmCenter.x + (width / 2), y: btmCenter.y)
    initialPath.addLine(to: rightTop)
    
    let leftTop = CGPoint(x: btmCenter.x - (width / 2), y: btmCenter.y)
    initialPath.addLine(to: leftTop)
    let leftBtm = CGPoint(x: btmCenter.x - (width / 2), y: btmCenter.y)
    initialPath.addLine(to: leftBtm)
    initialPath.close()
    
    var pathTransform  = CGAffineTransform.identity
    pathTransform = pathTransform.translatedBy(x: btmCenter.x, y: btmCenter.y)
    pathTransform = pathTransform.rotated(by: CGFloat(arrowAngle))
    pathTransform = pathTransform.translatedBy(x: -btmCenter.x, y: -btmCenter.y)
    initialPath.apply(pathTransform)
    
  }
  
  func createMask(top: CGPoint, height: Int, width: Int) -> UIBezierPath {
    let maskTop = CGPoint(x: top.x, y: top.y + 2)
    let maskHeight = height + 5
    let maskWidth = width + 2
    
    let bezierPath = UIBezierPath()
    
    bezierPath.move(to: maskTop)
    let rightCorner = CGPoint(x: maskTop.x + CGFloat(maskWidth / 2), y: maskTop.y)
    bezierPath.addLine(to: rightCorner)
    let topCorner = CGPoint(x: maskTop.x, y: maskTop.y - CGFloat(maskHeight))
    bezierPath.addLine(to: topCorner)
    let leftCorner = CGPoint(x: maskTop.x - CGFloat(maskWidth / 2), y: maskTop.y)
    bezierPath.addLine(to: leftCorner)
    bezierPath.close()
    
    //        self.createFinalMask(top: maskTop)
    
    var pathTransform  = CGAffineTransform.identity
    pathTransform = pathTransform.translatedBy(x: top.x, y: top.y)
    pathTransform = pathTransform.rotated(by: CGFloat(arrowAngle))
    pathTransform = pathTransform.translatedBy(x: -top.x, y: -top.y)
    bezierPath.apply(pathTransform)
    
    return bezierPath
  }
  
  
  
}



