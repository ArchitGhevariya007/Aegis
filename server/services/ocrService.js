const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * OCR Service using standalone Python implementation
 * This uses a permanent Python OCR service, not dependent on temp folder
 */
class OCRService {
  constructor() {
    this.pythonPath = path.join(__dirname, '..', 'python_ocr');
    this.serviceScript = path.join(this.pythonPath, 'ocr_service.py');
    console.log('[OCR] Initialized with standalone Python service:', this.serviceScript);
  }
  
  async ocr(imageBuffer) {
    try {
      console.log('[OCR] ═══════════════════════════════════════════════════════');
      console.log('[OCR] Starting OCR processing with standalone Python service...');
      
      // Write image to temporary file to avoid command line length limits
      const tempImagePath = path.join(this.pythonPath, 'temp_input.jpg');
      fs.writeFileSync(tempImagePath, imageBuffer);
      
      console.log('[OCR] Image size: %d bytes', imageBuffer.length);
      
      // Call Python service
      const result = await this.callPythonService(tempImagePath);
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      console.log('[OCR] OCR processing completed');
      console.log('[OCR] ═══════════════════════════════════════════════════════');
      
      return result;
    } catch (error) {
      console.error('[OCR] OCR failed:', error);
      throw error;
    }
  }
  
  async callPythonService(imagePath) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.serviceScript, imagePath], {
        cwd: this.pythonPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[OCR] Python process error:', stderr);
          reject(new Error(`Python process failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          // Extract JSON from stdout (may contain other print statements)
          const lines = stdout.trim().split('\n');
          let jsonLine = '';
          
          // Find the line that contains valid JSON
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              jsonLine = line.trim();
              break;
            }
          }
          
          if (!jsonLine) {
            throw new Error('No JSON response found in Python output');
          }
          
          const result = JSON.parse(jsonLine);
          if (result.error) {
            reject(new Error(`Python OCR error: ${result.error}`));
          } else {
            console.log('[OCR] Python OCR successful: %d texts found', result.total_texts);
            if (result.results && result.results.length > 0) {
              result.results.forEach((item, idx) => {
                console.log('[OCR] %d. "%s" (%.1f%%)', idx + 1, item.text, item.confidence * 100);
              });
            }
            resolve(result);
          }
        } catch (parseError) {
          console.error('[OCR] Failed to parse Python response:', stdout);
          reject(new Error(`Failed to parse Python response: ${parseError.message}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
  
  async extractTextFromImage(imageBuffer) {
    try {
      const results = await this.ocr(imageBuffer);
      
      if (!results.success || results.total_texts === 0) {
        return {
          success: false,
          extractedText: '',
          method: 'No text detected',
          results: []
        };
      }
      
      return {
        success: true,
        extractedText: results.extracted_text,
        method: 'PPOCRv5 Standalone Python Service',
        results: results.results.map(item => [
          item.box,
          [item.text, item.confidence]
        ])
      };
    } catch (error) {
      console.error('[OCR] Text extraction failed:', error);
      return {
        success: false,
        extractedText: '',
        method: 'Error: ' + error.message,
        results: []
      };
    }
  }
  
  async processDocument(imageBuffer, documentType = 'unknown') {
    try {
      console.log('[OCR] Processing document...');
      const ocr = await this.extractTextFromImage(imageBuffer);

      if (!ocr.success) {
        return {
          success: false,
          documentData: {
            name: null,
            dob: null,
            idNumber: null,
            documentType,
            address: null,
            confidence: 0
          },
          extractedText: '',
          confidence: 0
        };
      }

      // Simple field extraction from raw text
      const text = ocr.extractedText || '';
      const lines = text.split(/\s+/).filter(line => line.length > 0);

      let name = null;
      let dob = null;
      let idNumber = null;
      let address = null;

      // Try to find name (usually first meaningful text)
      if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.length > 2 && /^[A-Za-z\s]+$/.test(firstLine)) {
          name = firstLine;
        }
      }

      // Try to find date patterns
      const datePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
      const dates = text.match(datePattern);
      if (dates && dates.length > 0) {
        dob = dates[0];
      }

      // Try to find ID patterns
      const idPattern = /\b[A-Z0-9]{8,}\b/g;
      const ids = text.match(idPattern);
      if (ids && ids.length > 0) {
        idNumber = ids[0];
      }

      // Calculate average confidence
      const avgConfidence = ocr.results && ocr.results.length
        ? ocr.results.reduce((sum, [_, [__, score]]) => sum + score, 0) / ocr.results.length
        : 0;

      return {
        success: true,
        documentData: {
          name,
          dob,
          idNumber,
          documentType,
          address,
          confidence: avgConfidence
        },
        extractedText: text,
        confidence: avgConfidence
      };
    } catch (error) {
      console.error('[OCR] Document processing failed:', error);
      return {
        success: false,
        documentData: {
          name: null,
          dob: null,
          idNumber: null,
          documentType,
          address: null,
          confidence: 0
        },
        extractedText: '',
        confidence: 0
      };
    }
  }
}

module.exports = new OCRService();