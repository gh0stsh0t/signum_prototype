package com.anonymous.signum // <-- REMEMBER TO CHANGE THIS TO YOUR PACKAGE NAME

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.google.mediapipe.framework.image.MediaImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker.HandLandmarkerOptions
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessor.VisionCameraProxy

class HandDetectorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {
    private var handLandmarker: HandLandmarker? = null

    init {
        val context = proxy.context.applicationContext
        try {
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath("hand_landmarker.task")
                .build()

            val optionsBuilder = HandLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setMinHandDetectionConfidence(0.7f) // Match iOS 0.7
                .setMinTrackingConfidence(0.7f)    // Match iOS 0.7
                .setNumHands(1)
                .setRunningMode(RunningMode.VIDEO)
                .build()

            handLandmarker = HandLandmarker.createFromOptions(context, optionsBuilder)
        } catch (e: Exception) {
            Log.e("HandDetector", "Failed to init MediaPipe", e)
        }
    }

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        val image = frame.image ?: return emptyList<Double>()
        val landmarker = handLandmarker ?: return emptyList<Double>()
        
        return try {
            val mpImage = MediaImageBuilder(image).build()
            
            // Fix: Convert seconds to milliseconds Long
            val timestampMs = (frame.timestamp * 1000).toLong()
            val result = landmarker.detectForVideo(mpImage, timestampMs)

            val coordinates = ArrayList<Double>()

            if (result.landmarks().isNotEmpty()) {
                val handLandmarks = result.landmarks()[0]
                for (landmark in handLandmarks) {
                    // Note: You may need to add Android-specific rotation 
                    // logic here if the JS side expects it.
                    coordinates.add(landmark.x().toDouble())
                    coordinates.add(landmark.y().toDouble())
                    coordinates.add(landmark.z().toDouble())
                }
            }
            coordinates
        } catch (e: Exception) {
            emptyList<Double>()
        }
    }
}