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
      options.minHandDetectionConfidence = 0.7
      options.minTrackingConfidence = 0.7
      options.numHands = 1
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
      // 1. Let MediaPipe handle the sensor-to-portrait rotation automatically
      // Vision Camera's `frame.orientation` knows exactly how the sensor is rotated
      // relative to your portrait app.
      let mpImage = try MPImage(
        sampleBuffer: frame.buffer,
        orientation: frame.orientation
      )

      let timestampMs = Int(frame.timestamp * 1000)
      let result = try landmarker.detect(
        videoFrame: mpImage,
        timestampInMilliseconds: timestampMs
      )

      var coordinates: [Double] = []

      // 2. Extract the numbers and apply the "Mirror" fix
      if let firstHand = result.landmarks.first {
        for landmark in firstHand {
          let rawX = Double(landmark.x)
          let rawY = Double(landmark.y)
          
          // Fix for iOS Front Camera in Portrait (Rotated 270 degrees + Mirrored)
          // We swap X and Y, and invert to fix the mirroring.
          // let fixedX = rawY
          // let fixedY = 1.0 - rawX 
          
          // NOTE: If the skeleton is upside down after this, use:
          let fixedX = 1.0 - rawY
          let fixedY = rawX
          
          coordinates.append(fixedX)
          coordinates.append(fixedY)
          coordinates.append(Double(landmark.z)) 
        }
      }

      return coordinates

    } catch {
      print("MediaPipe detection failed: \(error)")
      return []
    }
  }
}