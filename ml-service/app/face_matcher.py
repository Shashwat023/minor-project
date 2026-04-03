import os
import numpy as np
from deepface import DeepFace
from numpy.linalg import norm
# python -m uvicorn app.main:app --reload
DB_PATH = "face_db"
os.makedirs(DB_PATH, exist_ok=True)


# 🔥 COSINE DISTANCE (better than Euclidean)
def cosine_distance(a, b):
    return 1 - (np.dot(a, b) / (norm(a) * norm(b)))


# 🔥 EMBEDDING
def get_face_embedding(image):
    try:
        print("🔍 Generating embedding...")

        emb = DeepFace.represent(
            image,
            model_name="ArcFace",   # ✅ upgraded model
            enforce_detection=True
        )[0]["embedding"]

        return np.array(emb)

    except Exception as e:
        print(f"❌ Error in embedding generation: {str(e)}")
        return None


# 🔥 CACHE (prevents recomputing every frame)
cached_embeddings = None
cached_filenames = None


def load_database():
    global cached_embeddings, cached_filenames

    if cached_embeddings is not None:
        return cached_embeddings, cached_filenames

    embeddings = []
    filenames = []

    for file in os.listdir(DB_PATH):
        path = os.path.join(DB_PATH, file)

        emb = get_face_embedding(path)

        if emb is not None:
            embeddings.append(emb)
            filenames.append(file)

    cached_embeddings = embeddings
    cached_filenames = filenames

    return embeddings, filenames


# 🔥 MATCHING
def is_same_person(new_embedding, threshold=0.4):
    known_embeddings, filenames = load_database()

    if len(known_embeddings) == 0:
        return False, None, None

    # 🔥 cosine distance
    distances = [
        cosine_distance(new_embedding, emb)
        for emb in known_embeddings
    ]

    min_dist = min(distances)
    best_match = filenames[distances.index(min_dist)]

    print(f"🔍 Best Match: {best_match}, Distance: {min_dist:.4f}")

    if min_dist < threshold:
        return True, best_match, float(min_dist)

    return False, best_match, float(min_dist)

# 🔥 RESET CACHE (REQUIRED)
def reset_cache():
    global cached_embeddings, cached_filenames
    cached_embeddings = None
    cached_filenames = None


# import os
# import numpy as np
# from deepface import DeepFace
# # python -m uvicorn app.main:app --reload
# DB_PATH = "face_db"
# os.makedirs(DB_PATH, exist_ok=True)


# def get_face_embedding(image):
    
#     try:
#         print("🔍 Generating embedding...")  # Debug log

#         # Generate embedding
#         emb = DeepFace.represent(
#             image,
#             model_name="ArcFace",  # Use other models if necessary (VGG-Face, OpenFace)
#             enforce_detection=True
#         )[0]["embedding"]

#         # Print embedding details for debugging
#         print(f"✅ Embedding: {emb[:10]}...")  # Print first 10 values for quick inspection

#         return np.array(emb)

#     except Exception as e:
#         print(f"❌ Error in embedding generation: {str(e)}")
#         return None
    

# def load_database():
#     embeddings = []
#     filenames = []

#     for file in os.listdir(DB_PATH):
#         path = os.path.join(DB_PATH, file)

#         emb = get_face_embedding(path)

#         if emb is not None:
#             embeddings.append(emb)
#             filenames.append(file)

#     return embeddings, filenames


# def is_same_person(new_embedding, threshold=0.8):
#     known_embeddings, filenames = load_database()

#     if len(known_embeddings) == 0:
#         return False, None, None

#     distances = [
#         np.linalg.norm(new_embedding - emb)
#         for emb in known_embeddings
#     ]

#     min_dist = min(distances)
#     best_match = filenames[distances.index(min_dist)]

#     # 🔥 PRINT distance
#     print(f"🔍 Best Match: {best_match}, Distance: {min_dist}")

#     if min_dist < threshold:
#         return True, best_match, float(min_dist)

#     return False, None, float(min_dist)


