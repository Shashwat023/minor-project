# MemoryCare - Technocrats Innovation Challenge 

> **An AI-assisted, real-time dementia care platform.** <br>
> Features low-latency WebRTC live calls, rolling audio chunk transcription via **faster-whisper**, clinical session summarization via **Groq LLM**, and localized face-detection snapshots bridged externally. 

---

## 🌟 Key Features

1. **WebRTC Video Calls**: Low-latency peer-to-peer video connection tailored for caregiver and client interactions.
2. **Real-time Audio Transcription**: Live audio slicing (20s chunks) pushed to the STT pipeline powered by `faster-whisper` (CPU-optimized with Voice Activity Detection to prevent hallucinations). 
3. **Rolling Clinical Notes**: Summarizes ongoing conversation chunks dynamically in the background via Groq's high-speed inference without blocking the application flow. Output enforces therapeutic terminology ("client" vs "patient").
4. **Snapshot Event Pipeline**: Generates periodic face snapshots on the client side, caches them locally, and bridges them asynchronously via `bridge-snaps` script to a secure remote Machine Learning Endpoint for identity analysis.
5. **Modern, Responsive UI**: Redesigned dashboard and navigation structure ensuring standard branding, high accessibility, and a premium caregiving experience.
6. **SpacetimeDB Integrations**: Data bridge orchestrates identity registration logs seamlessly into SpacetimeDB reducers.

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

* **Transcriber Optimization**: Removed heavy `openai-whisper` in standard implementation favor of `faster-whisper`. Standardized internal FFmpeg logic directly down-sampling inputs into predictable formats preventing `NaN` tensor crashes. Added `vad_filter` logic resolving silent-room summary hallucination loops.
* **Clinical Prompt Standards**: The LLM output generation rules have been strictly standardized to utilize `"client"` dynamically dropping previous hardcoded identifiers.
* **Identity Bridge Isolation**: The snapshot integration avoids main-thread collision. Videos slice locally, save to disk, and the `bridge-snaps/bridge.py` autonomously discovers and forwards payloads reliably without dragging network performance inside the WebRTC app loop.
