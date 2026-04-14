# MemoryCare

> **An AI-assisted, real-time dementia care platform.** <br>
> Features low-latency WebRTC live calls, rolling audio chunk transcription via **faster-whisper**, clinical session summarization via **Groq LLM**, and localized face-detection snapshots bridged externally. 

---

## 🌟 Key Features

1. **WebRTC Video Calls**: Low-latency peer-to-peer video connection tailored for caregiver and client interactions with a Google Meet-inspired interface.
2. **Real-time Audio Transcription**: Live audio slicing (20s chunks) pushed to the STT pipeline powered by `faster-whisper`.
3. **Rolling Clinical Notes**: Summarizes ongoing conversation chunks dynamically in the background via Groq LLM.
4. **Intelligent Face Analysis**: Periodic face snapshots analyzed for identity and emotion, with face-aware UI popups for patient context.
5. **State-Driven Interactive Demo**: A 5-state progressive UI (Standby, Detecting, Active, Analyzing, Summary) with cinematic transitions.
6. **Premium Dark Aesthetic**: High-end Medical-Tech design language using glassmorphism, fluid animations (Framer Motion), and a midnight palette.
7. **Comprehensive Care Suite**: Integrated modules for Cognitive Quizzes, Analytics, Geolocation, and Medication Management.
8. **SpacetimeDB Integration**: Real-time distributed state management and identity logging.

---

## 🏗️ Architecture

- **Frontend (Vite + React, port `5173`)**: WebRTC caller, signaling interaction, proxy routes pointing to the backend (`/api` -> `8001`), reactive summary dashboard, and snapshot generator filtering self-captures.
- **LLM Backend (FastAPI, port `8001`)**: 
  - `faster-whisper` transcription engine processing the `en` audio.
  - Groq client handling `llama-3.1-8b-instant` prompts.
  - Redis connection managing active session state strings and history indexing.
- **ML / Analysis Service (FastAPI, port `8002`)**: Local server designed to sync image snapshots logic.
- **Signaling Server (Node.js, port `4000`)**: Facilitates WebRTC ICE candidates and Socket.io room orchestration.
- **Bridge Scraper (`bridge-snaps/bridge.py`)**: Asynchronous python pipeline watching local snapshot directory (`ml-service/client_snaps`) and converting `.jpg`/`.png` files to Base64 to hit remote endpoints (`/save_snap`) handling detection.

---

## 📂 Repository Structure

```
├── frontend/             # React app, Vite config, WebRTC handlers, UI components
├── LLM/                  # FastAPI layer for Speech-To-Text and LLM summarization
│   ├── app/routes        # HTTP endpoints (/audio, /summary)
│   ├── app/services      # STT (whisper_service.py) & LLM (llm_service.py)
├── bridge/               # Node.js WebRTC Signaling Server
├── ml-service/           # Local Machine Learning & Image persisting endpoints
├── bridge-snaps/         # Python directory watcher & Base64 uploader script
└── memorycare-db/        # SpacetimeDB database configuration and setup
```

---

## 🛠️ Stack & Prerequisites

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend Services**: Python 3.10+, FastAPI, `faster-whisper`, OpenCV, Groq Python SDK, Node.js (`socket.io`)
- **Infrastructure Requirements**:
  - `Node.js 18+`
  - `Python 3.10+`
  - `Redis 7+` (running on `localhost:6379`)
  - `ffmpeg` installed and globally accessible via PATH (vital for `faster-whisper` chunk conversions).

---

## 🚀 Installation & Local Environment

Provide environment variables for the LLM inference. In `LLM/`, copy `.env.example` to `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
REDIS_URL=redis://localhost:6379/0
# STT Concurrency logic
MAX_CONCURRENT_STT=2
WHISPER_MODEL=base
```

For the remote snapshot ML endpoints, you will find `ML_API_URL` defaults running inside the `bridge-snaps/bridge.py` script. Override this via environment variable if configuring a different Ngrok/Cloudflare tunnel for your model server.

---

## 🚦 Deployment (Local Execution Order)

Run these components entirely parallel via separate terminals at the repository root:

1. **Start the state database**  
   Ensure your local redis instance is spinning:
   ```bash
   redis-server
   ```

2. **Run the Signaling Engine**  
   ```bash
   cd bridge
   npm install && node signaling-server.js
   ```

3. **Start the LLM Transcription/Summarization Backend**  
   ```bash
   cd LLM
   # Activate your local venv specific to this module!
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python run.py
   ```

4. **Start the ML Target Service** *(if running internally)*  
   ```bash
   cd ml-service
   pip install -r requirements.txt
   python run.py
   ```

5. **Start Snapshot Forwarder**  
   ```bash
   cd bridge-snaps
   python bridge.py
   ```

6. **Launch Frontend Dev Server**  
   ```bash
   cd frontend
   npm install && npm run dev
   ```

*(Bonus Tool: To expose the interface securely online bypassing CGNATs, execute `cloudflared tunnel --url http://localhost:5173` which dynamically maps all Vite proxied APIs natively!)*

---

## 📝 Recent System Enhancements

* **Premium UI/UX Redesign**: Transitioned to a "Dark Premium Healthcare-Tech" aesthetic. Implemented a 5-state state machine for the demo page, ensuring a cinematic experience with smooth transitions.
* **Feature Expansion**: Added integrated modules for medication tracking, cognitive testing, and geolocation monitoring.
* **Inference Optimization**: Switched to `faster-whisper` with VAD (Voice Activity Detection) filters to eliminate hallucinations during silent periods.
* **Stability & Privacy**: Improved Redis session cleanup logic for instant data erasure post-session. Enhanced snapshot quality while maintaining privacy-first local processing.
* **Personal Evolution**: Formally transitioned from a competition entry to a dedicated personal project focused on accessible AI healthcare solutions.
