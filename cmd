 cd bridge
 node signaling-server.js

 cd frontend
 npm run dev

 cd LLM
 .\venv\Scripts\activate
 python run.py

 cd ml-service
 .\venv\Scripts\activate
 python run.py

 cd bridge-snaps
 python bridge.py

 cloudflared tunnel -url http://localhost:5173