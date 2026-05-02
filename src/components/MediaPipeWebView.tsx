/**
 * MediaPipeWebView — Renders a hidden WebView that runs MediaPipe FaceMesh
 * for eye tracking. Communicates gaze position and blink events back to RN
 * via postMessage.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  onGazeData: (x: number, y: number, blink: boolean) => void;
  onReady?: () => void;
  smoothing?: number;
  sensitivity?: number;
}

function getHtmlContent(smoothing: number, sensitivity: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" crossorigin="anonymous"></script>
  <style>
    body { margin: 0; padding: 0; background-color: #111; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; }
    video { width: 100vw; height: 100vh; object-fit: cover; transform: scaleX(-1); }
  </style>
</head>
<body>
  <video id="input_video" autoplay playsinline></video>
  <script>
    const videoElement = document.getElementById('input_video');
    
    let smoothX = 0.5;
    let smoothY = 0.5;
    const SMOOTHING = ${smoothing};
    const SENSITIVITY = ${sensitivity};
    let blinkFrames = 0;

    function onResults(results) {
      // Signal that the engine is running and processing frames
      if (!window.hasSentReady) {
        window.hasSentReady = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ ready: true }));
      }

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Gaze position from nose tip (landmark 1)
        const nose = landmarks[1]; 
        
        let targetX = 0.5 + ((1.0 - nose.x) - 0.5) * SENSITIVITY; 
        let targetY = 0.5 + (nose.y - 0.5) * SENSITIVITY;
        targetX = Math.max(0, Math.min(1, targetX));
        targetY = Math.max(0, Math.min(1, targetY));

        // Exponential Moving Average Smoothing
        smoothX = smoothX + SMOOTHING * (targetX - smoothX);
        smoothY = smoothY + SMOOTHING * (targetY - smoothY);

        // Blink detection via Eye Aspect Ratio
        const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
        const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
        
        let isBlink = false;
        if (leftEyeHeight < 0.012 && rightEyeHeight < 0.012) {
            blinkFrames++;
            if (blinkFrames === 2) { 
                isBlink = true;
            }
        } else {
            blinkFrames = 0;
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          x: smoothX, 
          y: smoothY,
          blink: isBlink
        }));
      } else {
        // Send a message that no face is detected, but tracker is active
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          faceDetected: false 
        }));
      }
    }

    const faceMesh = new FaceMesh({locateFile: (file) => {
      return \`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/\${file}\`;
    }});
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    faceMesh.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await faceMesh.send({image: videoElement});
      },
      width: 480,
      height: 640,
      facingMode: "user"
    });
    
    camera.start().catch(err => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ error: err.message }));
    });
  </script>
</body>
</html>`;
}

export default function MediaPipeWebView({ onGazeData, onReady, smoothing = 0.35, sensitivity = 2.2 }: Props) {
  const htmlContent = getHtmlContent(smoothing, sensitivity);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.error) return;
      if (data.ready || data.faceDetected === false) {
        if (onReady) onReady();
      }
      if (data.x !== undefined && data.y !== undefined) {
        onGazeData(data.x, data.y, !!data.blink);
      }
    } catch (e) {
      // Ignore parse errors
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        source={{ html: htmlContent, baseUrl: 'https://localhost/' }}
        style={styles.webview}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
