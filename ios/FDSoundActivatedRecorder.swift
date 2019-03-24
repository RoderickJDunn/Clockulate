//
//  FDSoundActivatedRecorder.swift
//  FDSoundActivatedRecorder
//
//  Created by William Entriken on 1/28/16.
//  Copyright © 2016 William Entriken. All rights reserved.
//

import Foundation
import AVFoundation

/*
 * HOW RECORDING WORKS
 *
 * V               Recording
 * O             /-----------\
 * L            /             \Fall
 * U           /Rise           \
 * M          /                 \
 * E  --------                   --------
 *    Listening                  Done
 *
 * We listen and save audio levels every `INTERVAL`
 * When several consecutive levels exceed the recent moving average by a threshold, we record
 * (The exceeding levels are not included in the moving average)
 * When several consecutive levels deceed the recent moving average by a threshold, we stop recording
 * (The deceeding levels are not included in the moving average)
 *
 * The final recording includes RISE, RECORDING, and FALL sections and the RISE and FALL
 * parts are faded in and out to avoid clicking sounds at either end, you're welcome! Please
 * mail a case of beer to: Wm Entriken / 410 Keats Rd / Huntingdon Vy PA 19006 USA
 *
 * Our "averages" are time averages of log squared power, an odd definition
 * SEE: Averaging logs http://physics.stackexchange.com/questions/46228/averaging-decibels
 *
 * Please don't forget to use:
 * try? AVAudioSession.sharedInstance().setCategory(AVAudioSessionCategoryPlayAndRecord)
 */

/// These should be optional but I don't know how to do that in Swift
@objc public protocol FDSoundActivatedRecorderDelegate {
    /// A recording was triggered or manually started
    func soundActivatedRecorderDidStartRecording(_ recorder: FDSoundActivatedRecorder)
    
    /// No recording has started or been completed after listening for `timeoutSeconds`
    func soundActivatedRecorderDidTimeOut(_ recorder: FDSoundActivatedRecorder)
    
    /// The recording and/or listening ended and no recording was captured
    func soundActivatedRecorderDidAbort(_ recorder: FDSoundActivatedRecorder)
    
    /// A recording was successfully captured
  func soundActivatedRecorderDidFinishRecording(_ recorder: FDSoundActivatedRecorder, _ timestamp: String,  _ duration: Double, andSaved file:URL?)
}

func print(_ items: Any...) {
  #if DEBUG
  items.forEach { item in
    Swift.print(item, terminator:"")
  }
  Swift.print("")
  #endif
}

@objc public enum FDSoundActivatedRecorderStatus: Int {
    case inactive
    case listening
    case recording
    case processingRecording
    case refractoryPeriod
}

@objc public enum FDSoundActivatedRecorderMode: Int {
    case recordOnTrigger
    case notifyOnlyOnTrigger
    case ignoreAll
}

/// An automated listener / recorder
open class FDSoundActivatedRecorder: NSObject, AVAudioRecorderDelegate {
    
    /// Number of seconds until recording stops automatically
    public var timeoutSeconds = 10.0
    
    /// A time interval in seconds to base all `INTERVALS` below
    public var intervalSeconds = 0.05
    
    /// Minimum amount of time (in INTERVALS) to listen but not cause rise triggers
    public var listeningMinimumIntervals = 2
    
    /// Amount of time (in INTERVALS) to average when deciding to trigger for listening
    public var listeningAveragingIntervals = 7
    
    /// Relative signal strength (in dB) to detect triggers versus average listening level
    public var riseTriggerDb = 18.0 // used to be 13, but seemed to be very sensitivex`
    
    /// Number of triggers to begin recording
    public var riseTriggerIntervals = 2
    
    /// Minimum amount of time (in INTERVALS) to record
    public var recordingMinimumIntervals = 4
    
    /// Amount of time (in INTERVALS) to average when deciding to stop recording
    public var recordingAveragingIntervals = 15
    
    /// Relative signal strength (in Db) to detect triggers versus average recording level
    public var fallTriggerDb = 10.0
    
    /// Number of triggers to end recording
    public var fallTriggerIntervals = 40  // @Roderick (was 2) -- increased to 40 (40 * 0.05sec == 2-seconds)
    
    /// Recording sample rate (in Hz)
    public var savingSamplesPerSecond = 22050
    
