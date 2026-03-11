import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTensorflowModel } from "react-native-fast-tflite";
import Svg, { Circle, G, Line } from "react-native-svg";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";

import {
  TAB_BAR_BOTTOM_MARGIN,
  TAB_BAR_HEIGHT,
} from "@/components/hooks/useTabBarPadding";
import {
  Camera,
  Frame,
  VisionCameraProxy,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";

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

const CONFIDENCE_THRESHOLD = 0.75;
const STABILITY_THRESHOLD = 3;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];

function preProcessLandmark(
  rawLandmarks: number[],
  frameWidth: number,
  frameHeight: number
) {
  "worklet";
  const tempLandmarkList = [];

  for (let i = 0; i < 21; i++) {
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

  const baseX = tempLandmarkList[0][0];
  const baseY = tempLandmarkList[0][1];

  const flattenedAndRelative = [];
  for (let i = 0; i < 21; i++) {
    flattenedAndRelative.push(tempLandmarkList[i][0] - baseX);
    flattenedAndRelative.push(tempLandmarkList[i][1] - baseY);
  }

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

  return normalizedList;
}

export default function CameraTab(): React.JSX.Element | null {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  const [translatedText, setTranslatedText] = useState<string>(
    "Waiting for signs..."
  );
  const [debugLandmarks, setDebugLandmarks] = useState<number[][]>([]);
  const format = useCameraFormat(device, [
    { videoResolution: { width: 640, height: 480 } }, // 480p or lower!
    { fps: 30 }, // Or 60, if your device supports it at this resolution
  ]);

  const lastDetectedLetter = useSharedValue<string>("");
  const detectionCount = useSharedValue<number>(0);

  const updateTextJS = useRunOnJS((text: string) => {
    setTranslatedText(text);
  }, []);

  const updateDebugOverlay = useRunOnJS((data: number[][]) => {
    setDebugLandmarks(data);
  }, []);

  const tfPlugin = useTensorflowModel(
    require("../../assets/keypoint_classifier.tflite")
  );
  const model = tfPlugin.state === "loaded" ? tfPlugin.model : undefined;

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      "worklet";
      if (model == null || plugin == null) return;

      try {
        const handsData = plugin.call(frame) as {
          Left?: number[];
          Right?: number[];
        };

        if (handsData && Object.keys(handsData).length > 0) {
          const debugArrays = [];
          if (handsData.Left) debugArrays.push(handsData.Left);
          if (handsData.Right) debugArrays.push(handsData.Right);
          updateDebugOverlay(debugArrays);

          let currentDetectedSigns: string[] = [];
          const handsToProcess = [handsData.Left, handsData.Right];

          for (let h = 0; h < handsToProcess.length; h++) {
            const handCoords = handsToProcess[h];

            if (handCoords && handCoords.length === 63) {
              const preprocessed = preProcessLandmark(
                handCoords,
                frame.width,
                frame.height
              );
              const tensorData = new Float32Array(preprocessed);
              const outputs = model.runSync([tensorData]);

              if (outputs && outputs.length > 0) {
                const predictions = outputs[0] as number[];
                let maxConf = 0;
                let maxIdx = -1;

                for (let i = 0; i < predictions.length; i++) {
                  if (predictions[i] > maxConf) {
                    maxConf = predictions[i];
                    maxIdx = i;
                  }
                }

                if (maxConf > CONFIDENCE_THRESHOLD) {
                  currentDetectedSigns.push(LABELS[maxIdx]);
                }
              }
            }
          }

          if (currentDetectedSigns.length > 0) {
            const currentSignCombo = currentDetectedSigns.join(" & ");

            if (currentSignCombo === lastDetectedLetter.value) {
              detectionCount.value += 1;
            } else {
              lastDetectedLetter.value = currentSignCombo;
              detectionCount.value = 1;
            }

            if (detectionCount.value === STABILITY_THRESHOLD) {
              updateTextJS(`Detected: ${currentSignCombo}`);
            }
          }
        } else {
          detectionCount.value = 0;
          lastDetectedLetter.value = "";
          updateDebugOverlay([]);
        }
      } catch (e) {
        console.error("Frame Error:", JSON.stringify(e));
      }
    },
    [model]
  );

  const getPoint = (handData: number[], index: number) => {
    if (!handData || handData.length <= index * 3 + 1) return { x: 0, y: 0 };
    return {
      x: handData[index * 3] * SCREEN_WIDTH,
      y: handData[index * 3 + 1] * SCREEN_HEIGHT,
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
        // format={format}
      />

      {debugLandmarks.length > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            {debugLandmarks.map((hand, handIndex) => (
              <G key={`hand-${handIndex}`}>
                {HAND_CONNECTIONS.map((connection, i) => {
                  const start = getPoint(hand, connection[0]);
                  const end = getPoint(hand, connection[1]);
                  return (
                    <Line
                      key={`line-${handIndex}-${i}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#00FF00"
                      strokeWidth="3"
                    />
                  );
                })}
                {Array.from({ length: 21 }).map((_, i) => {
                  const point = getPoint(hand, i);
                  return (
                    <Circle
                      key={`joint-${handIndex}-${i}`}
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#FF0000"
                    />
                  );
                })}
              </G>
            ))}
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
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    bottom: TAB_BAR_BOTTOM_MARGIN + TAB_BAR_HEIGHT,
  },
  overlayText: { color: "#00FF00", fontSize: 24, fontWeight: "bold" },
});