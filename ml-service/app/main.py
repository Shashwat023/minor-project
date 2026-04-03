from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import os
import uuid
import cv2
import numpy as np
from deepface import DeepFace
import asyncio
from app.utils import base64_to_image
from app.face_detector import detect_faces
from app.face_matcher import get_face_embedding, is_same_person, reset_cache

import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# 🔥 QUEUE FOR BRIDGE COMMUNICATION
result_queue = asyncio.Queue()


# 🔥 LIFESPAN (warmup with ArcFace now)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔥 Loading DeepFace model (warmup)...")

    try:
        dummy = np.zeros((160, 160, 3), dtype=np.uint8)

        DeepFace.represent(
            dummy,
            model_name="ArcFace",   # ✅ updated
            enforce_detection=False
        )

        print("✅ Model loaded successfully")

    except Exception as e:
        print("❌ Warmup failed:", str(e))

    yield

    print("🛑 Shutting down...")


app = FastAPI(lifespan=lifespan)


# 📁 Folders
IMAGE_DIR = "images"
FACE_DB_DIR = "face_db"

os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(FACE_DB_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": "MemoryCare ML Service Running"}


# 🔥 BLOCKING ENDPOINT (bridge waits here)
@app.get("/wait_for_result")
async def wait_for_result():
    try:
        result = await asyncio.wait_for(result_queue.get(), timeout=25)
        return result
    except asyncio.TimeoutError:
        return {}   # no face → empty response


@app.post("/detect")
async def detect(request: Request):
    try:
        data = await request.json()
        base64_image = data.get("image")

        if not base64_image:
            return None

        # 🔥 Decode
        try:
            img = base64_to_image(base64_image)
        except Exception as e:
            print("❌ BASE64 ERROR:", str(e))
            return None

        if img is None:
            return None

        # Resize
        img = cv2.resize(img, (640, 480))

        # 🔥 Face Detection
        faces = detect_faces(img)

        if len(faces) == 0:
            return None

        # 🔥 Largest face
        x, y, w, h = max(faces, key=lambda r: r[2] * r[3])

        face_crop = img[y:y+h, x:x+w]

        if face_crop.size == 0:
            return None

        face_crop = cv2.resize(face_crop, (160, 160))

        # 🔥 Embedding
        embedding = get_face_embedding(face_crop)

        if embedding is None:
            return None

        # 🔥 Matching
        exists, match_file, dist = is_same_person(embedding)

        # 🔥 EXISTING FACE
        if exists:
            person_id = match_file.split(".")[0]

            result = {
                "person_id": person_id,
                "is_new": False
            }

            print(f"⚠️ EXISTS → {person_id} (dist={dist:.4f})")

            await result_queue.put(result)
            return result

        # 🔥 SAFETY CHECK (VERY IMPORTANT)
        # Prevent false "new person" if very close match exists
        if dist is not None and dist < 0.45:
            person_id = match_file.split(".")[0]

            result = {
                "person_id": person_id,
                "is_new": False
            }

            print(f"⚠️ CLOSE MATCH → treating as EXISTS ({person_id})")

            await result_queue.put(result)
            return result

        # 🔥 NEW FACE
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(FACE_DB_DIR, filename)

        cv2.imwrite(filepath, face_crop)

        # 🔥 RESET CACHE (CRITICAL)
        reset_cache()

        person_id = filename.split(".")[0]

        result = {
            "person_id": person_id,
            "is_new": True
        }

        print(f"🆕 NEW → {person_id}")

        await result_queue.put(result)
        return result

    except Exception as e:
        print("❌ CRITICAL ERROR:", str(e))
        return None


# from fastapi import FastAPI, Request
# from contextlib import asynccontextmanager
# import os
# import uuid
# import cv2
# import numpy as np
# from deepface import DeepFace
# import asyncio

# from app.utils import base64_to_image
# from app.face_detector import detect_faces
# from app.face_matcher import get_face_embedding, is_same_person


# # 🔥 QUEUE FOR BRIDGE COMMUNICATION
# result_queue = asyncio.Queue()


# # 🔥 LIFESPAN
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     print("🔥 Loading DeepFace model (warmup)...")

#     try:
#         dummy = np.zeros((160, 160, 3), dtype=np.uint8)

#         DeepFace.represent(
#             dummy,
#             model_name="VGG-Face",
#             enforce_detection=False
#         )

#         print("✅ Model loaded successfully")

#     except Exception as e:
#         print("❌ Warmup failed:", str(e))

#     yield

#     print("🛑 Shutting down...")


# app = FastAPI(lifespan=lifespan)


# # 📁 Folders
# IMAGE_DIR = "images"
# FACE_DB_DIR = "face_db"

# os.makedirs(IMAGE_DIR, exist_ok=True)
# os.makedirs(FACE_DB_DIR, exist_ok=True)


# @app.get("/")
# def root():
#     return {"message": "MemoryCare ML Service Running"}


# # 🔥 BLOCKING ENDPOINT (bridge waits here)
# @app.get("/wait_for_result")
# async def wait_for_result():
#     result = await result_queue.get()
#     return result


# @app.post("/detect")
# async def detect(request: Request):
#     try:
#         data = await request.json()
#         base64_image = data.get("image")

#         if not base64_image:
#             return None

#         # 🔥 Decode
#         try:
#             img = base64_to_image(base64_image)
#         except Exception as e:
#             print("❌ BASE64 ERROR:", str(e))
#             return None

#         if img is None:
#             return None

#         # Resize
#         img = cv2.resize(img, (640, 480))

#         # 🔥 Face Detection
#         faces = detect_faces(img)

#         if len(faces) == 0:
#             return None

#         # 🔥 Largest face
#         x, y, w, h = max(faces, key=lambda r: r[2] * r[3])

#         face_crop = img[y:y+h, x:x+w]

#         if face_crop.size == 0:
#             return None

#         face_crop = cv2.resize(face_crop, (160, 160))

#         # 🔥 Embedding
#         embedding = get_face_embedding(face_crop)

#         if embedding is None:
#             return None

#         # 🔥 Matching
#         exists, match_file, dist = is_same_person(embedding)

#         # 🔥 EXISTING FACE
#         if exists:
#             person_id = match_file.split(".")[0]

#             result = {
#                 "person_id": person_id,
#                 "is_new": False
#             }

#             print(f"⚠️ EXISTS → {person_id}")

#             await result_queue.put(result)
#             return result

#         # 🔥 NEW FACE
#         filename = f"{uuid.uuid4().hex}.jpg"
#         filepath = os.path.join(FACE_DB_DIR, filename)

#         cv2.imwrite(filepath, face_crop)

#         person_id = filename.split(".")[0]

#         result = {
#             "person_id": person_id,
#             "is_new": True
#         }

#         print(f"🆕 NEW → {person_id}")

#         await result_queue.put(result)
#         return result

#     except Exception as e:
#         print("❌ CRITICAL ERROR:", str(e))
#         return None