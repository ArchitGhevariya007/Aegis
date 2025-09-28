# OCR System Setup Guide

## Overview

This OCR (Optical Character Recognition) system is integrated into the Aegis registration flow to automatically extract information from user-uploaded documents. The system is built using ONNX runtime for lightweight, high-performance text extraction.

## Features

- **Lightweight ONNX-based OCR**: Uses ONNX runtime for efficient text extraction
- **Document parsing**: Extracts structured data (name, DOB, ID number, address) from documents
- **Fallback mode**: Works without ONNX models using pattern-based extraction
- **Multiple document types**: Supports ID cards, passports, and driver's licenses
- **Real-time integration**: Processes documents during user registration

## Current Implementation

### Fallback Mode (Currently Active)
The system currently operates in fallback mode, which:
- Uses pattern-based text extraction
- Provides demo data for testing purposes
- Ensures the registration flow works without requiring ONNX models
- Returns structured document data with confidence scores

### API Endpoints

#### 1. Extract Text from Document
```
POST /api/ocr/extract-text
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "documentType": "id_card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedText": "John Doe 1990-01-01 ID123456789 Driver License 123 Main Street, City, State",
    "documentData": {
      "name": "John Doe",
      "dob": "1990-01-01T00:00:00.000Z",
      "idNumber": "ID123456789",
      "documentType": "id_card",
      "address": "123 Main Street, City, State",
      "confidence": 0.74
    },
    "confidence": 0.74,
    "ocrDetails": {
      "textsFound": 5,
      "method": "fallback"
    }
  }
}
```

#### 2. Process Document
```
POST /api/ocr/process-document
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "documentType": "id_card",
  "parseFields": true
}
```

#### 3. Check OCR Status
```
GET /api/ocr/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "initialized": true,
    "modelsAvailable": false,
    "supportedFormats": ["image/jpeg", "image/png", "image/webp"],
    "documentTypes": ["id_card", "passport", "drivers_license"]
  }
}
```

## Integration with Registration Flow

### Frontend Integration
The OCR system is integrated into the registration flow at Step 3 (Document Upload & OCR):

```javascript
// In RegistrationFlow.js
const handleDocChange = async (file) => {
  // Process document with OCR
  const ocrResponse = await fetch('http://localhost:5000/api/ocr/extract-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      image: base64, 
      documentType: 'id_card' 
    })
  });
  
  const ocrResult = await ocrResponse.json();
  // Auto-fill form fields with extracted data
  setOcrEditable(extractedData);
};
```

### Backend Integration
The registration API automatically stores OCR data in the user's document record:

```javascript
// In auth.js registration endpoint
const user = new User({
  // ... other fields
  documents: [
    {
      type: 'id_card',
      fileName: documentData.fileName,
      verified: true,
      ocrData: {
        name: ocrData.name,
        dob: ocrData.dob ? new Date(ocrData.dob) : null,
        idNumber: ocrData.idNumber,
        documentType: ocrData.documentType,
        address: ocrData.address
      }
    }
  ]
});
```

## Adding Real ONNX Models (Optional Enhancement)

To upgrade from fallback mode to real OCR capabilities:

### 1. Quick Setup Script
```bash
cd server
node scripts/download_ocr_models.js
```

### 2. Manual Download from PaddleOCR
**Best Source**: https://github.com/PaddlePaddle/PaddleOCR/blob/release/2.7/doc/doc_en/models_list_en.md

**Direct Links** (English models):
- **Text Detection**: https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_det_infer.tar
- **Text Recognition**: https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_rec_infer.tar

**Setup Instructions**:
```bash
# Create models directory
mkdir -p ai_models/onnx_model

# Download and extract models
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_det_infer.tar
wget https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_rec_infer.tar

tar -xf en_PP-OCRv3_det_infer.tar
tar -xf en_PP-OCRv3_rec_infer.tar

# Convert to ONNX (requires paddle2onnx)
pip install paddle2onnx
python scripts/convert_to_onnx.py
```

### 3. Alternative Sources

**Hugging Face Models**:
- Search: https://huggingface.co/models?library=onnx&pipeline_tag=image-to-text
- Popular: `microsoft/trocr-base-printed` (ONNX format)

