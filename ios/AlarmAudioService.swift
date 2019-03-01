//
//  AlarmAudioService.swift
//  Alarm_AutoSet
//
//  Created by Roderick Dunn on 2018-11-08.
//  Copyright © 2018 Facebook. All rights reserved.
//

import Foundation
import AVFoundation
import MediaPlayer
import UserNotifications
//import FDSoundActivatedRecorder

@objc(AlarmAudioService)
class AlarmAudioService: RCTEventEmitter, FDSoundActivatedRecorderDelegate {
  private let TAG = "AlarmAudioService: "
  
  var recorder: FDSoundActivatedRecorder?
  var isRecording = false
  var alarmTimer = Timer()
  var autoSnoozeTimer = Timer() /* Starts when alarm triggers, and if it expires, handler will automatically 'snooze' the Alarm. */
  var player: AVAudioPlayer?
  var volumeView = MPVolumeView()
  let FADE_IN_CB_LIMIT = 75
  let SYS_VOLUME_LIMIT: Float = 0.8
  var fadein_cnt = 0
  var currAlarm: Dictionary<String,Any> = [:]
  var refractoryTime = 300.0
  
  func CKT_LOG(_ msg: String) {
      print(TAG, msg)
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

    // return an array of event names that we can listen to
  override func supportedEvents() -> [String]! {
    return ["onNoiseDetected", "onAlarmTriggered"]
  }
  
  deinit {
    CKT_LOG("deinit")
    // perform the deinitialization
    //recorder = nil
  }
  
  override init() {
    super.init()
    CKT_LOG("init")
    
    if recorder == nil {
        CKT_LOG("recorder is nil. Re-initializing")
        recorder = FDSoundActivatedRecorder()
        CKT_LOG("Created recorder")
    }
    
    self.setupNotifications()
  }
  
  func setupNotifications() {
    let notificationCenter = NotificationCenter.default
    notificationCenter.addObserver(self,
                                   selector: #selector(audioWasInterupted),
                                   name: .AVAudioSessionInterruption,
                                   object: nil)
    
    notificationCenter.addObserver(self,
                                   selector: #selector(appWillTerminate),
                                   name: .UIApplicationWillTerminate,
                                   object: nil)
  }
  
  func appWillTerminate() {
     print("app will terminate")
    if isRecording {
    //if UIApplication.shared.applicationState == .background {
      let content = UNMutableNotificationContent()
      
      //adding title, subtitle, body and badge
      content.title = "Sleep analysis had to exit"
      //            content.subtitle = "iOS Development is fun"
      content.body = "Please re-open Clockulate to resume sleep analysis. This will also ensure that your alarm rings even if your phone is on Silent."
      content.badge = 1
      content.sound = UNNotificationSound.default()
      
      //getting the notification trigger
      //it will be called after 5 seconds
      let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
      
      //getting the notification request
      let request = UNNotificationRequest(identifier: "Recording Stopped", content: content, trigger: trigger)
      
      //adding the notification to notification center
      UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
   // }
    }
    self.isRecording = false;
  }
  
  func audioWasInterupted(notification: Notification) {
    print("audioWasInterupted")
    if isRecording {
      //if UIApplication.shared.applicationState == .background {
      let content = UNMutableNotificationContent()
      
      //adding title, subtitle, body and badge
      content.title = "Sleep analysis had to exit"
      //            content.subtitle = "iOS Development is fun"
      content.body = "Please open Clockulate to resume sleep analysis. This will also ensure that your alarm rings even if your phone is on Silent."
      content.badge = 1
      content.sound = UNNotificationSound.default()
      
      //getting the notification trigger
      //it will be called after 5 seconds
      let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
      
      //getting the notification request
      let request = UNNotificationRequest(identifier: "Recording Stopped", content: content, trigger: trigger)
      
      //adding the notification to notification center
      UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
      // }
    }
    
    self.isRecording = false;
  }
  
  @objc
  func initializeAlarm(_ alarmInfo: NSDictionary, _ settings: NSDictionary, _ onCompletion: RCTResponseSenderBlock) {
      CKT_LOG("starting to listen")
    
      CKT_LOG(alarmInfo.description)
      currAlarm = alarmInfo as! Dictionary<String,Any>
    
      currAlarm["userDelayOffset"] = 0 as Any
    
      // unpack settings
      refractoryTime = (settings["recCooldown"] as! Double) * 60
    
//      CKT_LOG("Setting refractoryTime to \(refractoryTime)")
      recorder?.refractoryPeriodLen = refractoryTime
      recorder?.subdirectory = currAlarm["instId"] as! String
    
      let ret = beginMonitoringAudio()
      var error: String? = nil
      if (ret) {
          CKT_LOG("setting alarm timer")
        
          if let date = RCTConvert.nsDate(alarmInfo["time"]) {
              let timeTillAlm = date.timeIntervalSinceNow
              self.CKT_LOG("TimeTillAlm: \(timeTillAlm)")
            
              self.alarmTimer.invalidate()
              // Audio initialization succeeded... set a timer for the time in alarmInfo, with callback of the function below (alarmDidTrigger). Set userInfo property of timer to sound file name.
              DispatchQueue.main.async(execute: {
                self.alarmTimer = Timer.scheduledTimer(timeInterval: timeTillAlm, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
              })
            
            self.isRecording = true
          }
          else {
              error = "Received invalid date value"
          }
        }
        else {
            error = "Failed to initialize Audio"
      }
    
      onCompletion([error as Any]) // execute callback with nil on success, otherwise send error
  }
  
 
  /* Sets up the audio recording functionality
   */
  func beginMonitoringAudio() -> Bool {
    
    if (self.isRecording) {
      CKT_LOG("Already recording")
      return true
    }
      // Try to start up microphone
      do {
        try AVAudioSession.sharedInstance().setCategory(AVAudioSessionCategoryPlayAndRecord, with: .mixWithOthers)
        print("AVAudioSession Category Playback OK")
        do {
          try AVAudioSession.sharedInstance().setActive(true)
          
          print("AVAudioSession is Active")
        } catch let error as NSError {
          print(error.localizedDescription)
        }
      } catch let error as NSError {
        print(error.localizedDescription)
      }
    
//      let documents = URL(fileURLWithPath: NSSearchPathForDirectoriesInDomains(FileManager.SearchPathDirectory.documentDirectory, FileManager.SearchPathDomainMask.userDomainMask, true)[0])
//      print("got docs url")
//
//      let url = documents.appendingPathComponent("record.caf") // TODO: Figure out if this is being saved anywhere
//      print("got recording file url")
//
//      let recordSettings: [String: Any] = [
//        AVFormatIDKey:              kAudioFormatAppleIMA4,
//        AVSampleRateKey:            44100.0,
//        AVNumberOfChannelsKey:      2,
//        AVEncoderBitRateKey:        12800,
//        AVLinearPCMBitDepthKey:     16,
//        AVEncoderAudioQualityKey:   AVAudioQuality.max.rawValue
//      ]
//      print("created settings")
//      do {
//        recorder = try AVAudioRecorder(url: url, settings: recordSettings)
//        recorder.delegate = self
//      } catch {
//        print("Failed to create recorder")
//        return false
//      }
//
//      print("Preparing to Record")
//      CKT_LOG("Is already recording? \(recorder.isRecording)")
//      recorder.prepareToRecord()
//      recorder.isMeteringEnabled = true
//      recorder.record()
//      print("Recording")
    
    
      recorder!.delegate = self
//      recorder.addObserver(self, forKeyPath: "microphoneLevel", options:.new, context: nil)
      recorder!.timeoutSeconds = 0
    recorder!.sarMode = FDSoundActivatedRecorderMode.recordOnTrigger // TODO: depending on IAP ?
      recorder!.startListening()
    
      return true
  }

  
  @objc
  func alarmDidTrigger(_ timer: Timer) {
    // set flag to ignore all noise (so analyzeAudio() doesn't think there is snoring happening)
    recorder!.sarMode = FDSoundActivatedRecorderMode.ignoreAll

    
    // Emit Trigger event for JS
    //      JS will cancel the corresponding backup notifications, and reschedule the rest.
    //      JS will also immediately present a LocalNotification for this Trigger.
    sendEvent(withName: "onAlarmTriggered", body: ["alarm": timer.userInfo as! Dictionary<String, AnyObject>])
    
    // play the alarm sound found in userInfo
    let userInfo = timer.userInfo as! Dictionary<String, AnyObject>
    guard let soundFileName = userInfo["sound"] as! String? else {
      CKT_LOG("ERROR: Failed to find sound in userInfo.")
      return
    }
    
    CKT_LOG("alarmDidTrigger: Playing \(String(describing: soundFileName))")
    
    // TODO: Play audio
    guard let url = Bundle.main.url(forResource: soundFileName, withExtension: "mp3") else {
      CKT_LOG("ERROR: Failed to find soundfile: \(soundFileName)")
      return
    }
    
    print("Found sound file")
   
    do {
      //                try AVAudioSession.sharedInstance().setActive(true)
      try AVAudioSession.sharedInstance().setCategory(AVAudioSessionCategoryPlayback, with: .duckOthers)
    print("AVAudioSession Category PlayAndRecord OK")

      //player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileType.mp3.rawValue)
      /* iOS 10 and earlier require the following line: */
      player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileTypeMPEGLayer3)
      
      guard let player = player else { return }
      print("AVAudioSession Category Playback OK")
      player.prepareToPlay()
      
      player.volume = 0
      MPVolumeView.setVolume(0.8)
      DispatchQueue.main.async(execute: {
        self.alarmTimer = Timer.scheduledTimer(timeInterval: 0.5, target: self, selector: #selector(self.fadeInVolume), userInfo: nil, repeats: true)
      })
      
      player.play()
//      player.volume = 0
//      MPVolumeView.setVolume(0)
      
      print("AVAudioSession is Active")
      
      self.CKT_LOG("Setting playback timeout timer")
      // TODO: Set audio-loop timer. Audio should loop until this timer expires, at which point
      //        the alarm will be automatically snoozed.
      var autoSnoozeTmo = userInfo["snoozeTime"] as! Double
      autoSnoozeTmo *= 60
      autoSnoozeTmo = min(90, autoSnoozeTmo - 5)
      // autoSnoozeTmo = 20 // DEV: setting autoSnooze time to 20sec for DEV.
      DispatchQueue.main.async(execute: {
        self.autoSnoozeTimer = Timer.scheduledTimer(timeInterval: autoSnoozeTmo, target: self, selector: #selector(self.automaticSnooze), userInfo: self.currAlarm, repeats: false)
      })
      
    } catch {
      print(error.localizedDescription)
    }
  }
  
  @objc
  func automaticSnooze(_ timer: Timer) {
    self.CKT_LOG("Setting automaticSnooze")
    var alarm = timer.userInfo as! Dictionary<String, AnyObject>
    let userDelayOffset = alarm["userDelayOffset"] as! Double
    var snoozeCount = alarm["snoozeCount"] as! Double
    let snoozeTime = alarm["snoozeTime"] as! Double
    snoozeCount += 1
    
    self.CKT_LOG("snoozeCount: \(snoozeCount)")
    self.CKT_LOG("snoozeTime: \(snoozeTime)")
    
    // Calculate time until snooze
    let offsetAfterWake = snoozeCount * snoozeTime + userDelayOffset // TODO: + offset_due_to_cummulative_explicit_snooze_delay
    
    if let wakeUpTime = RCTConvert.nsDate(alarm["time"]) {
      let dateOfSnooze = wakeUpTime.addingTimeInterval(offsetAfterWake * 60)
      let timeTillSnooze = dateOfSnooze.timeIntervalSinceNow / 60 // Convert to minutes, since I'm passing it to snoozeAlarm()
      self.CKT_LOG("Time until Snooze: \(timeTillSnooze)")
      
      self.alarmTimer.invalidate()
      // Audio initialization succeeded... set a timer for the time in alarmInfo, with callback of the function below (alarmDidTrigger). Set userInfo property of timer to sound file name.

      // the offset due to user-delay in explicit snooze has not changed, since this autoSnooze function triggered.
      self.snoozeAlarm(timeTillSnooze, userDelayOffset)
      
      self.isRecording = true
    }
    else {
      self.CKT_LOG("ERROR: Failed to calculate snooze time automatically.")
    }
    
    
  }
  
  @objc
  func fadeInVolume(){
    CKT_LOG("Fade in volume")
    //MPVolumeView.incrVolume(0.03)
    
    if let player = player {
      if player.volume < 0.10 {
           player.volume += 0.005
      }
      else if player.volume < 0.5 {
        player.volume += 0.015
      }
      CKT_LOG("player volume: \(player.volume)")
      fadein_cnt += 1
    
      // hard limit here to prevent infinite calls of this function
        if (fadein_cnt >= FADE_IN_CB_LIMIT || player.volume > 0.5) {
          player.volume = 0.5
          //MPVolumeView.setVolume(SYS_VOLUME_LIMIT)
          self.alarmTimer.invalidate()
          fadein_cnt = 0
        }
    }
    else {
      self.alarmTimer.invalidate()
      fadein_cnt = 0
    }
  }
  
  @objc
  func snoozeAlarm(_ minutes : Double, _ userDelayOffset : Double) {
    
    // Invalidate timers first.
    // This is called by JS from explicit (or implicit?) snooze, but autoSnoozeTimer callback also calls this function,
    //    so that timer must be invalidated right away to avoid a double call to this.
    self.autoSnoozeTimer.invalidate()
    
    // Invalidate this timer to stop fade-in audio timer functionality (since we are stopping audio next anyway).
    self.alarmTimer.invalidate()
    
    self.CKT_LOG("Native snoozeAlarm: \(minutes) minutes")
    
    self.CKT_LOG("userDelayOffset: \(userDelayOffset) minutes")

     currAlarm["userDelayOffset"] = userDelayOffset as Any
    
    // Increment snoozeCount of currAlarm class var.
    var snoozeCount = self.currAlarm["snoozeCount"] as! Int
    snoozeCount += 1
    self.CKT_LOG("snoozeCount: \(snoozeCount)")
    self.currAlarm["snoozeCount"] = snoozeCount as Any
    
      if (self.isRecording != true) {
        self.CKT_LOG("AlarmService is not recording. Not snoozing any alarm..")
        return;
      }
    

      fadein_cnt = 0
      guard let player = player else { return }
      player.stop()
    

      let seconds = minutes * 60;
      DispatchQueue.main.async(execute: {
        self.alarmTimer = Timer.scheduledTimer(timeInterval: seconds, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
      })
  }
  
  @objc
  func turnOffAlarm() {
    CKT_LOG("Turning off alarm")
    self.alarmTimer.invalidate()
    fadein_cnt = 0
    if let player = player {
        player.stop()
    }
    
    recorder!.abort() // TODO: ?? or a better function
    self.isRecording = false
      
  }
  
  /* Delegate Methods */
  
  /// A recording was triggered or manually started
  func soundActivatedRecorderDidStartRecording(_ recorder: FDSoundActivatedRecorder) {
      print("soundActivatedRecorderDidStartRecording")
//    progressView.progressTintColor = UIColor.red
//    guard let oldDistCount = disturbanceCount.text else {
//      return
//    }
//
//    if var cnt = Int(oldDistCount) {
//      cnt += 1
//      disturbanceCount.text = String(cnt)
//    }
  }
  
  /// No recording has started or been completed after listening for `TOTAL_TIMEOUT_SECONDS`
  func soundActivatedRecorderDidTimeOut(_ recorder: FDSoundActivatedRecorder) {
      print("soundActivatedRecorderDidTimeOut")
//    progressView.progressTintColor = UIColor.blue
  }
  
  /// The recording and/or listening ended and no recording was captured
  func soundActivatedRecorderDidAbort(_ recorder: FDSoundActivatedRecorder) {
      print("soundActivatedRecorderDidAbort")
      self.isRecording = false

//    progressView.progressTintColor = UIColor.blue
//
//    if UIApplication.shared.applicationState == .background {
//      let content = UNMutableNotificationContent()
//
//      //adding title, subtitle, body and badge
//      content.title = "Sleep analysis had to exit"
//      //            content.subtitle = "iOS Development is fun"
//      content.body = "Please re-open Clockulate to resume sleep data collection"
//      content.badge = 1
//      content.sound = UNNotificationSound.default()
//
//      //getting the notification trigger
//      //it will be called after 5 seconds
//      let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
//
//      //getting the notification request
//      let request = UNNotificationRequest(identifier: "Recording Stopped", content: content, trigger: trigger)
//
//      //adding the notification to notification center
//      UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
//    }
    
  }
  
  /// A recording was successfully captured
  func soundActivatedRecorderDidFinishRecording(_ recorder: FDSoundActivatedRecorder, _ timestamp: String, _ duration: Double, andSaved file: URL?) {
      print("soundActivatedRecorderDidFinishRecording")
//      print("file: \(file)")
    let recPath = file != nil ? file?.lastPathComponent : ""
    sendEvent(withName: "onNoiseDetected", body: ["file": recPath, "timestamp": timestamp, "duration": duration])
    //    print("soundActivatedRecorderDidFinishRecording")
//    progressView.progressTintColor = UIColor.blue
//    savedURLs.append(file)
    //        recorder.startRecording()
    
  }
}


extension MPVolumeView {
  static func setVolume(_ volume: Float) {
    let volumeView = MPVolumeView()
    let slider = volumeView.subviews.first(where: { $0 is UISlider }) as? UISlider
    
    DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 0.1) {
      slider?.value = volume
    }
  }
  
  static func incrVolume(_ byVolume: Float) {
    let volumeView = MPVolumeView()
    let slider = volumeView.subviews.first(where: { $0 is UISlider }) as? UISlider
    
    DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + 0.1) {
      print("now at \(slider!.value)")
      if let currValue = slider?.value {
        if (currValue.isLess(than: 0.8)) { // setting a limit below max since 1.00 distorts
          slider?.value += byVolume
        }
      }

    }
  }
}
