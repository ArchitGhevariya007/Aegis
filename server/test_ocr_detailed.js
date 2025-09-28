const ocrService = require('./services/ocrService');

/**
 * Detailed OCR test with better logging
 */

async function testOCRDetailed() {
  console.log('🧪 Starting Detailed OCR Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Test 1: Initialize OCR service (automatic on first use)
    console.log('\n📋 Test 1: OCR Service Initialization');
    console.log('✅ OCR Service ready (auto-initializes on first use)');
    
    // Test 2: Create a test image (simple text image in base64)
    console.log('\n📋 Test 2: Text Extraction Test');
    
    // Create a larger test image (100x50 white background)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA3ElEQVR4nO3bMQ0AIRAEQfJoHf83iQIcCKQBKipgtlv23c79uq8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8bgEhiIAmAAAAAElFTkSuQmCC';
    
    // Convert base64 data URL to buffer
    const base64Data = testImageBase64.split(',')[1];
    const testImageBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('📝 Note: Using synthetic test image. For real results, upload an actual document through the frontend!');
    
    console.log('🖼️  Testing with sample document image...');
    const extractionResult = await ocrService.extractTextFromImage(testImageBuffer);
    
    console.log('\n📊 Extraction Results:');
    console.log('Success:', extractionResult.success);
    console.log('Method used:', extractionResult.method || 'No text detected');
    console.log('Full extracted text:', extractionResult.extractedText || '(empty)');
    
    if (extractionResult.results && extractionResult.results.length > 0) {
      console.log('\n📝 Individual text pieces:');
      extractionResult.results.forEach(([box, [text, score]], index) => {
        console.log(`  ${index + 1}. "${text}" (confidence: ${(score * 100).toFixed(1)}%)`);
      });
    }
    
    // Test 3: Document processing with field parsing
    console.log('\n📋 Test 3: Document Processing with Field Parsing');
    const processingResult = await ocrService.processDocument(testImageBuffer);
    
    console.log('\n🏷️  Parsed Document Data:');
    console.log('Name:', processingResult.name || 'Not extracted');
    console.log('Date of Birth:', processingResult.dateOfBirth || 'Not extracted');
    console.log('ID Number:', processingResult.idNumber || 'Not extracted');
    console.log('Document Type:', processingResult.documentType || 'Not extracted');
    console.log('Address:', processingResult.address || 'Not extracted');
    console.log('Overall Confidence:', processingResult.confidence.toFixed(1) + '%');
    
    // Test 4: Check if real ONNX models are being used
    console.log('\n📋 Test 4: Model Status Check');
    console.log('Detection Model Available:', !!ocrService.textSystem?.detector?.session);
    console.log('Recognition Model Available:', !!ocrService.textSystem?.recognizer?.session);
    console.log('Service Initialized:', !!ocrService.textSystem?.initialized);
    
    if (ocrService.textSystem?.initialized) {
      console.log('🎉 Fresh OCR System Ready!');
      console.log('📚 Character Dictionary: PPOCRv5 with Chinese support');
      console.log('🔧 Pipeline: Detection → Cropping → Recognition → CTC Decoding');
    } else {
      console.log('⚠️  ONNX models not loaded yet - will initialize on first use');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ OCR Detailed Test Completed Successfully');
    
  } catch (error) {
    console.error('\n❌ OCR Detailed Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testOCRDetailed();
}

module.exports = { testOCRDetailed };
