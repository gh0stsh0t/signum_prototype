package com.anonymous.signum.handlandmarksframeprocessor

import android.content.Context
import android.util.Log
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import com.google.mediapipe.framework.image.MediaImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker.HandLandmarkerOptions

class HandLandmarksFrameProcessorPlugin(
    private val context: Context, // Note: You'll need to pass ReactApplicationContext from your ReactPackage
    proxy: VisionCameraProxy, 
    options: Map<String, Any>?
): FrameProcessorPlugin() {

    private var handLandmarker: HandLandmarker? = null

    init {
        try {
            // 1. Initialize MediaPipe
            // In Android, models are read directly from the assets folder.
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath("hand_landmarker.task")
                .setDelegate(Delegate.GPU)
                .build()

            val landmarkerOptions = HandLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setMinHandDetectionConfidence(0.5f)
                .setMinTrackingConfidence(0.5f)
                .setNumHands(2)
                .setRunningMode(RunningMode.VIDEO)
                .build()

            this.handLandmarker = HandLandmarker.createFromOptions(context, landmarkerOptions)
        } catch (e: Exception) {
            Log.e("HandDetectorPlugin", "Failed to create HandLandmarker: ${e.message}", e)
        }
    }

  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
    val landmarker = this.handLandmarker ?: return emptyMap<String, Any>()

    return try {
        val mpImage = MediaImageBuilder(frame.image).build()
        val timestampMs = (frame.timestamp / 1_000_000).toLong()
        
        // 1. Inference is synchronous here. This is why resolution matters.
        val result = landmarker.detectForVideo(mpImage, timestampMs)

        val landmarksList = result.landmarks()
        
        // OPTIMIZATION 1: Fast exit if no hands are detected
        if (landmarksList.isEmpty()) {
            return emptyMap<String, Any>() 
        }

        val handsObject = mutableMapOf<String, Any>()
        val handednessList = result.handednesses()

        for (i in landmarksList.indices) {
            val handLandmarks = landmarksList[i]
            val handednessLabel = handednessList.getOrNull(i)?.firstOrNull()?.categoryName() ?: "Unknown"

            // OPTIMIZATION 2: Pre-allocate EXACT capacity (21 landmarks * 3 coords = 63)
            // This prevents the array from resizing itself multiple times per frame
            val coordinates = ArrayList<Double>(63)
            
            for (landmark in handLandmarks) {
                val rawX = landmark.x().toDouble()
                val rawY = landmark.y().toDouble()
                
                coordinates.add(1.0 - rawY)
                coordinates.add(1.0 - rawX) // Using the vertical fix from earlier
                coordinates.add(landmark.z().toDouble())
            }

            handsObject[handednessLabel] = coordinates
        }

        handsObject

    } catch (e: Exception) {
        Log.e("HandDetectorPlugin", "MediaPipe detection failed: ${e.message}", e)
        emptyMap<String, Any>()
    }
  }
}