from deepface import DeepFace


def detect_faces(image):
    """
    Detect faces using DeepFace (much more robust than Haar Cascade)
    Returns list of (x, y, w, h)
    """

    try:
        detections = DeepFace.extract_faces(
            img_path=image,
            detector_backend="opencv",   # change to "retinaface" for even better accuracy
            enforce_detection=False
        )

        faces = []

        for d in detections:
            area = d.get("facial_area", {})

            x = area.get("x", 0)
            y = area.get("y", 0)
            w = area.get("w", 0)
            h = area.get("h", 0)

            faces.append((x, y, w, h))

        return faces

    except Exception as e:
        print("❌ Face detection error:", str(e))
        return []


# import cv2

# # Load Haar Cascade (comes with OpenCV)
# face_cascade = cv2.CascadeClassifier(
#     cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
# )


# def detect_faces(image):
#     """
#     Detect faces in image
#     Returns list of (x, y, w, h)
#     """
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

#     faces = face_cascade.detectMultiScale(
#         gray,
#         scaleFactor=1.3,
#         minNeighbors=5,
#         minSize=(30, 30)
#     )

#     return faces