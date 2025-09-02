#!/usr/bin/env python3
"""
Face Recognition System using ONNX Model
This system loads the trained ViT face recognition model and provides
face verification, matching, and embedding extraction capabilities.
"""

import cv2
import numpy as np
import onnxruntime as ort
import json
import os
from typing import Tuple, List, Optional
import time

class FaceRecognitionSystem:
    def __init__(self, model_path: str = "onnx_model/model.onnx", config_path: str = "onnx_model/config.json"):
        """
        Initialize the Face Recognition System
        
        Args:
            model_path: Path to the ONNX model file
            config_path: Path to the model configuration file
        """
        self.model_path = model_path
        self.config_path = config_path
        self.session = None
        self.config = None
        self.input_name = None
        self.output_name = None
        
        # Load configuration
        self._load_config()
        
        # Initialize ONNX runtime session
        self._initialize_model()
        
        # Face detection cascade
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        print("✅ Face Recognition System initialized successfully!")
        print(f"📊 Model: {self.config.get('architecture', 'Unknown')}")
        print(f"📏 Input size: {self.config.get('input_size', 'Unknown')}")
        print(f"🔢 Output dimensions: {self.config.get('num_classes', 'Unknown')}")
    
    def _load_config(self):
        """Load model configuration"""
        try:
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
            print(f"✅ Configuration loaded from {self.config_path}")
        except Exception as e:
            print(f"❌ Error loading config: {e}")
            # Use default config
            self.config = {
                "input_size": [3, 112, 112],
                "mean": [0.5, 0.5, 0.5],
                "std": [0.5, 0.5, 0.5],
                "num_classes": 512
            }
    
    def _initialize_model(self):
        """Initialize ONNX runtime session"""
        try:
            # Create ONNX runtime session
            providers = ['CPUExecutionProvider']
            self.session = ort.InferenceSession(self.model_path, providers=providers)
            
            # Get input and output names
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name
            
            print(f"✅ ONNX model loaded successfully from {self.model_path}")
            print(f"📥 Input: {self.input_name}")
            print(f"📤 Output: {self.output_name}")
            
        except Exception as e:
            print(f"❌ Error loading ONNX model: {e}")
            raise
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for the model
        
        Args:
            image: Input image (BGR format from OpenCV)
            
        Returns:
            Preprocessed image tensor
        """
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize to model input size
        input_size = self.config["input_size"][1:]  # [112, 112]
        image_resized = cv2.resize(image_rgb, input_size, interpolation=cv2.INTER_LINEAR)
        
        # Normalize
        mean = np.array(self.config["mean"], dtype=np.float32)
        std = np.array(self.config["std"], dtype=np.float32)
        
        # Convert to float and normalize
        image_normalized = image_resized.astype(np.float32) / 255.0
        image_normalized = (image_normalized - mean) / std
        
        # Convert to NCHW format (batch, channels, height, width)
        image_tensor = np.transpose(image_normalized, (2, 0, 1))
        image_tensor = np.expand_dims(image_tensor, axis=0)
        
        # Ensure float32 precision
        image_tensor = image_tensor.astype(np.float32)
        
        return image_tensor
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in the image
        
        Args:
            image: Input image
            
        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        return faces
    
    def extract_face_embedding(self, image: np.ndarray, face_bbox: Optional[Tuple[int, int, int, int]] = None) -> np.ndarray:
        """
        Extract face embedding from image
        
        Args:
            image: Input image
            face_bbox: Face bounding box (x, y, w, h). If None, use entire image
            
        Returns:
            Face embedding vector (512-dimensional)
        """
        if face_bbox is not None:
            x, y, w, h = face_bbox
            face_image = image[y:y+h, x:x+w]
        else:
            face_image = image
        
        # Preprocess image
        input_tensor = self.preprocess_image(face_image)
        
        # Run inference
        outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
        embedding = outputs[0][0]  # Remove batch dimension
        
        # Normalize embedding (L2 normalization)
        embedding = embedding / np.linalg.norm(embedding)
        
        return embedding
    
    def compare_faces(self, embedding1: np.ndarray, embedding2: np.ndarray, threshold: float = 0.6) -> Tuple[bool, float]:
        """
        Compare two face embeddings
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            threshold: Similarity threshold
            
        Returns:
            Tuple of (is_match, similarity_score)
        """
        # Calculate cosine similarity
        similarity = np.dot(embedding1, embedding2)
        
        # Determine if faces match
        is_match = similarity >= threshold
        
        return is_match, similarity
    
    def verify_face(self, reference_image: np.ndarray, test_image: np.ndarray, 
                   threshold: float = 0.6) -> Tuple[bool, float, str]:
        """
        Verify if two images contain the same person
        
        Args:
            reference_image: Reference face image
            test_image: Test face image
            threshold: Similarity threshold
            
        Returns:
            Tuple of (is_verified, confidence, message)
        """
        try:
            # Extract embeddings
            ref_embedding = self.extract_face_embedding(reference_image)
            test_embedding = self.extract_face_embedding(test_image)
            
            # Compare faces
            is_match, similarity = self.compare_faces(ref_embedding, test_embedding, threshold)
            
            if is_match:
                message = f"✅ Faces match! Similarity: {similarity:.3f}"
            else:
                message = f"❌ Faces don't match. Similarity: {similarity:.3f}"
            
            return is_match, similarity, message
            
        except Exception as e:
            return False, 0.0, f"❌ Error during verification: {str(e)}"
    
    def process_image_file(self, image_path: str, face_bbox: Optional[Tuple[int, int, int, int]] = None) -> np.ndarray:
        """
        Process image file and extract face embedding
        
        Args:
            image_path: Path to image file
            face_bbox: Face bounding box (x, y, w, h). If None, use entire image
            
        Returns:
            Face embedding vector
        """
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        # Extract embedding
        embedding = self.extract_face_embedding(image, face_bbox)
        return embedding
    
    def save_embedding(self, embedding: np.ndarray, filename: str):
        """Save embedding to file"""
        np.save(filename, embedding)
        print(f"💾 Embedding saved to {filename}")
    
    def load_embedding(self, filename: str) -> np.ndarray:
        """Load embedding from file"""
        embedding = np.load(filename)
        print(f"📂 Embedding loaded from {filename}")
        return embedding

def main():
    """Main function to demonstrate the face recognition system"""
    print("🚀 Starting Face Recognition System Demo...")
    print("=" * 50)
    
    try:
        # Initialize the system
        face_system = FaceRecognitionSystem()
        
        print("\n🎯 System is ready! You can now:")
        print("1. Extract face embeddings from images")
        print("2. Compare faces for verification")
        print("3. Save and load embeddings")
        print("4. Use the system in your KYC application")
        
        print("\n💡 Example usage:")
        print("face_system = FaceRecognitionSystem()")
        print("embedding = face_system.extract_face_embedding(image)")
        print("is_match, similarity = face_system.compare_faces(emb1, emb2)")
        
    except Exception as e:
        print(f"❌ Error initializing system: {e}")
        print("💡 Make sure you have:")
        print("   - Installed all requirements: pip install -r requirements.txt")
        print("   - The ONNX model file in onnx_model/model.onnx")
        print("   - The config file in onnx_model/config.json")

if __name__ == "__main__":
    main()
