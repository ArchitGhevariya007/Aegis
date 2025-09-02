#!/usr/bin/env python3
"""
Web Interface for Face Recognition System
Simple Flask web app to test face recognition capabilities
"""

from flask import Flask, render_template_string, request, jsonify, send_file
import cv2
import numpy as np
import base64
import io
import os
from face_recognition_system import FaceRecognitionSystem
import tempfile

app = Flask(__name__)

# Initialize face recognition system
try:
    face_system = FaceRecognitionSystem()
    print("✅ Face Recognition System loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load Face Recognition System: {e}")
    face_system = None

# HTML template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Face Recognition System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .upload-area { border: 2px dashed #ccc; padding: 20px; text-align: center; margin: 10px 0; }
        .upload-area.dragover { border-color: #007bff; background-color: #f8f9fa; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .btn:disabled { background: #6c757d; cursor: not-allowed; }
        .result { margin-top: 15px; padding: 10px; border-radius: 5px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .image-preview { max-width: 300px; max-height: 300px; margin: 10px; border: 1px solid #ddd; }
        .comparison { display: flex; justify-content: space-around; align-items: center; }
        .similarity { font-size: 24px; font-weight: bold; color: #007bff; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Face Recognition System</h1>
            <p>Test your ONNX face recognition model</p>
        </div>

        <div class="section">
            <h2>📸 Single Image Processing</h2>
            <div class="upload-area" id="singleUpload">
                <p>Drag & drop an image here or click to select</p>
                <input type="file" id="singleImage" accept="image/*" style="display: none;">
                <button class="btn" onclick="document.getElementById('singleImage').click()">Select Image</button>
            </div>
            <div id="singlePreview"></div>
            <button class="btn" onclick="processSingleImage()" id="processBtn" disabled>Process Image</button>
            <div id="singleResult"></div>
        </div>

        <div class="section">
            <h2>🔄 Face Comparison</h2>
            <div class="comparison">
                <div>
                    <h3>Reference Image</h3>
                    <div class="upload-area" id="refUpload">
                        <p>Drop reference image</p>
                        <input type="file" id="refImage" accept="image/*" style="display: none;">
                        <button class="btn" onclick="document.getElementById('refImage').click()">Select</button>
                    </div>
                    <div id="refPreview"></div>
                </div>
                <div>
                    <h3>Test Image</h3>
                    <div class="upload-area" id="testUpload">
                        <p>Drop test image</p>
                        <input type="file" id="testImage" accept="image/*" style="display: none;">
                        <button class="btn" onclick="document.getElementById('testImage').click()">Select</button>
                    </div>
                    <div id="testPreview"></div>
                </div>
            </div>
            <button class="btn" onclick="compareFaces()" id="compareBtn" disabled>Compare Faces</button>
            <div id="compareResult"></div>
        </div>

        <div class="section">
            <h2>📊 System Status</h2>
            <div id="systemStatus"></div>
        </div>
    </div>

    <script>
        let singleImageData = null;
        let refImageData = null;
        let testImageData = null;

        // File upload handlers
        function setupFileUpload(inputId, previewId, imageDataVar) {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'image-preview';
                        preview.innerHTML = '';
                        preview.appendChild(img);
                        
                        // Store image data
                        if (imageDataVar === 'singleImageData') singleImageData = e.target.result;
                        if (imageDataVar === 'refImageData') refImageData = e.target.result;
                        if (imageDataVar === 'testImageData') testImageData = e.target.result;
                        
                        updateButtons();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        function updateButtons() {
            document.getElementById('processBtn').disabled = !singleImageData;
            document.getElementById('compareBtn').disabled = !(refImageData && testImageData);
        }

        function processSingleImage() {
            if (!singleImageData) return;
            
            fetch('/process_image', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({image: singleImageData})
            })
            .then(response => response.json())
            .then(data => {
                const resultDiv = document.getElementById('singleResult');
                if (data.success) {
                    resultDiv.innerHTML = `<div class="result success">
                        <h3>✅ Processing Successful</h3>
                        <p><strong>Embedding Shape:</strong> ${data.embedding_shape}</p>
                        <p><strong>Processing Time:</strong> ${data.processing_time}ms</p>
                        <p><strong>First 5 Values:</strong> [${data.first_values.join(', ')}]</p>
                    </div>`;
                } else {
                    resultDiv.innerHTML = `<div class="result error">
                        <h3>❌ Processing Failed</h3>
                        <p>${data.error}</p>
                    </div>`;
                }
            })
            .catch(error => {
                document.getElementById('singleResult').innerHTML = `<div class="result error">
                    <h3>❌ Error</h3>
                    <p>${error.message}</p>
                </div>`;
            });
        }

        function compareFaces() {
            if (!refImageData || !testImageData) return;
            
            fetch('/compare_faces', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    reference_image: refImageData,
                    test_image: testImageData
                })
            })
            .then(response => response.json())
            .then(data => {
                const resultDiv = document.getElementById('compareResult');
                if (data.success) {
                    const similarityClass = data.is_match ? 'success' : 'error';
                    resultDiv.innerHTML = `<div class="result ${similarityClass}">
                        <h3>${data.is_match ? '✅ Faces Match!' : '❌ Faces Don\'t Match'}</h3>
                        <div class="similarity">Similarity: ${(data.similarity * 100).toFixed(2)}%</div>
                        <p><strong>Threshold:</strong> ${(data.threshold * 100).toFixed(1)}%</p>
                        <p><strong>Message:</strong> ${data.message}</p>
                    </div>`;
                } else {
                    resultDiv.innerHTML = `<div class="result error">
                        <h3>❌ Comparison Failed</h3>
                        <p>${data.error}</p>
                    </div>`;
                }
            })
            .catch(error => {
                document.getElementById('compareResult').innerHTML = `<div class="result error">
                    <h3>❌ Error</h3>
                    <p>${error.message}</p>
                </div>`;
            });
        }

        function checkSystemStatus() {
            fetch('/status')
            .then(response => response.json())
            .then(data => {
                const statusDiv = document.getElementById('systemStatus');
                if (data.status === 'ready') {
                    statusDiv.innerHTML = `<div class="result success">
                        <h3>✅ System Ready</h3>
                        <p><strong>Model:</strong> ${data.model_info.architecture}</p>
                        <p><strong>Input Size:</strong> ${data.model_info.input_size.join(' x ')}</p>
                        <p><strong>Output Dimensions:</strong> ${data.model_info.output_dimensions}</p>
                    </div>`;
                } else {
                    statusDiv.innerHTML = `<div class="result error">
                        <h3>❌ System Not Ready</h3>
                        <p>${data.error}</p>
                    </div>`;
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            setupFileUpload('singleImage', 'singlePreview', 'singleImageData');
            setupFileUpload('refImage', 'refPreview', 'refImageData');
            setupFileUpload('testImage', 'testPreview', 'testImageData');
            checkSystemStatus();
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/status')
def status():
    if face_system is None:
        return jsonify({
            'status': 'error',
            'error': 'Face Recognition System not loaded'
        })
    
    return jsonify({
        'status': 'ready',
        'model_info': {
            'architecture': face_system.config.get('architecture', 'Unknown'),
            'input_size': face_system.config.get('input_size', [3, 112, 112]),
            'output_dimensions': face_system.config.get('num_classes', 512)
        }
    })

@app.route('/process_image', methods=['POST'])
def process_image():
    try:
        data = request.json
        image_data = data['image']
        
        # Decode base64 image
        image_data = image_data.split(',')[1]  # Remove data:image/jpeg;base64, prefix
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'success': False, 'error': 'Could not decode image'})
        
        # Process image
        import time
        start_time = time.time()
        embedding = face_system.extract_face_embedding(image)
        end_time = time.time()
        
        return jsonify({
            'success': True,
            'embedding_shape': list(embedding.shape),
            'processing_time': round((end_time - start_time) * 1000, 2),
            'first_values': [round(float(x), 4) for x in embedding[:5]]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/compare_faces', methods=['POST'])
def compare_faces():
    try:
        data = request.json
        ref_image_data = data['reference_image']
        test_image_data = data['test_image']
        
        # Decode reference image
        ref_image_data = ref_image_data.split(',')[1]
        ref_image_bytes = base64.b64decode(ref_image_data)
        ref_nparr = np.frombuffer(ref_image_bytes, np.uint8)
        ref_image = cv2.imdecode(ref_nparr, cv2.IMREAD_COLOR)
        
        # Decode test image
        test_image_data = test_image_data.split(',')[1]
        test_image_bytes = base64.b64decode(test_image_data)
        test_nparr = np.frombuffer(test_image_bytes, np.uint8)
        test_image = cv2.imdecode(test_nparr, cv2.IMREAD_COLOR)
        
        if ref_image is None or test_image is None:
            return jsonify({'success': False, 'error': 'Could not decode one or both images'})
        
        # Compare faces
        is_match, similarity = face_system.compare_faces(
            face_system.extract_face_embedding(ref_image),
            face_system.extract_face_embedding(test_image),
            threshold=0.6
        )
        
        message = f"Faces {'match' if is_match else 'dont match'} with {similarity:.3f} similarity"
        
        return jsonify({
            'success': True,
            'is_match': bool(is_match),
            'similarity': float(similarity),
            'threshold': 0.6,
            'message': message
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    if face_system is None:
        print("❌ Cannot start web interface - Face Recognition System not loaded")
    else:
        print("🌐 Starting web interface...")
        print("📱 Open your browser and go to: http://localhost:5001")
        print("🔄 Press Ctrl+C to stop the server")
        app.run(host='0.0.0.0', port=5001, debug=False)
