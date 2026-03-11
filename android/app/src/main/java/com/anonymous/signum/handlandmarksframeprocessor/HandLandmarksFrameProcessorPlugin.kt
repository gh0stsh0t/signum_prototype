package com.anonymous.signum.handlandmarksframeprocessor

import android.content.Context
import android.util.Log
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import com.google.mediapipe.framework.image.MediaImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
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
            // Convert VisionCamera Frame to MediaPipe MPImage
            val mpImage = MediaImageBuilder(frame.image).build()
            
            // VisionCamera Android timestamps are usually in nanoseconds. Convert to milliseconds.
            val timestampMs = (frame.timestamp / 1_000_000).toLong()
            
            val result = landmarker.detectForVideo(mpImage, timestampMs)

            // 1. Create a Map instead of an Array
            val handsObject = mutableMapOf<String, Any>()

            val landmarksList = result.landmarks()
            val handednessList = result.handednesses()

            for (i in landmarksList.indices) {
                val handLandmarks = landmarksList[i]
                
                // Grab the label ("Left" or "Right")
                val handednessLabel = handednessList.getOrNull(i)?.firstOrNull()?.categoryName() ?: "Unknown"

                val coordinates = mutableListOf<Double>()
                for (landmark in handLandmarks) {
                    val rawX = landmark.x().toDouble()
                    val rawY = landmark.y().toDouble()
                    
                    // Same coordinate manipulation as your Swift file
                    val fixedX = 1.0 - rawY
                    val fixedY = 1.0 - rawX
                    
                    coordinates.add(fixedX)
                    coordinates.add(fixedY)
                    coordinates.add(landmark.z().toDouble())
                }

                // 2. Assign the array to the Map key
                // Note: If MediaPipe glitches and detects two "Left" hands, 
                // the second one will overwrite the first one here.
                handsObject[handednessLabel] = coordinates
            }

            // 3. Return the Map (Becomes a JS Object)
            handsObject

        } catch (e: Exception) {
            Log.e("HandDetectorPlugin", "MediaPipe detection failed: ${e.message}", e)
            emptyMap<String, Any>()
        }
    }
}