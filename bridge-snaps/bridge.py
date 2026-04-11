import os
import time
import base64
import httpx
import asyncio

# --- Configuration ---
ML_API_URL = os.getenv("ML_API_URL", "https://wendell-unstacked-stupendously.ngrok-free.dev")
# Updated to hit the /save_snap endpoint that Dev 1's main.py exposes
SNAPSHOT_ENDPOINT = f"{ML_API_URL}/save_snap"

# Go up one directory from bridge-snaps, then into ml-service/client_snaps
SNAPS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml-service", "client_snaps"))

processed_files = set()

async def send_snapshot(filepath: str, client: httpx.AsyncClient):
    print(f"📸 Found new snapshot: {os.path.basename(filepath)}")
    try:
        with open(filepath, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Adding ngrok bypass headers just in case it's a free tunnel without static setup
        headers = {
            "ngrok-skip-browser-warning": "1",
            "Content-Type": "application/json"
        }
        
        resp = await client.post(
            SNAPSHOT_ENDPOINT, 
            json={"image": encoded_string},
            headers=headers,
            timeout=15.0  # Reduced timeout so it recovers faster and doesn't block for 60s
        )
        if resp.status_code in [200, 201]:
            print(f"✅ Successfully sent {os.path.basename(filepath)}")
            return True
        else:
            print(f"⚠️ Failed to send: {resp.status_code} - {resp.text}")
            return False
    except FileNotFoundError:
        print(f"⚠️ File vanished before reading: {os.path.basename(filepath)}")
        return True # File gone, we don't need to try again
    except BaseException as e:
        print(f"❌ Error sending snapshot: {repr(e)}")
        return False

async def watch_loop():
    print(f"👀 Watching directory for new snapshots: {SNAPS_DIR}")
    print(f"🚀 Sending to: {SNAPSHOT_ENDPOINT}")
    
    if not os.path.exists(SNAPS_DIR):
        print(f"⚠️ Directory {SNAPS_DIR} does not exist yet. Waiting for it to be created...")
        while not os.path.exists(SNAPS_DIR):
            await asyncio.sleep(2)
        print("✅ Directory created.")

    # Initialize processed_files with whatever is currently there to avoid uploading old files
    for filename in os.listdir(SNAPS_DIR):
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            processed_files.add(filename)
    
    print(f"ℹ️ Found {len(processed_files)} existing files. Only forwarding new snapshots.")

    # Use a single client session to prevent exhausting Free Ngrok's concurrency limits
    async with httpx.AsyncClient(limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)) as client:
        while True:
            try:
                current_files = set([f for f in os.listdir(SNAPS_DIR) if f.endswith(('.png', '.jpg', '.jpeg'))])
                new_files = current_files - processed_files
                
                for filename in sorted(new_files):
                    filepath = os.path.join(SNAPS_DIR, filename)
                    # Wait briefly to ensure file is completely written to disk before reading
                    await asyncio.sleep(0.5) 
                    
                    success = await send_snapshot(filepath, client)
                    if success:
                        processed_files.add(filename)
                    else:
                        # Break out and wait briefly, to not flood errors if the server is rejecting/timeout
                        break
                    
            except Exception as e:
                print(f"❌ Error during polling loop: {e}")
                
            await asyncio.sleep(2)  # Check every 2 seconds to reduce spam

if __name__ == "__main__":
    try:
        asyncio.run(watch_loop())
    except KeyboardInterrupt:
        print("\n🛑 Stopped watching snapshots.")
