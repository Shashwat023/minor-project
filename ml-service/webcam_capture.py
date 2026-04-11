import cv2
import os
import time
import uuid
# python webcam_capture.py
SAVE_DIR = "client_snaps"
os.makedirs(SAVE_DIR, exist_ok=True)

cap = cv2.VideoCapture(0)  

if not cap.isOpened():
    print("❌ Cannot access webcam")
    exit()

print("🎥 Webcam started... capturing every 10 seconds")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to capture frame")
        break

    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(SAVE_DIR, filename)

    cv2.imwrite(filepath, frame)
    print(f"✅ Captured: {filename}")

    time.sleep(5)  # capture every 10 seconds

cap.release()
cv2.destroyAllWindows()