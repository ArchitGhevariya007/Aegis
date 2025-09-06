# Face Recognition System Setup

## Fixed Issues

The face detection and recognition system has been completely overhauled to fix the random output issue. Here are the key changes:

### 1. SCRFD Face Detection (Step 1)
- ✅ **Fixed**: Removed mock data, now uses actual SCRFD model output
- ✅ **Fixed**: Implemented proper SCRFD output parsing for bounding boxes
- ✅ **Fixed**: Added Non-Maximum Suppression (NMS) for duplicate detection removal
- ✅ **Fixed**: Proper confidence thresholding

### 2. ArcFace Recognition (Step 2)
- ✅ **Fixed**: Standardized preprocessing to match ArcFace specifications exactly
- ✅ **Fixed**: Input format: (1, 112, 112, 3) as per specification
- ✅ **Fixed**: Normalization: (img - 127.5) / 128.0 as per specification
- ✅ **Fixed**: Proper L2 normalization of embeddings
- ✅ **Fixed**: 512-dimensional embedding validation

### 3. Pipeline Integration
- ✅ **Fixed**: Proper face cropping with 20% expansion for context
- ✅ **Fixed**: Square crop alignment for ArcFace input
- ✅ **Fixed**: Consistent data flow from detection to recognition
- ✅ **Fixed**: Better error handling and debugging

## Environment Configuration

Add these to your `.env` file:

```bash
# Enable debug output for face processing
FACE_MATCH_DEBUG=true

# Face match similarity threshold (0.0 to 1.0)
# For user registration: 0.75 (75% minimum required)
FACE_MATCH_THRESHOLD=0.75
```

## Testing Your Setup

Use the test script to verify everything works:

```bash
# Test single image
node test_face_pipeline.js path/to/face_image.jpg

# Compare two faces
node test_face_pipeline.js path/to/id_photo.jpg path/to/live_photo.jpg
```

## Expected Output

With debug enabled, you should see:

```
[SCRFD] Input shape: [1,3,640,640]
[SCRFD] Found bbox keys: ['bbox_8', 'bbox_16', 'bbox_32']
[Crop] Original: 1920x1080, Face: 245,156,180x220, Square: 200,100,280x280
[ArcFace] Input shape: [1,112,112,3]
[ArcFace] Output shape: [1,512]
[ArcFace] Embedding dimension: 512, norm: 1.000000
[ArcFace] Similarity: 0.847291, Threshold: 0.6, Match: true
```

## Threshold Guidelines

- **0.75**: **Required for Registration** - Ensures high confidence face matching
- **0.8+**: Very strict - only very similar faces
- **0.6-0.75**: Normal verification - good for authentication
- **0.4-0.6**: Lenient - allows more variation
- **<0.4**: Too loose - may allow false positives

**Registration Requirement**: Users must achieve **75% or higher** similarity between their ID photo and live photo to complete registration.

## Architecture Verification

The system now follows your exact specifications:

1. **SCRFD (640x640 input)** → Face bounding boxes
2. **Crop & Align** → 112x112 square faces with context
3. **ArcFace (112x112 input)** → 512-dimensional embeddings
4. **Cosine Similarity** → Match score with threshold

## Common Issues Resolved

- ❌ **Random outputs**: Fixed by removing mock data and implementing real SCRFD parsing
- ❌ **Same face negative results**: Fixed by proper preprocessing and normalization
- ❌ **Inconsistent embeddings**: Fixed by standardizing ArcFace input format
- ❌ **Poor face crops**: Fixed by adding context and ensuring square alignment

## Model Requirements

Ensure you have these models in `ai_models/onnx_model/`:
- `scrfd.onnx` - Face detection model
- `arcface.onnx` - Face recognition model

Both models should be ONNX format and compatible with onnxruntime-node.
