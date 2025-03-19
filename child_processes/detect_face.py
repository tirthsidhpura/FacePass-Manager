import sys
import json
import cv2
import dlib
import numpy as np

# Load dlib's face detector and landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")  # Download this file

def detect_face_orientation(image_path):
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Image not found or invalid format")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = detector(gray)

        if len(faces) == 0:
            print(json.dumps({"status": "No face detected"}))
            sys.exit(0)

        for face in faces:
            landmarks = predictor(gray, face)

            # Get key points
            nose = (landmarks.part(30).x, landmarks.part(30).y)
            left_eye = (landmarks.part(36).x, landmarks.part(36).y)
            right_eye = (landmarks.part(45).x, landmarks.part(45).y)
            left_mouth = (landmarks.part(48).x, landmarks.part(48).y)
            right_mouth = (landmarks.part(54).x, landmarks.part(54).y)

            # Compute distances
            eye_distance = abs(left_eye[0] - right_eye[0])
            mouth_distance = abs(left_mouth[0] - right_mouth[0])
            nose_offset = abs(nose[0] - (left_eye[0] + right_eye[0]) // 2)

            # Define threshold for forward-facing detection
            if nose_offset < eye_distance * 0.15 and mouth_distance > eye_distance * 0.8:
                result = {"status": "Face is forward"}
            else:
                result = {"status": "Face is not forward"}

            print(json.dumps(result))  # Send result to stdout
            sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)  # Send errors to stderr
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}), file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    detect_face_orientation(image_path)
