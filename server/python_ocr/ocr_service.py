#!/usr/bin/env python3
"""
Standalone OCR Service - Exact copy of working temp folder logic
This is a permanent part of your project, not dependent on temp folder
"""
import sys
import json
import base64
import cv2
import numpy as np
import time
import os
from pathlib import Path

# Add the current directory to path for imports
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from onnx_paddleocr import ONNXPaddleOcr

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python ocr_service.py <image_path>"}))
        sys.exit(1)
    
    try:
        # Get image path from command line
        image_path = sys.argv[1]
        
        # Load image directly from file
        img = cv2.imread(image_path)
        
        if img is None:
            print(json.dumps({"error": "Failed to load image"}))
            sys.exit(1)
        
        # Initialize OCR model - exact same as working temp code
        model = ONNXPaddleOcr(use_angle_cls=False, use_gpu=False)
        
        # Run OCR
        start_time = time.time()
        result = model.ocr(img)
        end_time = time.time()
        
        # Format results for Node.js
        ocr_results = []
        if result and result[0]:
            for box_result in result[0]:
                box = box_result[0]  # 4 points
                text_info = box_result[1]  # [text, confidence]
                text = text_info[0]
                confidence = text_info[1]
                
                ocr_results.append({
                    "box": box,
                    "text": text,
                    "confidence": confidence
                })
        
        # Return JSON response
        response = {
            "success": True,
            "results": ocr_results,
            "processing_time": end_time - start_time,
            "total_texts": len(ocr_results),
            "extracted_text": " ".join([r["text"] for r in ocr_results])
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}))
        sys.exit(1)

if __name__ == "__main__":
    main()
