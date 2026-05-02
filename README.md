# 👁️✋ GazeTalk — AI-Based Multimodal Communication System

An **AI-powered eye-tracking keyboard** for deaf and mute users. Type by looking at letters, blink to select, and let AI turn your keywords into natural sentences — then speak them aloud.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18 and **npm**
- **Python** 3.11+ (for the AI backend)
- **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### 1. Clone & Install

```bash
git clone <repo-url> && cd GazeTalk
npm install
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Configure Backend URL

Edit `src/config.ts` and set `BACKEND_URL` to your machine's LAN IP:

```ts
export const BACKEND_URL = 'http://YOUR_IP:8000';
```

### 4. Run the App

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android / `i` for iOS.

### One-Click Start (Windows)

```bash
start.bat
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React Native App                    │
│  ┌─────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ MediaPipe    │ │ Gaze     │ │ Output Bar       │  │
│  │ WebView      │→│ Keyboard │ │ + TTS Speaker    │  │
│  │ (FaceMesh)   │ │ + Cursor │ │ + Suggestions    │  │
│  └─────────────┘ └──────────┘ └──────────────────┘  │
│       ↓ gaze x/y, blink         ↕ /enhance, /suggest│
└──────────────────────────────────┼───────────────────┘
                                   │ HTTP / WebSocket
                    ┌──────────────┴──────────────────┐
                    │        FastAPI Backend           │
                    │  ┌───────────┐ ┌─────────────┐  │
                    │  │ ML        │ │ Suggestions  │  │
                    │  │ Enhancer  │ │ Engine       │  │
                    │  │ (flan-t5) │ │ (prefix)     │  │
                    │  └───────────┘ └─────────────┘  │
                    └─────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Eye Tracking** | MediaPipe FaceMesh tracks nose/gaze position via WebView |
| **Blink Selection** | Blink to instantly select the key you're looking at |
| **Dwell Selection** | Hold gaze on a key for 1.5s to select (configurable) |
| **AI Enhancement** | Keywords → natural sentence via flan-t5 ML model |
| **Text-to-Speech** | Speak button reads your sentence aloud (on-device) |
| **Word Suggestions** | Smart word completions above the keyboard |
| **Settings Panel** | Adjust dwell time, sensitivity, auto-speak, haptics |
| **Haptic Feedback** | Vibration on key selection |
| **Connection Status** | Shows if AI backend is reachable |

---

## 📁 Project Structure

```
GazeTalk/
├── App.tsx                      # Main entry (thin orchestrator)
├── src/
│   ├── config.ts                # All constants & settings
│   ├── components/
│   │   ├── MediaPipeWebView.tsx  # Eye tracking via WebView
│   │   ├── GazeKeyboard.tsx      # On-screen gaze keyboard
│   │   ├── GazeCursor.tsx        # Visual cursor indicator
│   │   ├── OutputBar.tsx         # Text display + status
│   │   ├── SuggestionBar.tsx     # Word completions
│   │   ├── SettingsPanel.tsx     # Settings modal
│   │   └── SplashLoader.tsx      # Loading animation
│   ├── hooks/
│   │   └── useGazeTracking.ts    # Gaze logic hook
│   └── utils/
│       └── api.ts                # Backend API client
├── backend/
│   ├── main.py                   # FastAPI server
│   ├── utils.py                  # Enhancement logic
│   ├── ml_enhancer.py            # ML model (flan-t5)
│   ├── suggestions.py            # Word prediction
│   ├── requirements.txt
│   └── Dockerfile
├── ml/                           # ASL model training
├── test/                         # Browser test pages
└── start.bat                     # One-click launcher
```

---

## 🧪 Testing

### Browser-based ML Tests
```bash
cd test && run_tests.bat
```
- **Eye Tracking Test** — Iris/nose tracking, heatmap, calibration, gaze keyboard
- **Hand Sign Test** — Gesture recognition, ASL letter prediction, practice mode

### Backend Health Check
```bash
curl http://localhost:8000/health
```

---

## ⚙️ Technologies

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native (Expo) |
| **Eye Tracking** | MediaPipe FaceMesh (via WebView) |
| **Backend** | Python FastAPI |
| **ML Model** | HuggingFace flan-t5-small |
| **TTS** | Expo Speech (on-device) |
| **ASL Training** | TensorFlow/Keras CNN |

---

## 📌 Abstract

Communication is a fundamental human need, yet individuals who are deaf or mute face significant barriers in expressing themselves. This project provides an **AI-powered multimodal communication system** integrating **eye tracking and hand gesture recognition** to enable efficient and natural communication. The system uses computer vision to capture eye movement, converting gaze into text selections. An AI language model enhances the generated text into meaningful and grammatically correct sentences, which can then be spoken aloud.
