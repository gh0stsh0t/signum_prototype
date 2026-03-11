// import React, { useRef, useState } from "react";
// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { useTensorflowModel } from "react-native-fast-tflite";
// import { runOnJS } from "react-native-reanimated";
// import {
//   Camera,
//   Frame,
//   VisionCameraProxy,
//   useCameraDevice,
//   useFrameProcessor,
// } from "react-native-vision-camera";

// const plugin = VisionCameraProxy.initFrameProcessorPlugin(
//   "extractAslLandmarks",
//   {}
// );

// export function extractAslLandmarks(frame: Frame): number[] | null {
//   "worklet";
//   if (plugin == null) return null;

//   // The Swift plugin returns an array of 1629 numbers (543 landmarks * 3 coords)
//   return plugin.call(frame) as number[] | null;
// }

// // Define how many frames your specific TFLite model expects per inference.
// // Adjust this to match the expected input shape of your .tflite model.
// const SEQUENCE_LENGTH = 30;
// const FLOATS_PER_FRAME = 1629; // 543 landmarks * 3 (x, y, z)

// // Placeholder for your vocab map. You can import your vocab_map.json here.
// import vocabMap from "@/assets/vocab_map.json";

// export default function VocaPracticeScreen() {
//   const device = useCameraDevice("front");

//   // State for UI
//   const [predictedSign, setPredictedSign] = useState<string>(
//     "Waiting for gesture..."
//   );
//   const [isRecording, setIsRecording] = useState<boolean>(false);

//   // Ref to hold our accumulating frames without triggering re-renders
//   const frameBuffer = useRef<number[][]>([]);

//   // Load the local TFLite model
//   const plugin = useTensorflowModel(
//     require("../assets/models/vocab_model_MarkWijkhuizen_v5.tflite")
//   );

//   const runInference = async (sequence: number[][]) => {
//     if (!plugin.model) return;

//     try {
//       // Flatten the 2D array [30][1629] into a 1D Float32Array [48870]
//       const flatBuffer = new Float32Array(SEQUENCE_LENGTH * FLOATS_PER_FRAME);
//       let offset = 0;

//       for (let i = 0; i < sequence.length; i++) {
//         flatBuffer.set(sequence[i], offset);
//         offset += FLOATS_PER_FRAME;
//       }

//       // Run the model. react-native-fast-tflite expects an array of input tensors.
//       const predictions = await plugin.model.run([flatBuffer]);

//       // Assuming the model outputs a 1D array of probabilities for each class
//       const resultsArray = predictions[0] as number[];

//       // Find the index of the highest confidence score
//       let maxIdx = 0;
//       let maxScore = resultsArray[0];
//       for (let i = 1; i < resultsArray.length; i++) {
//         if (resultsArray[i] > maxScore) {
//           maxScore = resultsArray[i];
//           maxIdx = i;
//         }
//       }

//       // Map the index to the vocabulary word
//       const signName = vocabMap[maxIdx.toString()] || `Unknown (${maxIdx})`;
//       setPredictedSign(`${signName} (${(maxScore * 100).toFixed(1)}%)`);
//     } catch (error) {
//       console.error("Inference Error:", error);
//       setPredictedSign("Error running model");
//     }
//   };

//   const handleFrameData = (frameData: number[]) => {
//     if (!isRecording) return;

//     // Add the current frame's 1629 floats to our buffer
//     frameBuffer.current.push(frameData);

//     // Once we hit the required sequence length, run inference and clear buffer
//     if (frameBuffer.current.length >= SEQUENCE_LENGTH) {
//       // Copy the buffer to pass to the async inference function
//       const sequenceToPredict = [...frameBuffer.current];

//       // Clear the buffer to immediately start collecting the next sequence
//       frameBuffer.current = [];

//       runInference(sequenceToPredict);
//     }
//   };

//   const frameProcessor = useFrameProcessor(
//     (frame) => {
//       "worklet";
//       // 1. Extract the 1629-element array directly via Swift
//       const landmarksData = extractAslLandmarks(frame);

//       // 2. If valid data was extracted, safely jump to the JS thread to buffer it
//       if (landmarksData && landmarksData.length === FLOATS_PER_FRAME) {
//         runOnJS(handleFrameData)(landmarksData);
//       }
//     },
//     [isRecording]
//   ); // Re-evaluate if recording state changes

//   if (device == null)
//     return (
//       <View style={styles.container}>
//         <Text>No Camera Found</Text>
//       </View>
//     );
//   if (plugin.state !== "loaded")
//     return (
//       <View style={styles.container}>
//         <Text>Loading Model...</Text>
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       <Camera
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         frameProcessor={frameProcessor}
//       />

//       <View style={styles.overlay}>
//         <Text style={styles.predictionText}>{predictedSign}</Text>

//         <TouchableOpacity
//           style={[
//             styles.button,
//             isRecording ? styles.buttonStop : styles.buttonStart,
//           ]}
//           onPress={() => {
//             if (isRecording) {
//               frameBuffer.current = []; // Reset buffer on stop
//             }
//             setIsRecording(!isRecording);
//           }}
//         >
//           <Text style={styles.buttonText}>
//             {isRecording ? "Stop Practice" : "Start Practice"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "black",
//   },
//   overlay: {
//     position: "absolute",
//     bottom: 40,
//     width: "100%",
//     alignItems: "center",
//   },
//   predictionText: {
//     fontSize: 32,
//     fontWeight: "bold",
//     color: "white",
//     backgroundColor: "rgba(0,0,0,0.5)",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 10,
//     overflow: "hidden",
//     marginBottom: 20,
//   },
//   button: {
//     paddingHorizontal: 30,
//     paddingVertical: 15,
//     borderRadius: 25,
//   },
//   buttonStart: {
//     backgroundColor: "#217178", // Using your primary theme color
//   },
//   buttonStop: {
//     backgroundColor: "#d32f2f", // Using your error theme color
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
// });
