import base64
import numpy as np
import cv2

def base64_to_image(base64_string):
    try:
        # Remove header if exists
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]

        img_bytes = base64.b64decode(base64_string)

        np_arr = np.frombuffer(img_bytes, np.uint8)

        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Decoded image is None")

        return img

    except Exception as e:
        print("BASE64 ERROR:", str(e))
        raise