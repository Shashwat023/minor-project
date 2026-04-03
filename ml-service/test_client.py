import requests
import base64
import os
import time

API_URL = "http://127.0.0.1:8000/detect"
IMAGE_FOLDER = "client_snaps"

processed = set()


def encode_image(image_path):
    try:
        with open(image_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()

        # 🔥 Validate encoding
        if encoded is None or len(encoded) < 100:
            raise ValueError("Encoded string too small / invalid")

        return encoded

    except Exception as e:
        print(f"❌ Encoding failed for {image_path}: {str(e)}")
        return None


def watch_folder():
    print("👀 Watching folder for new images...")

    while True:
        for filename in os.listdir(IMAGE_FOLDER):

            if filename in processed:
                continue

            if not filename.lower().endswith((".jpg", ".png", ".jpeg")):
                continue

            file_path = os.path.join(IMAGE_FOLDER, filename)

            print(f"\n📸 Processing: {filename}")

            try:
                encoded = encode_image(file_path)

                if encoded is None:
                    print("⚠️ Skipping due to encoding issue")
                    processed.add(filename)
                    continue

                response = requests.post(
                    API_URL,
                    json={"image": encoded},
                    timeout=15
                )

                # 🔥 Always print raw response (debug safe)
                print("➡️ Status Code:", response.status_code)
                print("➡️ Response:", response.text)

                processed.add(filename)

            except requests.exceptions.RequestException as e:
                print("❌ API Request Error:", str(e))

            except Exception as e:
                print("❌ Unexpected Error:", str(e))

        time.sleep(2)


if __name__ == "__main__":
    watch_folder()