    /// Threashold (in Db) which is considered silence for `microphoneLevel`. Does not affect speech detection, only the `microphoneLevel` value.
    public var microphoneLevelSilenceThreshold = -36.0
    
    /// Behavior of sound-activated-recorder when triggered. Either notifies+records, or just notifies.
    public var sarMode: FDSoundActivatedRecorderMode = .recordOnTrigger
    
    /* Maximum permitted recording length in a given hour
     This, however, is a soft limit. A recording that itself causes totalRecDurationThisHour to increase to > maxRecordingDurationPerHour will be allowed to continue. But the next one won't.
     but new recordings will not be saved if totalRecDurationThisHour > maxRecordingDurationPerHour.
     Production value: 300.0 (5 minutes)
    */
    public var maxRecordingDurationPerHour = 300
    
    public var maxRecordingLength = 20.0 // seconds. Production value: 20.0
    
    public var refractoryPeriodLen = 300.0 // seconds. Production value: 300.0 (5 minutes)
  
    public var subdirectory = ""  { // sub-directory of Documents, in which disturbances should be saved
        didSet {
            let paths = NSSearchPathForDirectoriesInDomains(FileManager.SearchPathDirectory.documentDirectory, FileManager.SearchPathDomainMask.userDomainMask, true)
          
            let documentsDirectory = paths.first! as NSString

            let dirPath = documentsDirectory.appendingPathComponent(subdirectory)

            // let trimmedAudioFileURL = NSURL.fileURL(withPathComponents: [paths[0], subdirectory])!
          
           // let dirPath = documentsDirectory.appendingPathComponent(subdirectory)!
          
            do {
              try FileManager.default.createDirectory(atPath: dirPath, withIntermediateDirectories: false, attributes: nil)
            } catch let error as NSError {
              print(error.localizedDescription);
            }
        }
    }
  
    fileprivate var totalRecDurationThisHour = 0 // tracks the total Recording duration for the current hour
  
    fileprivate var currentHour = 0 // tracks the last known hour (only updated in stopAndSaveRecording()
  
    /// Location of the recorded file
    fileprivate lazy var recordedFileURL: URL = {
        let file = "recording\(arc4random()).caf"
        let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(file)
        return url
    }()
    
    fileprivate lazy var audioRecorder: AVAudioRecorder! = {
        // USE kAudioFormatLinearPCM
        // SEE IMA4 vs M4A http://stackoverflow.com/questions/3509921/recorder-works-on-iphone-3gs-but-not-on-iphone-3g
        let recordSettings: [String : Int] = [
            AVSampleRateKey : self.savingSamplesPerSecond,
            AVFormatIDKey : Int(kAudioFormatLinearPCM),
            AVNumberOfChannelsKey : Int(1),
            AVLinearPCMIsFloatKey : 0,
            AVEncoderAudioQualityKey : Int.max
        ]
        //FIXME: do not use ! here
        
        do {
            let audioRecorder = try AVAudioRecorder(url: self.recordedFileURL, settings: recordSettings)
            audioRecorder.delegate = self
            audioRecorder.isMeteringEnabled = true
            if !audioRecorder.prepareToRecord() {
                // FDSoundActivateRecorder can't prepare recorder
            }
            return audioRecorder
        }
        catch {
            print("failed to create AVAudioRecorder")
            return nil
        }
        
    }()
    
    fileprivate(set) var status = FDSoundActivatedRecorderStatus.inactive  {
        didSet {
            print("Set new status: \(status.rawValue)")
        }
    }
    fileprivate var listeningIntervals = [Double]()
    fileprivate var recordingIntervals = [Double]()
    fileprivate var triggerCount = 0
    fileprivate var intervalTimer = Timer()
    fileprivate var recordingBeginTime = CMTime()
    fileprivate var recordingEndTime = CMTime()
    fileprivate var timestamp = Date()
    fileprivate var timestamp_fmt: ISO8601DateFormatter {
        let dff =  ISO8601DateFormatter()
        dff.formatOptions = [.withYear, .withMonth, .withDay, .withTime, .withDashSeparatorInDate, .withColonSeparatorInTime]
        return dff
    }
  
    /// A log-scale reading between 0.0 (silent) and 1.0 (loud), nil if not recording
    /// TODO: make this optional (KVO needs Objective-C compatible classes, Swift bug)
    @objc dynamic open var microphoneLevel: Double = 0.0
    
