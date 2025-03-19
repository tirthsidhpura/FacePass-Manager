import cv2
import os
import sys
import glob

def process_faces(user_id, input_dir, output_dir):
    # Load the Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Create output directory for storing user images if it doesn't exist
    output_dir = output_dir
    print(output_dir)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Processing images for user {user_id} from {input_dir}...")

    # Get list of images from the input directory (adjust the pattern if needed)
    image_paths = glob.glob(os.path.join(input_dir, '*.jpg'))
    # You can add other extensions if needed:
    image_paths += glob.glob(os.path.join(input_dir, '*.png'))
    
    # Process up to 20 images
    img_count = 0
    for img_path in image_paths:
        # print(f"Processing image: {img_path}")
        image = cv2.imread(img_path)
        if image is None:
            print(f"Could not read image: {img_path}")
            continue
        if img_count >= 30:
            break

        # Read the image
        image = cv2.imread(img_path)
        if image is None:
            print(f"Could not read image: {img_path}")
            continue

        # Convert the image to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect faces in the image
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        # Process each detected face
        for (x, y, w, h) in faces:
            # Extract face region and save it
            face_image = gray[y:y + h, x:x + w]
            output_path = os.path.join(output_dir, f"face_{img_count}.jpg")
            cv2.imwrite(output_path, face_image)
            # print(f"Saved face image: {output_path}")
            img_count += 1

            # Only process one face per image
            break

    print(f"Finished processing images for user {user_id}.")

# Expecting command line arguments: user_id and input_dir
if len(sys.argv) > 2:
    user_id = sys.argv[1]
    input_dir = sys.argv[2]
    output_dir = sys.argv[3]
    process_faces(user_id, input_dir, output_dir)
else:
    print("Usage: python process_faces.py <user_id> <input_directory>")
