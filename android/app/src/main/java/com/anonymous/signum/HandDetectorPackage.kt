package com.anonymous.signum // <-- CHANGE THIS TO YOUR APP'S PACKAGE NAME

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessor.FrameProcessorPluginRegistry

class HandDetectorPackage : ReactPackage {
    companion object {
        init {
            // Register the plugin with the name we'll use in JavaScript
            FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectHands") { proxy, options ->
                HandDetectorPlugin(proxy, options)
            }
        }
    }

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}