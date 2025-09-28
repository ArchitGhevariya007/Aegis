const express = require('express');
const ocrService = require('../services/ocrService');
const router = express.Router();

/**
 * POST /api/ocr/extract-text
 * Extract text from uploaded document image
 * Used by registration module Step 3
 */
router.post('/extract-text', async (req, res) => {
  try {
    console.log('[OCR API] 📄 OCR text extraction request received');
    
    const { image, documentType = 'id_card' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    console.log('[OCR API] 📄 Processing document type:', documentType);
    const startTime = Date.now();
    
    // Convert base64 data URL to buffer
    let imageBuffer;
    if (typeof image === 'string' && image.startsWith('data:')) {
      // Extract base64 data from data URL
      const base64Data = image.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
      console.log('[OCR API] 📸 Converted data URL to buffer:', imageBuffer.length, 'bytes');
    } else if (Buffer.isBuffer(image)) {
      imageBuffer = image;
      console.log('[OCR API] 📸 Using provided buffer:', imageBuffer.length, 'bytes');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected base64 data URL or buffer.'
      });
    }
    
    // Process the document using fresh OCR service
    const result = await ocrService.processDocument(imageBuffer, documentType);
    
    const processingTime = Date.now() - startTime;
    console.log(`[OCR API] ⏱️  OCR processing completed in ${processingTime}ms`);

    if (result.success) {
      console.log('[OCR API] ✅ OCR extraction successful');
      console.log(`[OCR API] 🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`[OCR API] 📝 Extracted text: "${result.extractedText}"`);
      
      // Log extracted fields
      const docData = result.documentData;
      const extractedFields = [];
      if (docData.name) extractedFields.push(`Name: ${docData.name}`);
      if (docData.dob) extractedFields.push(`DOB: ${docData.dob}`);
      if (docData.address) extractedFields.push(`Address: ${docData.address}`);
      
      if (extractedFields.length > 0) {
        console.log('[OCR API] 📋 Extracted fields:', extractedFields.join(', '));
      } else {
        console.log('[OCR API] 📋 No specific fields extracted from text');
      }
    } else {
      console.log('[OCR API] ❌ OCR extraction failed');
    }

    // Format response for registration module compatibility
    res.json({
      success: result.success,
      data: {
        documentData: result.documentData,
        extractedText: result.extractedText,
        confidence: result.confidence,
        ocrDetails: {
          textsFound: result.extractedText ? result.extractedText.split(/\s+/).filter(w => w.length > 0).length : 0,
          method: 'PPOCRv5'
        }
      },
      processingTime,
      message: result.success ? 'Text extracted successfully' : 'OCR processing failed'
    });

  } catch (error) {
    console.error('[OCR API] ❌ OCR extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during OCR processing',
      error: error.message
    });
  }
});

/**
 * POST /api/ocr/process-document
 * Process document with field parsing
 */
router.post('/process-document', async (req, res) => {
  try {
    console.log('[OCR API] 📋 OCR document processing request received');
    
    const { image, documentType = 'id_card' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    console.log(`[OCR API] 🔍 Processing ${documentType} document...`);
    const startTime = Date.now();
    
    const result = await ocrService.processDocument(image, documentType);
    
    const processingTime = Date.now() - startTime;
    console.log(`[OCR API] ⏱️  Document processing completed in ${processingTime}ms`);

    if (result.success) {
      console.log('[OCR API] ✅ Document processing successful');
      
      const docData = result.documentData;
      console.log('[OCR API] 📊 Parsed document data:');
      console.log(`[OCR API]   - Name: ${docData.name || 'Not detected'}`);
      console.log(`[OCR API]   - DOB: ${docData.dob || 'Not detected'}`);
      console.log(`[OCR API]   - Address: ${docData.address || 'Not detected'}`);
      console.log(`[OCR API]   - Confidence: ${(docData.confidence * 100).toFixed(1)}%`);
    } else {
      console.log('[OCR API] ❌ Document processing failed');
    }

    res.json({
      success: result.success,
      data: {
        documentData: result.documentData,
        extractedText: result.extractedText,
        confidence: result.confidence
      },
      processingTime,
      message: result.success ? 'Document processed successfully' : 'Document processing failed'
    });

  } catch (error) {
    console.error('[OCR API] ❌ Document processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during document processing',
      error: error.message
    });
  }
});

/**
 * GET /api/ocr/status
 * Check OCR service status
 */
router.get('/status', async (req, res) => {
  try {
    console.log('[OCR API] 🔍 OCR status check requested');
    
    const status = {
      initialized: !!ocrService.textSystem?.initialized,
      modelsAvailable: !!(ocrService.textSystem?.detector?.session && ocrService.textSystem?.recognizer?.session),
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      documentTypes: ['id_card', 'passport', 'driver_license'],
      version: 'PPOCRv5',
      characterSupport: 'Chinese + English'
    };
    
    console.log('[OCR API] 📊 OCR Service Status:');
    console.log(`[OCR API]   - Initialized: ${status.initialized ? '✅' : '❌'}`);
    console.log(`[OCR API]   - Models Available: ${status.modelsAvailable ? '✅' : '❌'}`);
    console.log(`[OCR API]   - Version: ${status.version}`);

    res.json({
      success: true,
      status: status,
      message: 'OCR service status retrieved successfully'
    });

  } catch (error) {
    console.error('[OCR API] ❌ OCR status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OCR service status',
      error: error.message
    });
  }
});

/**
 * POST /api/ocr/test
 * Test OCR functionality
 */
router.post('/test', async (req, res) => {
  try {
    console.log('[OCR API] 🧪 OCR test request received');
    
    // Create a simple test base64 image (1x1 white pixel)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    console.log('[OCR API] 🔍 Running OCR test with sample image...');
    const startTime = Date.now();
    
    const extractionResult = await ocrService.extractTextFromImage(testImage);
    const processingResult = await ocrService.processDocument(testImage, 'id_card');
    
    const processingTime = Date.now() - startTime;
    console.log(`[OCR API] ⏱️  OCR test completed in ${processingTime}ms`);

    console.log('[OCR API] ✅ OCR test results:');
    console.log(`[OCR API]   - Text extraction: ${extractionResult.success ? '✅' : '❌'}`);
    console.log(`[OCR API]   - Document processing: ${processingResult.success ? '✅' : '❌'}`);

    res.json({
      success: true,
      data: {
        textExtraction: extractionResult,
        documentProcessing: processingResult,
        processingTime
      },
      message: 'OCR test completed successfully'
    });

  } catch (error) {
    console.error('[OCR API] ❌ OCR test error:', error);
    res.status(500).json({
      success: false,
      message: 'OCR test failed',
      error: error.message
    });
  }
});

module.exports = router;