# AI Models Directory

This directory contains the ONNX models for face detection and recognition.

## Required Models

1. **SCRFD Model** (`scrfd.onnx`)
   - Used for face detection
   - Input: 640x640 RGB image
   - Output: Face bounding boxes

2. **ArcFace Model** (`arcface.onnx`)
   - Used for face recognition
   - Input: 112x112 RGB face image
   - Output: 512-dimension face embedding

## Setup Instructions

1. Download the models from the links below
2. Place them in this directory
3. Ensure the server has the required dependencies:
   ```bash
   npm install onnxruntime-node sharp
   ```

## Model Download Links

- **SCRFD**: [Download from official repository](https://github.com/deepinsight/insightface/tree/master/python-package/insightface/model_zoo)
- **ArcFace**: [Download from official repository](https://github.com/deepinsight/insightface/tree/master/python-package/insightface/model_zoo)

## Alternative: Use Pre-trained Models

You can also use smaller, pre-trained models or download them programmatically:

```javascript
// Example: Download models on first run
const downloadModel = async (url, path) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(path, Buffer.from(buffer));
};
```

## Environment Variables

Set these environment variables to configure the models:

```bash
SCRFD_MODEL_PATH=./server/ai_models/onnx_model/scrfd.onnx
ARCFACE_MODEL_PATH=./server/ai_models/onnx_model/arcface.onnx
FACE_MATCH_THRESHOLD=0.6
FACE_INPUT_LAYOUT=NHWC
FACE_COLOR_ORDER=RGB
```
