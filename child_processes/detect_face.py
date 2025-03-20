import cv2
import sys

# Function to detect face
def detect_face(image_path):
    # Load the pre-trained face detector model from OpenCV
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        print("Image not found.")
        return False

    # Convert image to grayscale (necessary for face detection)
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    # If faces are detected
    if len(faces) > 0:
        return True
    else:
        return False

# Main function to get input from command-line arguments
def main():
    # Check if an image path is provided in the arguments
    if len(sys.argv) < 3:
        print("Please provide the image file path as an argument.")
        sys.exit(1)

    # Get the image path from command-line arguments
    image_path = sys.argv[1]
    user_id = sys.argv[2]

    # Call the detect_face function
    result = detect_face(image_path)

    # Print the result based on detection
    if result:
        print("Face detected and visible from the front.")
    else:
        print("No front-facing face detected.")

if __name__ == "__main__":
    main()