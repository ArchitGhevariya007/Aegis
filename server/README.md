# Aegis KYC Backend

A secure Node.js/Express backend for the Aegis KYC (Know Your Customer) system with face recognition, document verification, and liveness detection capabilities.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Document Upload**: Support for ID documents (JPG, PNG, PDF)
- **OCR Processing**: Document text extraction and validation
- **Liveness Detection**: Anti-spoofing measures for face verification
- **Face Recognition**: ID vs. live face matching
- **Security Features**: Rate limiting, input validation, secure file handling
- **MongoDB Integration**: Scalable data storage with Mongoose ODM

## Project Structure

```
server/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── validation.js        # Request validation middleware
│   └── upload.js            # File upload middleware
├── models/
│   └── User.js              # User data model with KYC fields
├── routes/
│   ├── auth.js              # Authentication routes
│   └── kyc.js               # KYC verification routes
├── utils/
│   └── helpers.js           # Utility functions
├── uploads/                 # File upload directory
├── server.js                # Main server file
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Set up environment variables:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/aegis-kyc
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000
   ```

5. **Start MongoDB service** (if running locally)

6. **Run the server:**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "birthDate": "1999-05-20",
  "residency": "Australia"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "abc123",
  "message": "User registered successfully"
}
```

#### POST `/api/auth/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "abc123",
  "token": "jwtTokenHere"
}
```

#### POST `/api/auth/face-verify`
Verify user identity using face recognition (after login).

**Request Body:**
```json
{
  "userId": "abc123",
  "faceImage": "base64EncodedImage"
}
```

**Response:**
```json
{
  "success": true,
  "verified": true
}
```

### KYC Routes (`/api/kyc`)

#### POST `/api/kyc/upload-id`
Upload ID document for verification.

**Request:** Form-Data with `document` file and `userId`

**Response:**
```json
{
  "success": true,
  "userId": "abc123",
  "ocrData": {
    "name": "John Doe",
    "dob": "1999-05-20",
    "idNumber": "XYZ12345"
  }
}
```

#### POST `/api/kyc/liveness-check`
Perform liveness detection check.

**Request Body:**
```json
{
  "userId": "abc123",
  "faceImage": "base64EncodedImage",
  "movement": "turn_left"
}
```

**Response:**
```json
{
  "success": true,
  "livenessVerified": true
}
```

#### POST `/api/kyc/face-match`
Match ID face with live face image.

**Request Body:**
```json
{
  "userId": "abc123",
  "idFaceImage": "base64EncodedImage",
  "liveFaceImage": "base64EncodedImage"
}
```

**Response:**
```json
{
  "success": true,
  "matchScore": 0.94,
  "verified": true
}
```

#### GET `/api/kyc/status/:userId`
Get KYC verification status.

**Response:**
```json
{
  "success": true,
  "kycStatus": "completed",
  "documentsCount": 1,
  "livenessVerified": true,
  "faceMatched": true
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: Protection against brute force attacks
- **File Upload Security**: File type and size validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express

## KYC Flow

1. **User Registration** → Account creation
2. **Document Upload** → ID document submission and OCR processing
3. **Liveness Check** → Anti-spoofing verification
4. **Face Matching** → ID vs. live face comparison
5. **KYC Completion** → Full verification status

## Development Notes

### Simulated Functions
The current implementation includes simulated versions of:
- OCR processing
- Liveness detection
- Face recognition

**To implement real functionality:**
1. Replace `simulateOCRProcessing()` with Google Vision API or AWS Textract
2. Replace `simulateLivenessCheck()` with AI-based liveness detection
3. Replace `simulateFaceMatching()` with face recognition libraries (e.g., face-api.js, OpenCV)

### File Storage
- Files are stored locally in the `uploads/` directory
- For production, consider using cloud storage (AWS S3, Google Cloud Storage)
- Implement file cleanup for unused uploads

### Database Indexes
Consider adding these MongoDB indexes for performance:
```javascript
// User collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "kycStatus": 1 })
db.users.createIndex({ "createdAt": 1 })
```

## Testing

Test the APIs using tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

## Production Deployment

1. **Environment Variables**: Set production values
2. **Database**: Use production MongoDB instance
3. **File Storage**: Implement cloud storage
4. **Monitoring**: Add logging and monitoring
5. **SSL**: Enable HTTPS
6. **Load Balancing**: Consider multiple server instances

## Contributing

1. Follow the existing code style
2. Add validation for new endpoints
3. Include error handling
4. Update documentation
5. Test thoroughly

## License

This project is licensed under the ISC License.
