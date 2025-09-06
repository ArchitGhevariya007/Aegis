const fs = require('fs');
const path = require('path');
const facePipeline = require('./services/facePipeline');

// Enable debug output
process.env.FACE_MATCH_DEBUG = 'true';

/**
 * Test script for face detection and recognition pipeline
 * Usage: node test_face_pipeline.js <image1_path> <image2_path>
 */

function imageToBase64(imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
  
  return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
}

async function testSingleImage(imagePath) {
  console.log(`\n=== Testing single image: ${imagePath} ===`);
  
  try {
    const base64 = imageToBase64(imagePath);
    const result = await facePipeline.detectAndCropFaces(base64);
    
    if (result.success) {
      console.log('✅ Face detection successful');
      console.log(`   Faces detected: ${result.faces?.length || 0}`);
      console.log(`   Embedding length: ${result.embeddingLength}`);
      console.log(`   First face confidence: ${result.faces?.[0]?.confidence?.toFixed(4) || 'N/A'}`);
      
      if (result.embedding) {
        console.log(`   Embedding sample: [${result.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      }
    } else {
      console.log('❌ Face detection failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function testComparison(image1Path, image2Path) {
  console.log(`\n=== Comparing ${path.basename(image1Path)} vs ${path.basename(image2Path)} ===`);
  
  try {
    const base64_1 = imageToBase64(image1Path);
    const base64_2 = imageToBase64(image2Path);
    
    const result = await facePipeline.compareFaceImages(base64_1, base64_2);
    
    if (result.success) {
      console.log('✅ Face comparison successful');
      console.log(`   Similarity: ${result.similarity.toFixed(6)}`);
      console.log(`   Threshold: ${result.threshold}`);
      console.log(`   Match: ${result.is_match ? '✅ YES' : '❌ NO'}`);
      console.log(`   ID faces: ${result.idFaces}, Live faces: ${result.liveFaces}`);
    } else {
      console.log('❌ Face comparison failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node test_face_pipeline.js <image1_path>                    # Test single image');
    console.log('  node test_face_pipeline.js <image1_path> <image2_path>      # Compare two images');
    console.log('');
    console.log('Environment variables:');
    console.log('  FACE_MATCH_THRESHOLD=0.6    # Similarity threshold (default: 0.6)');
    console.log('  FACE_MATCH_DEBUG=true       # Enable debug output (default: false)');
    return;
  }
  
  console.log('🚀 Starting Face Pipeline Test');
  console.log(`Debug mode: ${process.env.FACE_MATCH_DEBUG === 'true' ? 'ON' : 'OFF'}`);
  console.log(`Threshold: ${process.env.FACE_MATCH_THRESHOLD || '0.6'}`);
  
  if (args.length === 1) {
    // Test single image
    await testSingleImage(args[0]);
  } else if (args.length === 2) {
    // Test both images individually first
    const result1 = await testSingleImage(args[0]);
    const result2 = await testSingleImage(args[1]);
    
    // Then compare them
    if (result1?.success && result2?.success) {
      await testComparison(args[0], args[1]);
    } else {
      console.log('\n❌ Skipping comparison due to individual processing failures');
    }
  } else {
    console.log('❌ Too many arguments. Provide 1 or 2 image paths.');
  }
  
  console.log('\n🏁 Test completed');
}

main().catch(console.error);
