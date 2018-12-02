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
//import FDSoundActivatedRecorder

@objc(AlarmAudioService)
class AlarmAudioService: RCTEventEmitter, FDSoundActivatedRecorderDelegate {
  private let TAG = "AlarmAudioService: "
  
  var recorder = FDSoundActivatedRecorder()
  var alarmTimer = Timer()
  var refractoryTimer = Timer()
  var auxAnalyzeTimer = Timer()
//  var recorder: AVAudioRecorder!
  var player: AVAudioPlayer?
  var volumeView = MPVolumeView()
  let FADE_IN_CB_LIMIT = 75
  let SYS_VOLUME_LIMIT: Float = 0.8
  var fadein_cnt = 0
  var currAlarm: NSDictionary = [:]
  
  func CKT_LOG(_ msg: String) {
      print(TAG, msg)
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

    // return an array of event names that we can listen to
  override func supportedEvents() -> [String]! {
    return ["onNoiseDetected"]
  }
  
  override init() {
    super.init()
    AVAudioSession.sharedInstance().requestRecordPermission() { [unowned self] allowed in
      DispatchQueue.main.async {
        if allowed {
          self.CKT_LOG("Got permission to record")
        } else {
          self.CKT_LOG("Denied permission to record")
        }
      }
    }
  }
  
  @objc
  func initializeAlarm(_ alarmInfo: NSDictionary, _ onCompletion: RCTResponseSenderBlock) {
      CKT_LOG("starting to listen")
    
      CKT_LOG(alarmInfo.description)
      currAlarm = alarmInfo
    
      let ret = beginMonitoringAudio()
      var error: String? = nil
      if (ret) {
          CKT_LOG("setting alarm timer")
        
          if let date = RCTConvert.nsDate(alarmInfo["time"]) {
              let timeTillAlm = date.timeIntervalSinceNow
              self.CKT_LOG("TimeTillAlm: \(timeTillAlm)")
              // Audio initialization succeeded... set a timer for the time in alarmInfo, with callback of the function below (alarmDidTrigger). Set userInfo property of timer to sound file name.
              DispatchQueue.main.async(execute: {
                self.alarmTimer = Timer.scheduledTimer(timeInterval: timeTillAlm, target: self, selector: #selector(self.alarmDidTrigger), userInfo: self.currAlarm, repeats: false)
              })
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
    
    
      recorder.delegate = self
//      recorder.addObserver(self, forKeyPath: "microphoneLevel", options:.new, context: nil)
      recorder.timeoutSeconds = 0
    recorder.sarMode = FDSoundActivatedRecorderMode.recordOnTrigger // TODO: depending on IAP ?
      recorder.startListening()
    
//      auxAnalyzeTimer = Timer.scheduledTimer(timeInterval: 0.05, target: self, selector: #selector(analyzeAudio), userInfo: nil, repeats: true)
    
      return true
  }

  
  /* This function will record audio to a file, for up to 1 minute. */
  func recordToFile() {
    
  }
  
  /* Called on the completion of a recording (to file), with a duration of 1-minute or less
      Emits an event to JS containing the file name so that JS can update the recording table of the database.
      This fn also sets the refractory_period timer (so that another recording is not started too soon)
   */
  func recordingDidFinish() {
    
    // setTimer(onEndRefractoryPeriod, 5minutes)
  }
  
  
  /* Called when the refractory period completes. At this point, level-monitoring can resume,
    UNLESS there has been too many recordings for this night.
   */
  func onEndRefractoryPeriod() {
    // if (recordingCount < 10) { beginMonitoringAudio(); }
  }
  
  
  @objc
  func alarmDidTrigger(_ timer: Timer) {
    // set flag to ignore all noise (so analyzeAudio() doesn't think there is snoring happening)
    recorder.sarMode = FDSoundActivatedRecorderMode.ignoreAll


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
    } catch {
      print(error.localizedDescription)
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
  func snoozeAlarm(_ minutes : Double) {
      self.CKT_LOG("Native snoozeAlarm")
      self.alarmTimer.invalidate()
      fadein_cnt = 0
      guard let player = player else { return }
      player.stop()
    

      self.CKT_LOG("NativeSnooze for: \(minutes) minutes")
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
    
    recorder.abort() // TODO: ?? or a better function
      
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
