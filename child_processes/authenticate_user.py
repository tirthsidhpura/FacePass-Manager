import cv2
import sys

def authenticate_user_from_image(user_id, image_path, trainer_path):
    # Load the trained recognizer
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(trainer_path)

    # Load the image from the provided file path
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image from path: {image_path}")
        return

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Load the Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        print("No faces detected in the image.")
        return

    authenticated = False
    for (x, y, w, h) in faces:
        # Extract the face region
        face_region = gray[y:y+h, x:x+w]

        # Predict the label and confidence for the detected face
        label, confidence = recognizer.predict(face_region)

        # Decide if authentication is successful (lower confidence means a better match)
        if confidence < 50:
            print(f"AUTH_SUCCESS: User {label} authenticated with confidence {confidence:.2f}.")
            authenticated = True
            break
        else:
            print(f"AUTH_FAILED: Confidence {confidence:.2f} is not sufficient.")

    if not authenticated:
        print("AUTH_FAILED: No face authenticated.")

if __name__ == '__main__':
    # Expecting command line arguments: user_id and image_path
    if len(sys.argv) < 3:
        print("Usage: python authenticate_from_image.py <user_id> <image_path>")
    else:
        user_id = sys.argv[1]
        image_path = sys.argv[2]
        trainer_path = sys.argv[3]
        authenticate_user_from_image(user_id, image_path, trainer_path)
