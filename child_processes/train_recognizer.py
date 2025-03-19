import cv2
import sys
import os
import numpy as np

def train_face_recognizer(dataset_dir, output_dir):
    """
    Train a face recognizer using images from the dataset directory and save the model to the output directory.
    
    Args:
        dataset_dir (str): Path to the directory containing user folders with face images.
        output_dir (str): Path to the directory where the trained model will be saved.
    """
    print("Started training face recognition")

    # Create the LBPH face recognizer
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    faces = []
    labels = []

    # Iterate through each user directory in the dataset
    for user_id in os.listdir(dataset_dir):
        user_dir = os.path.join(dataset_dir, user_id)
        if os.path.isdir(user_dir):
            print(f"Processing user: {user_id}")
            for image_name in os.listdir(user_dir):
                img_path = os.path.join(user_dir, image_name)
                # Load the image in grayscale mode
                gray = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if gray is None:
                    print(f"Warning: Unable to read image {img_path}")
                    continue
                faces.append(gray)
                # Extract label from user_id (e.g., user_123 -> 123)
                try:
                    label = int(user_id.split('_')[1])  # Assumes user_id is in the format "user_<number>"
                    labels.append(label)
                except Exception as e:
                    print(f"Error processing label for {user_id}: {e}")

    # Ensure that we have faces and labels
    if len(faces) == 0 or len(labels) == 0:
        print("No training data found. Check the dataset directory.")
        return

    # Train the recognizer with the faces and corresponding labels
    recognizer.train(faces, np.array(labels))
    
    # Save the trained model to a file
    # if not os.path.exists(output_dir):
    #     os.makedirs(output_dir)  # Create the output directory if it doesn't exist

    os.makedirs(output_dir, exist_ok=True)
    # recognizer.save(trainer_path)
    trainer_path = os.path.join(output_dir, 'trainer.yml') 
    print("Saving trainer to:", trainer_path)
    recognizer.save(trainer_path)
    print("Saving trainer to:", trainer_path)
    # recognizer.save(trainer_path)

    print(f"Training completed and model saved as '{trainer_path}'.")

if __name__ == '__main__':
    # Validate command-line arguments
    if len(sys.argv) != 3:
        print("Usage: python train_recognizer.py <dataset_directory> <output_directory>")
        sys.exit(1)

    dataset_dir = sys.argv[1]
    output_dir = sys.argv[2]

    # Validate dataset directory
    if not os.path.exists(dataset_dir):
        print(f"Error: Dataset directory '{dataset_dir}' does not exist.")
        sys.exit(1)

    # Train the face recognizer
    train_face_recognizer(dataset_dir, output_dir)