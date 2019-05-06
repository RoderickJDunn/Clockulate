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

enum AlarmStatus: Int {
  case OFF
  case SET
  case RINGING
  case SNOOZED
}

@objc(AlarmAudioService)
class AlarmAudioService: RCTEventEmitter, FDSoundActivatedRecorderDelegate {
  private let TAG = "AlarmAudioService: "
  
  var recorder: FDSoundActivatedRecorder?
  var isRecording = false
  var alarmStatus = AlarmStatus.OFF
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
    return ["onNoiseDetected", "onAlarmTriggered", "onAutoSnoozed"]
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
    
    // NOTE: this is to setup NSNotifications, which are internal to program (not related to User Notifications)
    self.setupNotifications()
  }
  
  func setupNotifications() {
    let notificationCenter = NotificationCenter.default
    notificationCenter.addObserver(self,
                                   selector: #selector(audioWasInterupted),
                                   name: AVAudioSession.interruptionNotification,
                                   object: nil)
    
    notificationCenter.addObserver(self,
                                   selector: #selector(appWillTerminate),
                                   name: UIApplication.willTerminateNotification,
                                   object: nil)
  }
  
  @objc
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
      content.sound = UNNotificationSound.default
      
      //getting the notification trigger
      //it will be called after 5 seconds
      let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
      
      //getting the notification request
      let request = UNNotificationRequest(identifier: "Recording Stopped", content: content, trigger: trigger)
      
      //adding the notification to notification center
      UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
      
    }
    
    if let recorder = self.recorder {
      recorder.abort()  // called so that temporary recording file(s) is deleted in case of crash. (It can become very large)
    }
    
    self.isRecording = false;
  }
  
  @objc
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
      content.sound = UNNotificationSound.default
      
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
  func initializeAlarm(_ alarmInfo: NSDictionary, _ settings: NSDictionary, _ onCompletion: @escaping RCTResponseSenderBlock) {
      CKT_LOG("initializeAlarm (Native)")
    
    var error: String? = nil
    
    if (alarmStatus == .SET) {
      CKT_LOG("Alarm already SET. Updating parameters")
      
      if let date = RCTConvert.nsDate(alarmInfo["time"]) {
        let timeTillAlm = date.timeIntervalSinceNow
        self.CKT_LOG("TimeTillAlm: \(timeTillAlm)")
        
        
        // Only set timer if the time is in the future. Its possible that this is called when app is re-opened, and therefore, the
        //  alarm time could be in the past.
        if timeTillAlm > 0 {
          self.alarmTimer.invalidate()
          // Audio initialization succeeded... set a timer for the time in alarmInfo, with callback of the function below (alarmDidTrigger). Set userInfo property of timer to sound file name.
          DispatchQueue.main.async(execute: {
            self.alarmTimer = Timer.scheduledTimer(timeInterval: timeTillAlm, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
          })
        }
        self.isRecording = true
      }
      else {
        error = "Received invalid date value"
      }
      
      onCompletion([error as Any]) // execute callback with nil on success, otherwise send erro
      return;
    }
    else if (alarmStatus == .SNOOZED) {
      /* This check is vital:
          When app is re-opened after Alarm triggers, then resumeAlarm is called on the off-chance that this NativeAudio service
          has stopped running (maybe app was terminated.) If that's the case, alarmStatus would be .OFF, and Alarm would be
          initialized properly. However, in this case (SNOOZED), we can just ignore the initialize call, since snoozing timer
          has already been handled.
       */
      CKT_LOG("Alarm is already snoozed. Nothing to do here");
      onCompletion([error as Any])
      return;
    }

    AVAudioSession.sharedInstance().requestRecordPermission() { [unowned self] allowed in
      DispatchQueue.main.async {
          self.CKT_LOG("Got permission to record")
            self.CKT_LOG(alarmInfo.description)
            self.currAlarm = alarmInfo as! Dictionary<String,Any>
            
            // NOTE: userDelayOffset : This is used when the autoSnooze timer fires to calculate when the next snooze should be scheduled for.
            //      Theres a good chance that there is a better way to calculate that, but this does seem to work.
            //      A simpler way may be to just calculate how long the autoSnoozeTimer takes (just use the same formula min(90, snoozeTime - 5)),
            //        then subtract this from snoozeTime. That should give how much time is left before the next snooze....
        //      currAlarm["userDelayOffset"] = 0 as Any
            
            // unpack settings
            if let cooldown = settings["recCooldown"] as? Double {
                self.refractoryTime = cooldown * 60
            }
            else {
                self.CKT_LOG("WARN: recCooldown setting is nil. Assigning 5 minutes by default")
                self.refractoryTime = 5 * 60
            }
            
            self.CKT_LOG("Setting refractoryTime to \(self.refractoryTime)")
            self.recorder?.refractoryPeriodLen = self.refractoryTime
            self.recorder?.subdirectory = self.currAlarm["instId"] as! String
        
            if allowed {
              self.beginMonitoringAudio()
            }
        
            self.CKT_LOG("setting alarm timer")
        
            self.alarmStatus = AlarmStatus.SET
        
            if let date = RCTConvert.nsDate(alarmInfo["time"]) {
                let timeTillAlm = date.timeIntervalSinceNow
                self.CKT_LOG("TimeTillAlm: \(timeTillAlm)")
              
              
                // Only set timer if the time is in the future. Its possible that this is called when app is re-opened, and therefore, the
                //  alarm time could be in the past.
                if timeTillAlm > 0 {
                  self.alarmTimer.invalidate()
                  // Audio initialization succeeded... set a timer for the time in alarmInfo, with callback of the function below (alarmDidTrigger). Set userInfo property of timer to sound file name.
                  DispatchQueue.main.async(execute: {
                      self.alarmTimer = Timer.scheduledTimer(timeInterval: timeTillAlm, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
                  })
                }
                else {
                  // if Alarm time is in the past, trigger right away. Hopefully, the only way this situation would occurs
                  //  is if user waits with the RecordPermission popup showing, until the Alarm time passes.
                  DispatchQueue.main.async(execute: {
                    self.alarmTimer = Timer.scheduledTimer(timeInterval: 0, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
                  })
                }
                self.isRecording = true
            }
            else {
                error = "Received invalid date value"
            }
      
            
            onCompletion([error as Any]) // execute callback with nil on success, otherwise send error
        }
    }
  }
  
 
  /* Sets up the audio recording functionality
   */
  func beginMonitoringAudio() {
    CKT_LOG("checking if we are already recording")
    if (self.isRecording) {
      CKT_LOG("Already recording")
      return
    }
      // Try to start up microphone
      do {
        print("Trying to start up mic")

        try AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playAndRecord, options: AVAudioSession.CategoryOptions.duckOthers)
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
    
    
      recorder!.delegate = self
//      recorder.addObserver(self, forKeyPath: "microphoneLevel", options:.new, context: nil)
      recorder!.timeoutSeconds = 0
    recorder!.sarMode = FDSoundActivatedRecorderMode.recordOnTrigger // TODO: depending on IAP ?
      recorder!.startListening()
  }

  
  @objc
  func alarmDidTrigger(_ timer: Timer) {
    // set flag to ignore all noise (so analyzeAudio() doesn't think there is snoring happening)
    recorder!.sarMode = FDSoundActivatedRecorderMode.ignoreAll
    
    self.alarmStatus = AlarmStatus.RINGING

    var evtInfo = timer.userInfo as! Dictionary<String, AnyObject>
    var stateStr = "Unknown"
    let state = UIApplication.shared.applicationState
    if (state == .active) {
      print("App State: active!")
      stateStr = "active"
    }
    else if (state == .inactive) {
      print("App State: Inactive!")
      stateStr = "inactive"
    }
    else if (state == .background) {
      print("App State: Background!")
      stateStr = "background"
    }
    else {
      print("App State: unknownn........")

    }
    evtInfo["appState"] = stateStr as AnyObject?
    
    // Emit Trigger event for JS
    //      JS will cancel the corresponding backup notifications, and reschedule the rest.
    //      JS will also immediately present a LocalNotification for this Trigger.
    sendEvent(withName: "onAlarmTriggered", body: ["alarm": evtInfo])
    
    // play the alarm sound found in userInfo
    let userInfo = timer.userInfo as! Dictionary<String, AnyObject>
    guard let soundFileName = userInfo["sound"] as! String? else {
      CKT_LOG("ERROR: Failed to find sound in userInfo.")
      return
    }
    
    CKT_LOG("alarmDidTrigger: Playing \(String(describing: soundFileName))")
    
    // Play audio
    guard let url = Bundle.main.url(forResource: soundFileName, withExtension: "mp3") else {
      CKT_LOG("ERROR: Failed to find soundfile: \(soundFileName)")
      return
    }
    
    print("Found sound file")
   
    do {
      //                try AVAudioSession.sharedInstance().setActive(true)
      try AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playback, options: AVAudioSession.CategoryOptions.duckOthers)
      print("AVAudioSession Category PlayAndRecord OK")

      //player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileType.mp3.rawValue)
      /* iOS 10 and earlier require the following line: */
      player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileType.mp3.rawValue)
      
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
      autoSnoozeTmo = min(90, autoSnoozeTmo - 5) // NOTE: I need to limit to less than snoozeTime otherwise backup notification may not be canceled in time.
      // autoSnoozeTmo = 20 // DEV: setting autoSnooze time to 20sec for DEV.
      DispatchQueue.main.async(execute: {
        self.autoSnoozeTimer = Timer.scheduledTimer(timeInterval: autoSnoozeTmo, target: self, selector: #selector(self.automaticSnooze), userInfo: self.currAlarm, repeats: false)
      })
      
    } catch {
      print(error.localizedDescription)
    }
  }
  
//  @objc
//  func automaticSnooze(_ timer: Timer) {
//    self.CKT_LOG("Setting automaticSnooze")
//
//    var alarm = timer.userInfo as! Dictionary<String, AnyObject>
//
//    // Emit AutoSnoozed event so JS knows to increment snoozeCount for this alarm
//    sendEvent(withName: "onAutoSnoozed", body: ["alarm": alarm["id"]])
//
//    let snoozeTime = alarm["snoozeTime"] as! Double
//
//
//    // Calculate time until snooze
//    let autoSnoozeTime = min(90, snoozeTime - 5)
//    let timeTillSnooze = snoozeTime - autoSnoozeTime
//
//    if let wakeUpTime = RCTConvert.nsDate(alarm["time"]) {
//      let dateOfSnooze = wakeUpTime.addingTimeInterval(offsetAfterWake)
//      let timeTillSnooze = dateOfSnooze.timeIntervalSinceNow / 60 // Convert to minutes, since I'm passing it to snoozeAlarm()
//      self.CKT_LOG("Time until Snooze: \(timeTillSnooze)")
//
//      self.alarmTimer.invalidate()
//      // Audio initialization succeeded... set a timer for the time in alarmInfo, with callback of the function below (alarmDidTrigger). Set userInfo property of timer to sound file name.
//
//      // the offset due to user-delay in explicit snooze has not changed, since this autoSnooze function triggered.
//      self.snoozeAlarm(timeTillSnooze, userDelayOffset)
//
//      self.isRecording = true
//    }
//    else {
//      self.CKT_LOG("ERROR: Failed to calculate snooze time automatically.")
//    }
//
//
//  }
  
  @objc
  func automaticSnooze(_ timer: Timer) {
    self.CKT_LOG("Setting automaticSnooze")
    
    self.alarmTimer.invalidate() // TODO: Unnecessary?

    var alarm = timer.userInfo as! Dictionary<String, AnyObject>

    // Emit AutoSnoozed event so JS knows to increment snoozeCount for this alarm
    sendEvent(withName: "onAutoSnoozed", body: ["alarm": alarm["id"]])
    
    let snoozeTime = alarm["snoozeTime"] as! Double
    
    // NOTE: I need to schedule the next snooze for the exact snoozeInterval since the last trigger.
    //      Otherwise, the next trigger will not execute in time to cancel the backup notifications.
    let autoSnoozeTime = min(90, snoozeTime - 5)
    let timeTillSnooze = (snoozeTime - autoSnoozeTime) / 60
    // ** //

    self.CKT_LOG("snoozeTime: \(timeTillSnooze)")
  
    // Calculate time until snooze
    self.snoozeAlarm(timeTillSnooze)

    self.isRecording = true
 


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
  func snoozeAlarm(_ minutes : Double) {
    

    // Invalidate timers first.
    // This is called by JS from explicit (or implicit?) snooze, but autoSnoozeTimer callback also calls this function,
    //    so that timer must be invalidated right away to avoid a double call to this.
    self.autoSnoozeTimer.invalidate()
    
    // Invalidate this timer to stop fade-in audio timer functionality (since we are stopping audio next anyway).
    self.alarmTimer.invalidate()
    
    if (self.alarmStatus == AlarmStatus.SNOOZED) {
      CKT_LOG("Alarm is already Snoozed. Ignoring")
      return
    }
    
    self.alarmStatus = AlarmStatus.SNOOZED
    
    if (self.isRecording == false) {
      // TODO: Restart recorder?
    }

    self.CKT_LOG("Native snoozeAlarm: \(minutes) minutes")
    
    var snoozeCount = 0

    // Increment snoozeCount of currAlarm class var.
    if let sCnt = self.currAlarm["snoozeCount"] as? Int {
      snoozeCount = sCnt
    }

    snoozeCount += 1
    self.CKT_LOG("snoozeCount: \(snoozeCount)")
    self.currAlarm["snoozeCount"] = snoozeCount as Any
    
    
    // NOTE: I don't know why I thought this was necessary. I'm trying without it because of the following scenario:
    //        App terminates before wakeUpTime. User opens app after wakeUpTime (eg. once backup notification delevered).
    //        ImplicitSnooze code calls this function, but does not start the snooze timer because isRecording == false,
    //        since the app just re-opened so audio recording had been stopped.
//      if (self.isRecording != true) {
//        self.CKT_LOG("AlarmService is not recording. Not snoozing any alarm..")
//        return;
//      }
    
    print("1")

      fadein_cnt = 0
      if let player = player {
        player.stop()
      }
    print("2")

      let seconds = minutes * 60;
      DispatchQueue.main.async(execute: {
        self.alarmTimer = Timer.scheduledTimer(timeInterval: seconds, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
      })
    
     print("3")
  }
  
  @objc
  func turnOffAlarm() {
    CKT_LOG("Turning off alarm")
    self.alarmTimer.invalidate()
    self.autoSnoozeTimer.invalidate()
    fadein_cnt = 0
    if let player = player {
        player.stop()
    }
    
    recorder!.abort() // TODO: ?? or a better function
    self.isRecording = false
    self.alarmStatus = AlarmStatus.OFF
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
