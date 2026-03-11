package com.anonymous.signum.handlandmarksframeprocessor

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class HandLandmarksFrameProcessorPluginPackage : ReactPackage {
  
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
      // 1. Register the plugin here instead of a static 'companion object'
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectHands") { proxy, options ->
          // 2. Pass the reactContext directly into your plugin's constructor!
          HandLandmarksFrameProcessorPlugin(reactContext, proxy, options)
      }
      
      return emptyList()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}