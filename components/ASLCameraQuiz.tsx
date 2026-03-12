import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTensorflowModel } from "react-native-fast-tflite";
import Svg, { Circle, G, Line } from "react-native-svg";
import {
  Camera,
  Frame,
  VisionCameraProxy,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import { useRunOnJS, useSharedValue } from "react-native-worklets-core";

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

const CONFIDENCE_THRESHOLD = 0.6;
const STABILITY_THRESHOLD = 5;
const SCREEN_WIDTH = 200;
const SCREEN_HEIGHT = 300;

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

interface ASLCameraQuizProps {
  targetLetter: string;
  onSuccess: () => void;
}

export default function ASLCameraQuiz({
  targetLetter,
  onSuccess,
}: ASLCameraQuizProps): React.JSX.Element | null {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  const [statusText, setStatusText] = useState<string>("Show your sign...");
  const [matchPercent, setMatchPercent] = useState<number>(0);

  const [debugLandmarks, setDebugLandmarks] = useState<number[][]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Watch for changes to matchPercent and animate the bar smoothly
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: matchPercent,
      duration: 30, // 150ms gives a snappy but smooth fluid motion
      useNativeDriver: false, // Width animations cannot use the native driver
    }).start();
  }, [matchPercent]);

  const detectionCount = useSharedValue<number>(0);

  const tfPlugin = useTensorflowModel(
    require("../assets/keypoint_classifier.tflite")
  );
  const model = tfPlugin.state === "loaded" ? tfPlugin.model : undefined;

  // JS Thread Callbacks
  const updateDebugOverlay = useRunOnJS((data: number[][]) => {
    setDebugLandmarks(data);
  }, []);

  const handleSuccessJS = useRunOnJS(() => {
    if (!isSuccess) {
      setIsSuccess(true);
      setStatusText(`Perfect! That's ${targetLetter}`);
      onSuccess();
    }
  }, [isSuccess, targetLetter, onSuccess]);

  const handlePercentUpdate = useRunOnJS((percent) => {
    setMatchPercent(Math.min(percent, 100));
  }, []);

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

          let detectedTarget = false;
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
                const targetIdx = LABELS.indexOf(targetLetter);
                console.log(
                  Object.entries(predictions)
                    .filter(([_, value]) => value > 0.01)
                    .map(([key, value]) => ({
                      [LABELS[Number(key)]]: value,
                    }))
                );

                handlePercentUpdate(
                  (predictions[targetIdx] / CONFIDENCE_THRESHOLD) * 100
                );

                if (
                  targetIdx !== -1 &&
                  predictions[targetIdx] > CONFIDENCE_THRESHOLD
                ) {
                  detectedTarget = true;
                }
              }
            }
          }

          // Stability Logic for the target letter specifically
          if (detectedTarget) {
            detectionCount.value += 1;
            if (detectionCount.value >= STABILITY_THRESHOLD) {
              handleSuccessJS();
            }
          } else {
            // Reset if they break the sign
            detectionCount.value = 0;
          }
        } else {
          detectionCount.value = 0;
          updateDebugOverlay([]);
          handlePercentUpdate(0);
        }
      } catch (e) {
        console.error("Frame Error:", JSON.stringify(e));
      }
    },
    [model, targetLetter]
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
        <Text>Requesting permission...</Text>
      </View>
    );
  if (device == null)
    return (
      <View style={styles.center}>
        <Text>No camera found.</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View
        style={[styles.cameraWrapper, isSuccess && styles.cameraWrapperSuccess]}
      >
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isSuccess}
          frameProcessor={frameProcessor}
          pixelFormat="rgb"
        />

        {debugLandmarks.length > 0 && !isSuccess && (
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
                        stroke="#AEC6EE"
                        strokeWidth="4"
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
                        r="6"
                        fill="#022469"
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
            <ActivityIndicator size="large" color="#022469" />
            <Text style={styles.loadingText}>Loading AI Model...</Text>
          </View>
        )}
      </View>

      <View
        style={[styles.statusBadge, isSuccess && styles.statusBadgeSuccess]}
      >
        {!isSuccess && (
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        )}
        <Text
          style={[styles.statusText, isSuccess && styles.statusTextSuccess]}
        >
          {statusText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  cameraWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#E5EDFA",
    borderWidth: 4,
    borderColor: "#AEC6EE",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  cameraWrapperSuccess: {
    borderColor: "#4CAF50", // Green border when correct
  },
  center: {
    width: 280,
    height: 350,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5EDFA",
    borderRadius: 30,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#022469",
    marginTop: 10,
    fontWeight: "600",
  },
  statusBadge: {
    marginTop: 20,
    backgroundColor: "#E5EDFA",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  statusBadgeSuccess: {
    backgroundColor: "#4CAF50",
  },
  progressBarFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#4CAF50",
  },
  statusText: {
    color: "#022469",
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
  statusTextSuccess: {
    color: "#FFFFFF",
  },
});
