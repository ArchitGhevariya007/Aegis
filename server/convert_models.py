#!/usr/bin/env python3
"""
Simple PaddlePaddle to ONNX converter for Windows
"""

import os
import sys
import subprocess
from pathlib import Path

def convert_models():
    """Convert PaddlePaddle models to ONNX"""
    
    # Get absolute paths
    current_dir = Path(__file__).parent
    model_dir = current_dir / 'ai_models' / 'onnx_model'
    
    print(f"Working directory: {current_dir}")
    print(f"Model directory: {model_dir}")
    
    # Check if model directory exists
    if not model_dir.exists():
        print(f"❌ Model directory not found: {model_dir}")
        return
    
    # List all files in the directory
    print("\nFiles in model directory:")
    for file in model_dir.iterdir():
        print(f"  {file.name}")
    
    # Convert detection model
    det_model = model_dir / 'pp_ocrv3_det.pdmodel'
    det_params = model_dir / 'pp_ocrv3_det.pdiparams'
    det_output = model_dir / 'paddle_ocr_det.onnx'
    
    if det_model.exists() and det_params.exists():
        print(f"\n🔄 Converting detection model...")
        try:
            cmd = [
                'paddle2onnx',
                '--model_dir', str(model_dir),
                '--model_filename', 'pp_ocrv3_det.pdmodel',
                '--params_filename', 'pp_ocrv3_det.pdiparams',
                '--save_file', str(det_output),
                '--opset_version', '11'
            ]
            
            print(f"Command: {' '.join(cmd)}")
            result = subprocess.run(cmd, cwd=str(current_dir), capture_output=True, text=True)
            
            if result.returncode == 0 and det_output.exists():
                size_mb = det_output.stat().st_size / (1024 * 1024)
                print(f"✅ Detection model converted successfully! ({size_mb:.1f} MB)")
            else:
                print(f"❌ Detection model conversion failed")
                print(f"Error: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error converting detection model: {e}")
    else:
        print(f"❌ Detection model files missing:")
        print(f"  Model: {det_model.exists()}")
        print(f"  Params: {det_params.exists()}")
    
    # Convert recognition model
    rec_model = model_dir / 'pp_ocrv3_rec.pdmodel'
    rec_params = model_dir / 'pp_ocrv3_rec.pdiparams'
    rec_output = model_dir / 'paddle_ocr_rec.onnx'
    
    if rec_model.exists() and rec_params.exists():
        print(f"\n🔄 Converting recognition model...")
        try:
            cmd = [
                'paddle2onnx',
                '--model_dir', str(model_dir),
                '--model_filename', 'pp_ocrv3_rec.pdmodel',
                '--params_filename', 'pp_ocrv3_rec.pdiparams',
                '--save_file', str(rec_output),
                '--opset_version', '11'
            ]
            
            print(f"Command: {' '.join(cmd)}")
            result = subprocess.run(cmd, cwd=str(current_dir), capture_output=True, text=True)
            
            if result.returncode == 0 and rec_output.exists():
                size_mb = rec_output.stat().st_size / (1024 * 1024)
                print(f"✅ Recognition model converted successfully! ({size_mb:.1f} MB)")
            else:
                print(f"❌ Recognition model conversion failed")
                print(f"Error: {result.stderr}")
                
        except Exception as e:
            print(f"❌ Error converting recognition model: {e}")
    else:
        print(f"❌ Recognition model files missing:")
        print(f"  Model: {rec_model.exists()}")
        print(f"  Params: {rec_params.exists()}")
    
    # Check final results
    print(f"\n📋 Conversion Summary:")
    if det_output.exists():
        print(f"✅ Detection ONNX: {det_output.name}")
    else:
        print(f"❌ Detection ONNX: Not created")
        
    if rec_output.exists():
        print(f"✅ Recognition ONNX: {rec_output.name}")
    else:
        print(f"❌ Recognition ONNX: Not created")

if __name__ == "__main__":
    convert_models()
