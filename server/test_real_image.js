const ocrService = require('./services/ocrService');
const fs = require('fs');
const path = require('path');

/**
 * Test OCR with real image from temp_uploads folder
 */
async function testRealImage() {
  console.log('🧪 Testing OCR with Real Image');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Test 1: Load real image from temp_uploads
    console.log('\n📋 Test 1: Loading Real Image');
    const imagePath = path.join(__dirname, 'temp_uploads', 'Pan_Front.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found:', imagePath);
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('✅ Image loaded:', imageBuffer.length, 'bytes');
    console.log('📁 Image path:', imagePath);
    
    // Test 2: OCR Processing
    console.log('\n📋 Test 2: OCR Processing');
    console.log('🖼️  Processing real document image...');
    
    const extractionResult = await ocrService.extractTextFromImage(imageBuffer);
    
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
    
    // Test 3: Document Processing with Field Parsing
    console.log('\n📋 Test 3: Document Processing with Field Parsing');
    const processingResult = await ocrService.processDocument(imageBuffer);
    
    console.log('\n🏷️  Parsed Document Data:');
    console.log('Name:', processingResult.name || 'Not extracted');
    console.log('Date of Birth:', processingResult.dateOfBirth || 'Not extracted');
    console.log('ID Number:', processingResult.idNumber || 'Not extracted');
    console.log('Document Type:', processingResult.documentType || 'Not extracted');
    console.log('Address:', processingResult.address || 'Not extracted');
    console.log('Overall Confidence:', processingResult.confidence.toFixed(1) + '%');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Real Image OCR Test Completed Successfully');
    
  } catch (error) {
    console.error('\n❌ Real Image OCR Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testRealImage();
}

module.exports = { testRealImage };
