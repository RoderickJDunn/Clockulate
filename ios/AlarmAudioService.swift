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
import CallKit

//import FDSoundActivatedRecorder

enum AlarmStatus: Int {
  case OFF
  case SET
  case RINGING
  case SNOOZED
}

@objc(AlarmAudioService)
class AlarmAudioService: RCTEventEmitter, FDSoundActivatedRecorderDelegate, CXCallObserverDelegate {
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
  var callObserver = CXCallObserver()

  let MAX_RING_DURATION = 90.0

  /** Tracks consecutive autosnooze calls, so that we don't ring endlessly if user doesn't hear the device. */
  var autosnoozeCnt = 0
  
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
    callObserver.setDelegate(self, queue: nil)
    
    
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
    
    self.displayWarningNotification()
    
    if let recorder = self.recorder {
      recorder.abort()  // called so that temporary recording file(s) is deleted in case of crash. (It can become very large)
    }
    
    self.isRecording = false;
  }
  
  @objc
  func audioWasInterupted(notification: Notification) {
    print("audioWasInterupted")

    self.displayWarningNotification()
    
    self.isRecording = false;
  }
  
  @objc
  func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) {
    print("Call status changed. Call-ended: \(call.hasEnded)")
    if call.hasEnded {
      self.displayWarningNotification()
    }
  }
  
  func displayWarningNotification() {
    print("displayWarningNotification? alarmStatus: \(self.alarmStatus)")
    if self.alarmStatus != AlarmStatus.OFF {
      let content = UNMutableNotificationContent()
      
      //adding title, subtitle, body and badge
      content.title = "Sleep analysis had to exit"
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
  }
  
  @objc
  func initializeAlarm(_ alarmInfo: NSDictionary, _ settings: NSDictionary, _ onCompletion: @escaping RCTResponseSenderBlock) {
      CKT_LOG("initializeAlarm (Native)")
    
    var error: String? = nil

    self.autosnoozeCnt = 0 // this is a good place to reset autosnoozeCount, since this function is only called due to direct user interaction with app.
    
    self.currAlarm = alarmInfo as! Dictionary<String,Any>
    
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
        
        // If self.isRecording == false, restart recording functionality. VERY IMPORTANT !!!!!!! Otherwise AlarmService does not resume after phone call, or other audio interruption
        // TODO: THIS NEEDS MORE TESTING
        if self.isRecording == false {
          AVAudioSession.sharedInstance().requestRecordPermission() { [unowned self] allowed in
            DispatchQueue.main.async {
              
              if allowed {
                self.beginMonitoringAudio()
              }
              
              self.isRecording = true
            }
          }
        }
      }
      else {
        error = "Received invalid date value"
      }
      
      onCompletion([error as Any]) // execute callback with nil on success, otherwise send erro
      return;
    }
    else if (alarmStatus == .SNOOZED) {
      /* This check is vital:
          When app is re-opened after Alarm triggers, then resumeAlarm is called on the off-chance that this Native audio recorder
          is not running (maybe app was terminated, or audio was interrupted by call, or something else) If app was terminated,
          alarmStatus would be .OFF, and Alarm would be initialized normally (not here). However, if audio was interrupted once
          alarm had already been snoozed, then the app was re-opened, we would end up here. In this case we need to restart
          recording, so that future triggers (snoozes) can occur with full sound playback while app is in the background.
       */
      
      // If snoozeTimer fireDate is in the future, leave it alone (the app was simply brought into the foreground). If the firedate is in the past, or the timer isValid==false, set snoozeTimer fresh.
      let timeUntilTrigger = self.alarmTimer.fireDate.timeIntervalSinceNow
      
      if self.alarmTimer.isValid == true && timeUntilTrigger > 0 {
        // snoozeTimer already set. Don't do anything to it
        print("INFO: Snooze timer already set and valid")
      }
      else {
        print("INFO: Snooze timer is NOT valid, or firedate in past. Resetting")
        
        // NOTE: This is a lazy hack to trick snoozeAlarm() into working in this scenario. Since we are already SNOOZED, snoozeAlarm won't do anything.
        // Therefore, I'm setting a fake status to simulate the alarm having just triggered, so that snoozeAlarm succesfully sets the timer etc.
        self.alarmStatus = AlarmStatus.RINGING
        
        let snoozeTmo = alarmInfo["snoozeTime"] as! Double
        self.snoozeAlarm(snoozeTmo)
      }
      
      
      /* If self.isRecording == false, we need to resume Recorder, so that full audio playback can occur again. */
      // TODO: THIS NEEDS TESTING
      if self.isRecording == false {
        AVAudioSession.sharedInstance().requestRecordPermission() { [unowned self] allowed in
          DispatchQueue.main.async {
            
            self.recorder!.sarMode = FDSoundActivatedRecorderMode.ignoreAll // ignore all disturbances while we in the snoozing/ringing period
            self.recorder?.rotationEnabled = false // rotation must be disabled, otherwise record() call fails once we start playing Audio
            
            if allowed {
              self.beginMonitoringAudio()
            }
            
            self.isRecording = true
            
          }
        }
      }
      
      // CKT_LOG("Alarm is already snoozed. Nothing to do here");
      onCompletion([error as Any])
      return;
    }

    AVAudioSession.sharedInstance().requestRecordPermission() { [unowned self] allowed in
      DispatchQueue.main.async {
          self.CKT_LOG("Got permission to record")
            self.CKT_LOG(alarmInfo.description)
        
            
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
            self.recorder?.rotationEnabled = true
        
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
      self.recorder?.rotationEnabled = false // disable rotation once alarm triggers, since once audio playback starts, future calls to record() will fail
      
      //                try AVAudioSession.sharedInstance().setActive(true)
      try AVAudioSession.sharedInstance().setCategory(AVAudioSession.Category.playback, options: AVAudioSession.CategoryOptions.duckOthers)
      print("AVAudioSession Category PlayAndRecord OK")

      //player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileType.mp3.rawValue)
      /* iOS 10 and earlier require the following line: */
      player = try AVAudioPlayer(contentsOf: url, fileTypeHint: AVFileType.mp3.rawValue)
      
      guard let player = player else { return }
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
      // Set audio-loop timer. Audio should loop until this timer expires, at which point the alarm will be automatically snoozed.
      var snoozeTime = userInfo["snoozeTime"] as! Double
      snoozeTime *= 60

      // calculate how long the Alarm should ring for. 
      // NOTE: It will ring for at MOST, MAX_RING_DURATION seconds. If snoozeTime is 1min, the alarm can only ring up until 5sec before the next snooze, otherwise backup
      //        notification may not be canceled in time.
      let autoSnoozeTmo = min(MAX_RING_DURATION, snoozeTime - 5) 
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
    
    self.alarmTimer.invalidate() // TODO: Unnecessary?


    // Check if we've passed the limit on auto-snoozes for this alarm.
    if self.autosnoozeCnt > 10 { // DEV: change to 10
        self.CKT_LOG("INFO: Surpassed autosnooze limit. Not snoozing anymore.")
        return;
    }
    
    self.autosnoozeCnt += 1
    
    var alarm = timer.userInfo as! Dictionary<String, AnyObject>

    // Emit AutoSnoozed event so JS knows to increment snoozeCount for this alarm
    sendEvent(withName: "onAutoSnoozed", body: ["alarm": alarm["id"]])
    
    var snoozeTime = alarm["snoozeTime"] as! Double
    snoozeTime *= 60
    
    // NOTE: I need to schedule the next snooze for the exact snoozeInterval since the last trigger.
    //      Otherwise, the next trigger will not execute in time to cancel the backup notifications.
    let autoSnoozeTime = min(MAX_RING_DURATION, snoozeTime - 5) // calculate how long the Alarm rang for

    // Subtract how long the alarm rang for, from snoozeTime. This gives usthe time left before the next snooze
    let timeTillSnooze = (snoozeTime - autoSnoozeTime) / 60

    self.CKT_LOG("snoozeTime: \(timeTillSnooze)")
  
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
    
    //if (self.isRecording == false) {
      // TODO: Restart recorder? NO. This is done in initializeAlarm, if necessary.
    //}

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
    
      fadein_cnt = 0
      if let player = player {
        player.stop()
      }

      let seconds = minutes * 60;
      DispatchQueue.main.async(execute: {
        self.alarmTimer = Timer.scheduledTimer(timeInterval: seconds, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
      })
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