**ONNX Model Hub**:
- Repository: https://github.com/onnx/models
- OCR Models: Look for text detection/recognition models

**EasyOCR ONNX**:
- GitHub: https://github.com/JaidedAI/EasyOCR
- Models: Pre-trained ONNX models available

### 2. Model Configuration
The OCR service automatically detects and loads ONNX models:
- Detection model: `ai_models/onnx_model/paddle_ocr_det.onnx`
- Recognition model: `ai_models/onnx_model/paddle_ocr_rec.onnx`

### 3. Model Requirements
- **Detection Model**: Input size 960x960, outputs text bounding boxes
- **Recognition Model**: Input size 320x48, outputs recognized text
- **Format**: ONNX format, compatible with onnxruntime-node

## Testing

### Run OCR Tests
```bash
cd server
node test_ocr.js
```

### Expected Output
```
Testing OCR Service...
[OCR] Initializing OCR service...
[OCR] ONNX models not found, using fallback text extraction
✓ OCR Service initialized

Testing text extraction...
[OCR] Using fallback text extraction method
Extraction result: {
  success: true,
  textsFound: 5,
  fullText: 'John Doe 1990-01-01 ID123456789 Driver License 123 Main Street, City, State'
}

✓ OCR Service test completed successfully
```

### Test with Real Documents
1. Start the server: `npm run dev`
2. Navigate to registration flow in the frontend
3. Upload a document image at Step 3
4. Verify that extracted information appears in the form fields

## Document Processing Flow

1. **Document Upload**: User uploads document image in registration flow
2. **Preprocessing**: Image is converted to base64 and sent to OCR service
3. **Text Extraction**: OCR service processes the image
4. **Data Parsing**: Extracted text is parsed into structured fields
5. **Validation**: Extracted data is validated and confidence scores calculated
6. **Auto-fill**: Form fields are automatically populated with extracted data
7. **Storage**: OCR data is stored with user registration in MongoDB

## Supported Document Types

- **ID Card**: Government-issued identification cards
- **Passport**: International passports
- **Driver's License**: State-issued driver's licenses

## Error Handling

The OCR system includes comprehensive error handling:
- Graceful fallback to demo data if OCR fails
- Network error handling for API requests
- Image format validation
- Model loading error recovery

## Performance Considerations

- **Lightweight**: Uses ONNX runtime for optimal performance
- **Async Processing**: Non-blocking OCR processing
- **Memory Efficient**: Models loaded once and reused
- **Fallback Mode**: Ensures system works without heavy dependencies

## Security Features

- **Input Validation**: Validates image format and size
- **Data Sanitization**: Cleans extracted text data
- **Secure Storage**: OCR data encrypted in database
- **Rate Limiting**: API endpoints protected against abuse

## Future Enhancements

1. **Model Optimization**: Fine-tune models for specific document types
2. **Multi-language Support**: Add support for multiple languages
3. **Document Classification**: Automatic document type detection
4. **Advanced Validation**: Cross-reference extracted data with external sources
5. **Batch Processing**: Support for multiple document uploads
6. **Analytics Dashboard**: OCR accuracy monitoring and reporting

## Troubleshooting

### Common Issues

1. **OCR Service Not Initializing**
   - Check ONNX model file paths
   - Verify onnxruntime-node installation
   - Review server logs for error details

2. **Poor Extraction Accuracy**
   - Ensure high-quality document images
   - Check image resolution and lighting
   - Verify document is clearly visible and not skewed

3. **API Timeout Errors**
   - Increase request timeout settings
   - Optimize image size before processing
   - Check server resource usage

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export OCR_DEBUG=true
```

## Dependencies

- `onnxruntime-node`: ONNX runtime for JavaScript
- `sharp`: Image processing library
- `express`: Web framework for API endpoints

## Contributing

To contribute to the OCR system:
1. Add new document type parsers in `parseDocumentData()`
2. Improve text extraction accuracy
3. Add support for new image formats
4. Enhance error handling and validation
5. Add comprehensive test cases

---

For questions or issues, please refer to the main project README or create an issue in the repository.
