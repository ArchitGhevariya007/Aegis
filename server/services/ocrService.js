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

      // Advanced field extraction from raw text
      const text = ocr.extractedText || '';
      console.log('[OCR] Full extracted text for parsing:', text);

      let name = '';
      let dob = '';
      let idNumber = '';
      let address = '';

      // Extract name with improved logic
      name = this.extractName(text);
      
      // Extract date and convert format
      dob = this.extractAndFormatDate(text);
      
      // Extract ID number
      idNumber = this.extractIdNumber(text);
      
      // Extract address
      address = this.extractAddress(text);

      console.log('[OCR] Extracted fields:', { name, dob, idNumber, address });

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
          documentType: '', // Always empty for user input
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
          name: '',
          dob: '',
          idNumber: '',
          documentType: '', // Always empty for user input
          address: '',
          confidence: 0
        },
        extractedText: '',
        confidence: 0
      };
    }
  }

  // Extract name from text with dynamic logic
  extractName(text) {
    try {
      console.log('[OCR] Extracting name from text...');
      
      // Dynamic patterns for name extraction (no hardcoded document types)
      const namePatterns = [
        // Pattern 1: After any "Name" keyword variations
        /(?:Name[:\s]*|T\/Name[:\s]*|Full Name[:\s]*|नाम[:\s]*)([A-Z][A-Za-z\s]+?)(?:\s+(?:DOB|Date|Mobile|VID|\d|Father|Address|जन्म|पिता))/i,
        
        // Pattern 2: Between common document elements (dynamic)
        /(?:Card|Department|Authority|Ministry)[\s\S]*?([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+)[\s\S]*?(?:DOB|Date|Mobile|Father)/i,
        
        // Pattern 3: Look for 2-3 consecutive capitalized words that aren't common document words
        /\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g
      ];

      // Common non-name words to filter out
      const nonNameWords = [
        'GOVERNMENT', 'INDIA', 'DEPARTMENT', 'INCOME', 'TAX', 'PERMANENT', 'ACCOUNT', 
        'NUMBER', 'CARD', 'REPUBLIC', 'MINISTRY', 'AUTHORITY', 'OFFICE', 'BUREAU',
        'COMMISSION', 'BOARD', 'CORPORATION', 'LIMITED', 'COMPANY', 'ORGANIZATION',
        'INSTITUTION', 'UNIVERSITY', 'COLLEGE', 'SCHOOL', 'HOSPITAL', 'BANK',
        'DATE', 'BIRTH', 'MALE', 'FEMALE', 'ADDRESS', 'MOBILE', 'PHONE', 'EMAIL'
      ];

      // Try specific patterns first
      for (let i = 0; i < namePatterns.length - 1; i++) {
        const pattern = namePatterns[i];
        const match = text.match(pattern);
        if (match && match[1]) {
          let name = match[1].trim();
          name = name.replace(/[^A-Za-z\s]/g, '').trim();
          
          // Check if it's not a common document word
          const nameWords = name.split(/\s+/);
          const isValidName = nameWords.length >= 2 && 
                             nameWords.length <= 5 && 
                             !nameWords.some(word => nonNameWords.includes(word.toUpperCase()));
          
          if (isValidName && name.length > 5) {
            console.log('[OCR] Name extracted using pattern', i + 1, ':', name);
            return name;
          }
        }
      }

      // Fallback: Find all sequences of capitalized words and score them
      const allMatches = [];
      const pattern = namePatterns[namePatterns.length - 1]; // The general pattern
      let match;
      
      while ((match = pattern.exec(text)) !== null) {
        const candidate = match[1].trim();
        const words = candidate.split(/\s+/);
        
        // Score the candidate based on various factors
        let score = 0;
        
        // Length score (2-4 words is ideal for names)
        if (words.length >= 2 && words.length <= 4) score += 10;
        
        // Avoid document words
        const hasDocumentWords = words.some(word => nonNameWords.includes(word.toUpperCase()));
        if (!hasDocumentWords) score += 15;
        
        // Prefer words that are reasonable name length
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        if (avgWordLength >= 3 && avgWordLength <= 12) score += 5;
        
        // Avoid words with numbers or special characters
        if (!/[\d\/\-\(\):]/.test(candidate)) score += 5;
        
        // Prefer candidates that appear after certain contexts
        const beforeText = text.substring(0, match.index).toLowerCase();
        if (beforeText.includes('name') || beforeText.includes('नाम')) score += 10;
        
        allMatches.push({ name: candidate, score, words: words.length });
      }

      // Sort by score and return the best match
      allMatches.sort((a, b) => b.score - a.score);
      
      if (allMatches.length > 0 && allMatches[0].score > 10) {
        const bestName = allMatches[0].name;
        console.log('[OCR] Name extracted using scoring (score:', allMatches[0].score, '):', bestName);
        return bestName;
      }

      console.log('[OCR] No suitable name found in text');
      return '';
    } catch (error) {
      console.error('[OCR] Name extraction error:', error);
      return '';
    }
  }

  // Extract and format date
  extractAndFormatDate(text) {
    try {
      // Look for date patterns
      const datePatterns = [
        /DOB[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /Date of Birth[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g
      ];

      for (const pattern of datePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          let dateStr = matches[1] || matches[0];
          
          // Convert dd/mm/yyyy to dd-mm-yyyy format
          if (dateStr.includes('/')) {
            dateStr = dateStr.replace(/\//g, '-');
          }
          
          // Validate date format (dd-mm-yyyy)
          const dateParts = dateStr.split('-');
          if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0');
            const month = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            
            if (year.length === 4) {
              const formattedDate = `${day}-${month}-${year}`;
              console.log('[OCR] Date extracted and formatted:', formattedDate);
              return formattedDate;
            }
          }
        }
      }

      console.log('[OCR] No date found in text');
      return '';
    } catch (error) {
      console.error('[OCR] Date extraction error:', error);
      return '';
    }
  }

  // Extract ID number (PAN, Aadhaar, etc.)
  extractIdNumber(text) {
    try {
      // PAN pattern: 5 letters + 4 digits + 1 letter
      const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
      const panMatch = text.match(panPattern);
      if (panMatch) {
        console.log('[OCR] PAN number extracted:', panMatch[0]);
        return panMatch[0];
      }

      // Aadhaar pattern: 12 digits (may be spaced)
      const aadhaarPattern = /\b\d{4}\s*\d{4}\s*\d{4}\b/g;
      const aadhaarMatch = text.match(aadhaarPattern);
      if (aadhaarMatch) {
        const aadhaar = aadhaarMatch[0].replace(/\s/g, '');
        console.log('[OCR] Aadhaar number extracted:', aadhaar);
        return aadhaar;
      }

      // VID pattern: 16 digits
      const vidPattern = /VID[:\s]*(\d{4}\s*\d{4}\s*\d{4}\s*\d{4})/i;
      const vidMatch = text.match(vidPattern);
      if (vidMatch) {
        const vid = vidMatch[1].replace(/\s/g, '');
        console.log('[OCR] VID extracted:', vid);
        return vid;
      }

      // General ID pattern: 8+ alphanumeric characters
      const generalIdPattern = /\b[A-Z0-9]{8,}\b/g;
      const generalMatch = text.match(generalIdPattern);
      if (generalMatch) {
        // Filter out common non-ID patterns
        const filtered = generalMatch.filter(id => 
          !id.includes('GOVERNMENT') && 
          !id.includes('DEPARTMENT') && 
          !id.includes('INDIA') &&
          id.length >= 8
        );
        if (filtered.length > 0) {
          console.log('[OCR] General ID extracted:', filtered[0]);
          return filtered[0];
        }
      }

      console.log('[OCR] No ID number found in text');
      return '';
    } catch (error) {
      console.error('[OCR] ID extraction error:', error);
      return '';
    }
  }

  // Extract address from text with dynamic logic
  extractAddress(text) {
    try {
      console.log('[OCR] Extracting address from text...');
      
      // Dynamic address patterns (no hardcoded states/locations)
      const addressPatterns = [
        // After "Address" keyword in any language
        /(?:Address[:\s]*|पता[:\s]*|સરનામું[:\s]*)([^DOB^Mobile^VID^Name^Date^जन्म^મોબાઇલ]+?)(?:\s+(?:DOB|Mobile|VID|Name|Date|जन्म|મોબાઇલ|\d{4}))/i,
        
        // Look for PIN/Postal codes (6 digits) with surrounding context
        /([^0-9\n]{10,}?\d{6}[^0-9\n]*)/g,
        
        // Look for location indicators (dynamic)
        /\b([^0-9\n]*(?:Street|Road|Lane|Area|Nagar|Colony|Society|Apartment|Block|Plot|Gali|Marg|Cross|Layout|Extension|Phase|Sector|Ward|Taluka|Tehsil|Circle|Division|रोड|गली|नगर|कॉलोनी|સોસાયટી|એરિયા|નગર)[^0-9\n]*(?:\d+[^0-9\n]*)*(?:City|Town|Village|District|State|PIN|Pincode|शहर|जिला|राज्य|પિન|શહેર|જિલ્લો)*[^0-9\n]*\d*)\b/i,
        
        // Multi-line address patterns (house number + area + city pattern)
        /(\d+[^0-9\n]*[A-Za-z][^0-9\n]*(?:City|Town|Village|Nagar|Area|Colony|Society|District|State|PIN|Pincode|शहर|જિલ્લો|નગર|એરિયા)[^0-9\n]*\d*)/i
      ];

      // Common location/address keywords (multilingual)
      const locationKeywords = [
        // English
        'street', 'road', 'lane', 'area', 'nagar', 'colony', 'society', 'apartment', 'block', 'plot', 
        'city', 'town', 'village', 'district', 'state', 'pin', 'pincode', 'house', 'flat', 'floor',
        'gali', 'marg', 'cross', 'layout', 'extension', 'phase', 'sector', 'ward', 'taluka', 'tehsil',
        'circle', 'division', 'near', 'opp', 'opposite', 'behind', 'front',
        // Hindi
        'रोड', 'गली', 'नगर', 'कॉलोनी', 'शहर', 'जिला', 'राज्य', 'पिन', 'घर', 'मकान',
        // Gujarati  
        'સોસાયટી', 'એરિયા', 'નગર', 'રોડ', 'ગલી', 'પિન', 'શહેર', 'જિલ્લો', 'ઘર'
      ];

      // Try specific patterns first
      for (let i = 0; i < addressPatterns.length; i++) {
        const pattern = addressPatterns[i];
        let match;
        
        if (pattern.global) {
          // For global patterns, find all matches and score them
          const matches = [];
          while ((match = pattern.exec(text)) !== null) {
            matches.push(match[1]);
          }
          
          for (const candidate of matches) {
            const cleaned = candidate.trim().replace(/[^\w\s,.-]/g, ' ').replace(/\s+/g, ' ');
            if (this.scoreAddress(cleaned, locationKeywords) > 5 && cleaned.length > 15) {
              console.log('[OCR] Address extracted using pattern', i + 1, ':', cleaned);
              return cleaned;
            }
          }
        } else {
          match = text.match(pattern);
          if (match && match[1]) {
            const cleaned = match[1].trim().replace(/[^\w\s,.-]/g, ' ').replace(/\s+/g, ' ');
            if (this.scoreAddress(cleaned, locationKeywords) > 3 && cleaned.length > 15) {
              console.log('[OCR] Address extracted using pattern', i + 1, ':', cleaned);
              return cleaned;
            }
          }
        }
      }

      // Fallback: Look for text segments with location keywords and score them
      const sentences = text.split(/[.\n]/).filter(s => s.trim().length > 10);
      let bestAddress = '';
      let bestScore = 0;

      for (const sentence of sentences) {
        const score = this.scoreAddress(sentence, locationKeywords);
        if (score > bestScore && score > 3) {
          bestScore = score;
          bestAddress = sentence.trim().replace(/[^\w\s,.-]/g, ' ').replace(/\s+/g, ' ');
        }
      }

      if (bestAddress && bestAddress.length > 15) {
        console.log('[OCR] Address extracted using scoring (score:', bestScore, '):', bestAddress);
        return bestAddress;
      }

      console.log('[OCR] No suitable address found in text');
      return '';
    } catch (error) {
      console.error('[OCR] Address extraction error:', error);
      return '';
    }
  }

  // Score address candidates based on location keywords and patterns
  scoreAddress(text, locationKeywords) {
    let score = 0;
    const lowerText = text.toLowerCase();
    
    // Check for location keywords
    for (const keyword of locationKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    // Check for PIN code (6 digits)
    if (/\b\d{6}\b/.test(text)) score += 3;
    
    // Check for house/flat numbers
    if (/\b\d+[\/\-]?\d*\b/.test(text)) score += 1;
    
    // Prefer longer text (more likely to be complete address)
    if (text.length > 30) score += 1;
    if (text.length > 50) score += 1;
    
    // Check for multiple address components
    const components = text.split(/[,\n]/).length;
    if (components > 2) score += 1;
    
    return score;
  }
}

module.exports = new OCRService();