import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";
import { useRunOnJS } from "react-native-worklets-core";

import {
  Camera,
  Frame,
  VisionCameraProxy,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";

// 1. Initialize our custom native hand tracking plugin
const plugin = VisionCameraProxy.initFrameProcessorPlugin("detectHands", {});

const LABELS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

// Configuration Constants
const CONFIDENCE_THRESHOLD = 0.75;
const STABILITY_THRESHOLD = 3;

// Screen dimensions to scale the normalized [0-1] coordinates
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// MediaPipe Hand Topology Connections
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index Finger
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle Finger
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring Finger
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky & Palm
];

// Replicates the Python preprocessing logic
// Must be a worklet to run inside the frameProcessor
function preProcessLandmark(
  rawLandmarks: number[],
  frameWidth: number,
  frameHeight: number
) {
  "worklet";
  const tempLandmarkList = [];

  // 1. Convert to absolute frame coordinates (and drop the Z axis)
  for (let i = 0; i < 21; i++) {
    // rawLandmarks is assumed to be flattened [x0, y0, z0, x1, y1, z1...]
    const lx = Math.min(
      Math.floor(rawLandmarks[i * 3] * frameWidth),
      frameWidth - 1
    );
    const ly = Math.min(
      Math.floor(rawLandmarks[i * 3 + 1] * frameHeight),
      frameHeight - 1
    );
    tempLandmarkList.push([lx, ly]);
  }

  // 2. Convert to relative coordinates (relative to the wrist: index 0)
  const baseX = tempLandmarkList[0][0];
  const baseY = tempLandmarkList[0][1];

  const flattenedAndRelative = [];
  for (let i = 0; i < 21; i++) {
    flattenedAndRelative.push(tempLandmarkList[i][0] - baseX);
    flattenedAndRelative.push(tempLandmarkList[i][1] - baseY);
  }

  // 3. Normalization
  let maxValue = 0;
  for (let i = 0; i < flattenedAndRelative.length; i++) {
    const absVal = Math.abs(flattenedAndRelative[i]);
    if (absVal > maxValue) {
      maxValue = absVal;
    }
  }

  const normalizedList = [];
  for (let i = 0; i < flattenedAndRelative.length; i++) {
    normalizedList.push(maxValue > 0 ? flattenedAndRelative[i] / maxValue : 0);
  }

  // Returns an array of 42 normalized values
  return normalizedList;
}

export default function CameraTab(): React.JSX.Element | null {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  const [translatedText, setTranslatedText] = useState<string>(
    "Waiting for signs..."
  );
  const [debugLandmarks, setDebugLandmarks] = useState<number[]>([]);

  const lastDetectedLetter = useSharedValue<string>("");
  const detectionCount = useSharedValue<number>(0);

  const updateTextJS = useRunOnJS((text: string) => {
    setTranslatedText(text);
  }, []);

  const updateDebugOverlay = useRunOnJS((data: number[]) => {
    setDebugLandmarks(data);
  }, []);

  // Load your TFLite model
  const tfPlugin = useTensorflowModel(
    require("../../assets/keypoint_classifier.tflite")
  );
  const model = tfPlugin.state === "loaded" ? tfPlugin.model : undefined;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      "worklet";
      if (model == null || plugin == null) return;

      try {
        const handDataArray = plugin.call(frame) as number[];

        // 1. Check if we have valid hand data (21 points * 3 = 63 values)
        if (handDataArray && handDataArray.length === 63) {
          // Send raw coordinates to JS thread for debug rendering
          updateDebugOverlay(handDataArray);

          // 2. Pre-process landmarks to match Python training logic
          const preprocessed = preProcessLandmark(
            handDataArray,
            frame.width,
            frame.height
          );

          // Now feed the preprocessed 42-length array into the model
          const tensorData = new Float32Array(preprocessed);
          const outputs = model.runSync([tensorData]);

          if (outputs && outputs.length > 0) {
            const predictions = outputs[0] as number[];

            // 3. Efficiently find the Max Index
            let maxConf = 0;
            let maxIdx = -1;
            for (let i = 0; i < predictions.length; i++) {
              if (predictions[i] > maxConf) {
                maxConf = predictions[i];
                maxIdx = i;
              }
            }

            // 4. Temporal Smoothing Logic
            if (maxConf > CONFIDENCE_THRESHOLD) {
              const currentSign = LABELS[maxIdx];

              if (currentSign === lastDetectedLetter.value) {
                detectionCount.value += 1;
              } else {
                lastDetectedLetter.value = currentSign;
                detectionCount.value = 1;
              }

              if (detectionCount.value === STABILITY_THRESHOLD && currentSign) {
                updateTextJS(
                  `Detected: ${currentSign} (${(maxConf * 100).toFixed(0)}%)`
                );
              }
            }
          }
        } else {
          detectionCount.value = 0;
          updateDebugOverlay([]);
        }
      } catch (e) {
        console.error("Frame Error:", JSON.stringify(e));
      }
    },
    [model]
  );

  const getPoint = (index: number) => {
    if (debugLandmarks.length === 0) return { x: 0, y: 0 };
    return {
      x: debugLandmarks[index * 3] * SCREEN_WIDTH,
      y: debugLandmarks[index * 3 + 1] * SCREEN_HEIGHT,
    };
  };

  if (!hasPermission)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Requesting permission...</Text>
      </View>
    );
  if (device == null)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No camera found.</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
      />

      {/* SVG Skeleton Overlay */}
      {debugLandmarks.length === 63 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            {/* Draw Bones (Lines) */}
            {HAND_CONNECTIONS.map((connection, i) => {
              const start = getPoint(connection[0]);
              const end = getPoint(connection[1]);
              return (
                <Line
                  key={`line-${i}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#00FF00"
                  strokeWidth="3"
                />
              );
            })}

            {/* Draw Joints (Circles) */}
            {Array.from({ length: 21 }).map((_, i) => {
              const point = getPoint(i);
              return (
                <Circle
                  key={`joint-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#FF0000"
                />
              );
            })}
          </Svg>
        </View>
      )}

      {tfPlugin.state === "loading" && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00FF00" />
          <Text style={styles.text}>Waking up AI...</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>{translatedText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  text: { color: "white", fontSize: 18, marginTop: 10 },
  loadingOverlay: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  overlayText: { color: "#00FF00", fontSize: 24, fontWeight: "bold" },
});