    /// Receiver for status updates
    open weak var delegate: FDSoundActivatedRecorderDelegate?
  
  
    /// This is commented out because it was causing crashes on React-native reloads
//    deinit {
//        self.abort()
//    }
  
    /// Listen and start recording when triggered
    open func startListening() {
        print("startListening")
        status = .listening
        
        currentHour = Calendar.current.component(.hour, from: Date())

        guard audioRecorder != nil else {
            print("ERROR: Failed to start listening. AudioRecorder is nil")
            return
        }
        
        audioRecorder.stop()
        
        if (timeoutSeconds == 0) {
            audioRecorder.record()
        }
        else {
            audioRecorder.record(forDuration: timeoutSeconds)
        }
        
        if intervalTimer.isValid {
            intervalTimer.invalidate()
        }
      
        print("----- Should set 15-min start ignore timer? -----")

        #if !DEBUG
          print("Yes! We are in release build!")
          self.sarMode = .ignoreAll
          DispatchQueue.main.async {
            Timer.scheduledTimer(withTimeInterval: 900, repeats: false) { timer in
              self.sarMode = .recordOnTrigger
            }
          }
        #endif
      
        DispatchQueue.main.async {
          self.intervalTimer = Timer.scheduledTimer(timeInterval: self.intervalSeconds, target: self, selector: #selector(FDSoundActivatedRecorder.interval), userInfo: nil, repeats: true)
          self.listeningIntervals.removeAll()
          self.recordingIntervals.removeAll()
          self.triggerCount = 0
        }
    }
    
    /// Go back in time and start recording `riseTriggerIntervals` ago
    open func startRecording() {
        status = .recording
        delegate?.soundActivatedRecorderDidStartRecording(self)
        triggerCount = 0
        
        //let timeSamples = max(0.0, audioRecorder.currentTime - Double(intervalSeconds) * Double(riseTriggerIntervals)) * Double(savingSamplesPerSecond)
        // @Roderick -- changed to <0.5> instead of <intervalSeconds> (0.05), so that we get more of the audio before the trigger
        let timeSamples = max(0.0, audioRecorder.currentTime - 0.5 * Double(riseTriggerIntervals)) * Double(savingSamplesPerSecond)
        recordingBeginTime = CMTimeMake(Int64(timeSamples), Int32(savingSamplesPerSecond))
        timestamp = Date()
        print("starting recording: \(recordingBeginTime.seconds)")
    }
    
    /// End the recording and send any processed & saved file to `delegate`
    open func stopAndSaveRecording() {
//        self.intervalTimer.invalidate()
        print("status: \(self.status.rawValue)")
        guard status == .recording || status == .listening else {
            return
        }
        status = .processingRecording
        self.microphoneLevel = 0.0
        let timeSamples = audioRecorder.currentTime * Double(savingSamplesPerSecond)
        recordingEndTime = CMTimeMake(Int64(timeSamples), Int32(savingSamplesPerSecond))

        guard self.sarMode == .recordOnTrigger else {
            // sarMode is not set to record. (its set to notifyOnlyOnTrigger)
            // reset trigger counts, set status to .refractoryPeriod, and return
            print("SarMode set to notifyOnly. Not saving recording")
            self.status = .refractoryPeriod
            self.listeningIntervals.removeAll()
            self.recordingIntervals.removeAll()
          
            let timestamp_string = self.timestamp_fmt.string(from: self.timestamp)
          
            // Notify delegate of disturbance with empty recording (nil)
            self.delegate?.soundActivatedRecorderDidFinishRecording(self, timestamp_string, 0.0, andSaved: nil)
            return
        }
        
        let recDuration = recordingEndTime.seconds - recordingBeginTime.seconds
        
        guard !recDuration.isNaN else {
            print("INFO: No recording started yet. Nothing to save!")
            self.status = .refractoryPeriod
            self.listeningIntervals.removeAll()
            self.recordingIntervals.removeAll()
            return
        }
        
        let hour = Calendar.current.component(.hour, from: Date())
        
        print("recDuration: \(recDuration)")
        
        print("Comparing savedHour : hour   |   \(currentHour) : \(hour)")
        if currentHour < hour {
            currentHour = hour
            self.totalRecDurationThisHour = 0
          
        }
        
        guard self.totalRecDurationThisHour < self.maxRecordingDurationPerHour else {
            print("Exceeded total recording duration for this hour. Not saving recording")
            
            self.status = .refractoryPeriod
            self.listeningIntervals.removeAll()
            self.recordingIntervals.removeAll()

            let timestamp_string = self.timestamp_fmt.string(from: self.timestamp)
            // Notify delegate of disturbance with empty recording (nil)
            self.delegate?.soundActivatedRecorderDidFinishRecording(self, timestamp_string, 0.0, andSaved: nil)
            print("reverted totalRecDurationThisHour: \(totalRecDurationThisHour)")
            return
        }
        
        self.totalRecDurationThisHour += Int(recDuration)
        
        print("totalRecDurationThisHour: \(totalRecDurationThisHour)")
        
        
        // Prepare output
        let trimmedAudioFileBaseName = "recordingConverted\(UUID().uuidString).caf"
        
        let paths = NSSearchPathForDirectoriesInDomains(FileManager.SearchPathDirectory.documentDirectory, FileManager.SearchPathDomainMask.userDomainMask, true)
        let trimmedAudioFileURL = NSURL.fileURL(withPathComponents: [paths[0], self.subdirectory, trimmedAudioFileBaseName])!
      
        // print("rec file path: \(trimmedAudioFileURL)")
      
        if (trimmedAudioFileURL as NSURL).checkResourceIsReachableAndReturnError(nil) {
            let fileManager = FileManager.default
            _ = try? fileManager.removeItem(at: trimmedAudioFileURL)
        }
        print("recordingBeginTime: \(recordingBeginTime)")
        print("recordingEndTime: \(recordingEndTime)")
      
        // Create time ranges for trimming and fading
        let fadeInDoneTime = CMTimeAdd(recordingBeginTime, CMTimeMake(Int64(Double(riseTriggerIntervals) * Double(intervalSeconds) * Double(savingSamplesPerSecond)), Int32(savingSamplesPerSecond)))
        let fadeOutStartTime = CMTimeSubtract(recordingEndTime, CMTimeMake(Int64(Double(fallTriggerIntervals) * Double(intervalSeconds) * Double(savingSamplesPerSecond)), Int32(savingSamplesPerSecond)))
        let exportTimeRange = CMTimeRangeFromTimeToTime(recordingBeginTime, recordingEndTime)
        let fadeInTimeRange = CMTimeRangeFromTimeToTime(recordingBeginTime, fadeInDoneTime)
        let fadeOutTimeRange = CMTimeRangeFromTimeToTime(fadeOutStartTime, recordingEndTime)

        // Set up the AVMutableAudioMix which does fading
        let avAsset = AVAsset(url: self.audioRecorder.url)
        var tracks = avAsset.tracks(withMediaType: AVMediaTypeAudio)
        
        guard tracks.count > 0 else {
            print("ERROR: Failed to export audio. No tracks found...")
            self.listeningIntervals.removeAll()
            self.recordingIntervals.removeAll()
            self.status = .listening
            return
        }
        
        let track = tracks[0]
        let exportAudioMix = AVMutableAudioMix()
        let exportAudioMixInputParameters = AVMutableAudioMixInputParameters(track: track)
        exportAudioMixInputParameters.setVolumeRamp(fromStartVolume: 0.0, toEndVolume: 1.0, timeRange: fadeInTimeRange)
        exportAudioMixInputParameters.setVolumeRamp(fromStartVolume: 1.0, toEndVolume: 0.0, timeRange: fadeOutTimeRange)
        exportAudioMix.inputParameters = [exportAudioMixInputParameters]
        
        // Configure AVAssetExportSession which sets audio format
        let exportSession = AVAssetExportSession(asset: avAsset, presetName: AVAssetExportPresetAppleM4A)!
        exportSession.outputURL = trimmedAudioFileURL
        exportSession.outputFileType = AVFileTypeAppleM4A
        exportSession.timeRange = exportTimeRange
        exportSession.audioMix = exportAudioMix
        exportSession.exportAsynchronously {
            DispatchQueue.main.async {
                self.listeningIntervals.removeAll()
                self.recordingIntervals.removeAll()
                
                self.status = .refractoryPeriod
                
                switch exportSession.status {
                case .completed:
                  let timestamp_string = self.timestamp_fmt.string(from: self.timestamp)
                  self.delegate?.soundActivatedRecorderDidFinishRecording(self, timestamp_string, exportTimeRange.duration.seconds, andSaved: trimmedAudioFileURL)
                case .failed:
                    // a failure may happen because of an event out of your control
                    // for example, an interruption like a phone call comming in
                    // make sure and handle this case appropriately
                    // FIXME: add another delegate method for failing with exportSession.error
                    self.delegate?.soundActivatedRecorderDidAbort(self)
                default:
                    self.delegate?.soundActivatedRecorderDidAbort(self)
                }
            }
        }
    }
    
    /// End any recording or listening and discard any recorded file
    open func abort() {
        self.intervalTimer.invalidate()
        self.audioRecorder.stop()
        if status != .inactive {
            status = .inactive
            self.delegate?.soundActivatedRecorderDidAbort(self)
            let fileManager: FileManager = FileManager.default
            _ = try? fileManager.removeItem(at: self.audioRecorder.url)
        }
    }
    
    /// This is a PRIVATE method but it must be public because a selector is used in NSTimer (Swift bug)
    @objc open func interval() {
//        print("\n\n\ninterval")
        guard self.audioRecorder.isRecording else {
            print("Timeout... aborting")
            // Timed out
            self.abort()  // in abort callback, I need to check if app in background, and if so, send local notif saying to reopen app.
            return
        }

        guard self.sarMode != .ignoreAll else {
            return
        }
        
        self.audioRecorder.updateMeters()
        let currentLevel = Double(self.audioRecorder.averagePower(forChannel: 0))
//        print("currentLevel: \(currentLevel)")
        switch currentLevel {
        case _ where currentLevel > 0:
            microphoneLevel = 1
        case _ where currentLevel < microphoneLevelSilenceThreshold:
            microphoneLevel = 0
        default:
            microphoneLevel = 1 + currentLevel / microphoneLevelSilenceThreshold * -1.0
        }

        //print("microphoneLevel: \(microphoneLevel)")

        switch status {
        case .recording:
            let recordingAverageLevel = recordingIntervals.reduce(0.0, +) / Double(recordingIntervals.count)
            if recordingIntervals.count >= recordingMinimumIntervals && currentLevel <= max(microphoneLevelSilenceThreshold, recordingAverageLevel - fallTriggerDb) {
                triggerCount = triggerCount + 1
            } else if (audioRecorder.currentTime - recordingBeginTime.seconds > maxRecordingLength) { /* Check if recording time has exceeded maxRecordingLength */
                triggerCount = fallTriggerIntervals
                print("Recording ending as length has exceeded maxRecordingLength (\(maxRecordingLength))")
            } else {
                triggerCount = 0
                recordingIntervals.append(currentLevel)
                if recordingIntervals.count > recordingAveragingIntervals {
                    recordingIntervals.remove(at: 0)
                }
            }
            if triggerCount >= fallTriggerIntervals {
                stopAndSaveRecording()
            }
        case .listening:
//            print(".listening")
            let listeningAverageLevel = listeningIntervals.reduce(0.0, +) / Double(listeningIntervals.count)
//            print("listeningAverageLevel: \(listeningAverageLevel)")
//            print("listeningIntervals.count: \(listeningIntervals.count)")
            if listeningIntervals.count >= listeningMinimumIntervals && currentLevel >= listeningAverageLevel + riseTriggerDb {
                triggerCount = triggerCount + 1
            } else {
                triggerCount = 0
                if (!currentLevel.isNaN && currentLevel > -120.0) {
                    listeningIntervals.append(currentLevel)
                    if listeningIntervals.count > listeningAveragingIntervals {
                        listeningIntervals.remove(at: 0)
                    }
                }
            }
            if triggerCount >= riseTriggerIntervals {
                print("trigger!")
                startRecording()
            }
        case .processingRecording:
//            print("processingRecording")
            break
        case .refractoryPeriod:
//            print("refractoryPeriod")
            // TODO: check if refractory period has ended, and if so, enter listening period
             if (audioRecorder.currentTime > recordingEndTime.seconds + refractoryPeriodLen) {
                    print("RefractoryPeriod ended. Now listening")
                    status = .listening
             }
        default:
            break
        }

        // return
    }
}
