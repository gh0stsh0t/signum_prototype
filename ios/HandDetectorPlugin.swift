import Foundation
import MediaPipeTasksVision
import VisionCamera

@objc(HandDetectorPlugin)
public class HandDetectorPlugin: FrameProcessorPlugin {
  private var handLandmarker: HandLandmarker?

  public override init(
    proxy: VisionCameraProxyHolder,
    options: [AnyHashable: Any]! = [:]
  ) {
    super.init(proxy: proxy, options: options)

    // 1. Initialize MediaPipe
    guard
      let modelPath = Bundle.main.path(
        forResource: "hand_landmarker",
        ofType: "task"
      )
    else {
      print("Failed to find hand_landmarker.task in bundle.")
      return
    }

    do {
      let options = HandLandmarkerOptions()

      options.baseOptions.modelAssetPath = modelPath
      options.minHandDetectionConfidence = 0.5
      options.minTrackingConfidence = 0.5
      options.numHands = 2 
      options.runningMode = .video

      self.handLandmarker = try HandLandmarker(options: options)
    } catch {
      print("Failed to create HandLandmarker: \(error)")
    }
  }

  public override func callback(
    _ frame: Frame,
    withArguments arguments: [AnyHashable: Any]?
  ) -> Any? {
    guard let landmarker = self.handLandmarker else { return [] }

   do {
      let mpImage = try MPImage(sampleBuffer: frame.buffer, orientation: frame.orientation)
      let timestampMs = Int(frame.timestamp * 1000)
      let result = try landmarker.detect(videoFrame: mpImage, timestampInMilliseconds: timestampMs)

      // 1. Create a Dictionary instead of an Array
      var handsObject: [String: Any] = [:]

      for i in 0..<result.landmarks.count {
        let handLandmarks = result.landmarks[i]
        
        // Grab the label ("Left" or "Right")
        let handednessLabel = result.handedness[i].first?.categoryName ?? "Unknown"
        
        var coordinates: [Double] = []
        for landmark in handLandmarks {
          let rawX = Double(landmark.x)
          let rawY = Double(landmark.y)
          
          let fixedX = 1.0 - rawY
          let fixedY = rawX
          
          coordinates.append(fixedX)
          coordinates.append(fixedY)
          coordinates.append(Double(landmark.z)) 
        }
        
        // 2. Assign the array to the Dictionary key
        // Note: If MediaPipe glitches and detects two "Left" hands, 
        // the second one will overwrite the first one here.
        handsObject[handednessLabel] = coordinates
      }

      // 3. Return the Dictionary (Becomes a JS Object)
      return handsObject

    } catch {
      print("MediaPipe detection failed: \(error)")
      return [:]
    }
  }
}