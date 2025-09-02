#!/usr/bin/env python3
"""
Demo script for Face Recognition System
This script demonstrates how to use the face recognition system
"""

import cv2
import numpy as np
from face_recognition_system import FaceRecognitionSystem
import os

def create_sample_image():
    """Create a sample image for testing if no images exist"""
    # Create a simple colored image (112x112)
    img = np.zeros((112, 112, 3), dtype=np.uint8)
    
    # Add some color gradients
    for i in range(112):
        for j in range(112):
            img[i, j] = [
                int(255 * i / 112),  # Red gradient
                int(255 * j / 112),  # Green gradient
                128  # Blue constant
            ]
    
    # Save the sample image
    cv2.imwrite("sample_image.jpg", img)
    print("📸 Created sample image: sample_image.jpg")
    return "sample_image.jpg"

def demo_face_recognition():
    """Demonstrate face recognition capabilities"""
    print("🎭 Face Recognition System Demo")
    print("=" * 40)
    
    try:
        # Initialize the system
        print("🔧 Initializing Face Recognition System...")
        face_system = FaceRecognitionSystem()
        
        # Create sample images if they don't exist
        if not os.path.exists("sample_image.jpg"):
            sample_path = create_sample_image()
        else:
            sample_path = "sample_image.jpg"
        
        print(f"\n📸 Using sample image: {sample_path}")
        
        # Load sample image
        sample_image = cv2.imread(sample_path)
        if sample_image is None:
            print("❌ Could not load sample image")
            return
        
        # Extract face embedding
        print("\n🔍 Extracting face embedding...")
        start_time = time.time()
        embedding = face_system.extract_face_embedding(sample_image)
        end_time = time.time()
        
        print(f"✅ Embedding extracted successfully!")
        print(f"📊 Embedding shape: {embedding.shape}")
        print(f"⏱️  Processing time: {(end_time - start_time)*1000:.2f}ms")
        print(f"🔢 First 5 values: {embedding[:5]}")
        
        # Test face comparison (same image)
        print("\n🔄 Testing face comparison (same image)...")
        embedding2 = face_system.extract_face_embedding(sample_image)
        is_match, similarity = face_system.compare_faces(embedding, embedding2)
        
        print(f"✅ Same image comparison:")
        print(f"   Match: {is_match}")
        print(f"   Similarity: {similarity:.6f}")
        
        # Save embedding
        print("\n💾 Saving embedding...")
        face_system.save_embedding(embedding, "sample_embedding.npy")
        
        # Load embedding
        print("\n📂 Loading embedding...")
        loaded_embedding = face_system.load_embedding("sample_embedding.npy")
        
        # Verify loaded embedding
        is_match_loaded, similarity_loaded = face_system.compare_faces(embedding, loaded_embedding)
        print(f"✅ Loaded embedding verification:")
        print(f"   Match: {is_match_loaded}")
        print(f"   Similarity: {similarity_loaded:.6f}")
        
        print("\n🎉 Demo completed successfully!")
        print("\n💡 You can now:")
        print("   1. Use this system in your KYC application")
        print("   2. Process real face images")
        print("   3. Compare faces for verification")
        print("   4. Save and load face embeddings")
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure you have installed requirements: pip install -r requirements.txt")
        print("   2. Check that the ONNX model exists: onnx_model/model.onnx")
        print("   3. Verify the config file: onnx_model/config.json")

if __name__ == "__main__":
    import time
    demo_face_recognition()
