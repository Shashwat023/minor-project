# bridge/bridge.py

import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
ML_API_URL = os.getenv("ML_API_URL", "https://wendell-unstacked-stupendously.ngrok-free.dev")
SESSION_ID = "session_alpha_1"

# 🔥 UPDATED: Pointing directly to your live Testnet database
DB_NAME = "tic-memorycare-live"
SPACETIME_API = f"https://maincloud.spacetimedb.com/v1/database/{DB_NAME}/call"

# State Tracking
last_seen_id = None

async def call_db(reducer_name: str, args: list):
    """Sends a standard HTTP POST request directly to the SpacetimeDB server."""
    url = f"{SPACETIME_API}/{reducer_name}"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=args)
            if resp.status_code != 200:
                print(f"❌ DB Error ({reducer_name}): {resp.text}")
            return resp.status_code == 200
        except Exception as e:
            print(f"❌ Connection to SpacetimeDB failed: {e}")
            return False

async def handle_result(result: dict):
    global last_seen_id

    # If Dev 1 sends an empty result, treat it as "Face Lost"
    if not result:
        if last_seen_id is not None:
            print("\n🛑 Face lost. Clearing live detection from database.")
            await call_db("clear_live_detection", [SESSION_ID])
            last_seen_id = None
        return

    person_id = result.get("person_id")
    is_new = result.get("is_new", False)

    if not person_id:
        return

    # 🔥 Ignore duplicate (same person repeatedly) to prevent DB spam
    if person_id == last_seen_id:
        return

    last_seen_id = person_id

    # 1. Handle New vs Existing Logging
    if is_new:
        print(f"\n🆕 NEW PERSON DETECTED → ID: {person_id}")
        await call_db("create_new_face", [person_id])
    else:
        print(f"\n🔁 EXISTING PERSON DETECTED → ID: {person_id}")

    # 2. Update Live Tracking in DB
    # Passing 0s for missing bounding boxes to satisfy your reducer schema
    await call_db("update_live_detection", [
        SESSION_ID,
        person_id,
        0, 0, 0, 0,  # Default Box X, Y, W, H
        1.0          # Default Confidence
    ])

async def run():
    print(f"🚀 [bridge] Listening - ML API: {ML_API_URL}")
    print(f"☁️  [bridge] Connected to Live Database: {DB_NAME}")

    # timeout=None is critical here because Dev 1's endpoint blocks
    async with httpx.AsyncClient(timeout=None) as client:
        while True:
            try:
                # 🔥 BLOCK until ML sends something
                resp = await client.get(f"{ML_API_URL}/wait_for_result")

                if resp.status_code == 200:
                    result = resp.json()
                    await handle_result(result)
                else:
                    print(f"⚠️ ML Service returned status {resp.status_code}")

            except httpx.ConnectError:
                print("⏳ Waiting for Dev 1's ML Service to come online...")
                await asyncio.sleep(2)
            except Exception as e:
                print(f"[bridge] error: {e}")
                await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("\n🛑 Bridge stopped by user.")