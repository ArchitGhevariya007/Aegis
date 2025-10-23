# Aegis Digital ID System - Architecture Documentation

## System Overview

The Aegis Digital ID System is a comprehensive blockchain-based digital identity platform with advanced security features, biometric verification, role-based access control, and democratic voting capabilities.

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer - React Frontend"
        A[User Dashboard]
        B[Admin Dashboard]
        C[Department Dashboard]
        D[Registration Flow]
        E[Login System]
    end

    subgraph "API Gateway Layer"
        F[Express.js Server]
        G[REST API Endpoints]
        H[Authentication Middleware]
        I[Rate Limiting]
    end

    subgraph "Business Logic Layer"
        J[Authentication Service]
        K[KYC Service]
        L[Face Verification Service]
        M[OCR Service]
        N[Voting Service]
        O[Emergency Control Service]
        P[Department Access Service]
        Q[Location Tracking Service]
    end

    subgraph "AI/ML Services"
        R[Face Detection - SCRFD]
        S[Face Recognition - ArcFace]
        T[OCR Engine - PaddleOCR]
        U[Liveness Detection]
    end

    subgraph "Data Layer"
        V[(MongoDB Database)]
        W[File Storage System]
        X[Session Store]
    end

    subgraph "Blockchain Layer"
        Y[Ethereum Smart Contracts]
        Z[IPFS Storage]
        AA[Wallet Service]
    end

    subgraph "External Services"
        AB[Geolocation API]
        AC[Email Service]
    end

    A --> F
    B --> F
    C --> F
    D --> F
    E --> F
    
    F --> G
    G --> H
    H --> I
    
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
    I --> O
    I --> P
    I --> Q
    
    L --> R
    L --> S
    M --> T
    K --> U
    
    J --> V
    K --> V
    N --> V
    O --> V
    P --> V
    Q --> V
    
    K --> W
    L --> W
    
    J --> X
    
    K --> Y
    K --> Z
    Y --> AA
    
    Q --> AB
    O --> AC
```

---

## Detailed Component Architecture

### 1. Frontend Architecture (React)

```mermaid
graph LR
    subgraph "User Interface Layer"
        A[Components]
        B[Pages]
        C[Common UI]
    end

    subgraph "State Management"
        D[React Hooks]
        E[Local State]
        F[Context API]
    end

    subgraph "Services Layer"
        G[API Service]
        H[Storage Service]
        I[Auth Service]
    end

    subgraph "Utilities"
        J[Validation]
        K[Formatting]
        L[Error Handling]
    end

    A --> D
    B --> D
    C --> D
    
    D --> G
    D --> H
    D --> I
    
    G --> J
    G --> K
    G --> L
```

**Key Components:**
- **User Dashboard**: Profile, Documents, Blockchain ID, Access Logs, Voting
- **Admin Dashboard**: Security Alerts, Role Management, Emergency Controls, Location Map, Voting Admin
- **Department Dashboard**: User Search, Permission-based Data Access, Document Viewer
- **Registration Flow**: Multi-step KYC, Face Verification, Document Upload, OCR Processing

---

### 2. Backend Architecture (Node.js + Express)

```mermaid
graph TB
    subgraph "API Routes Layer"
        A[Auth Routes]
        B[KYC Routes]
        C[Admin Routes]
        D[Department Routes]
        E[Voting Routes]
        F[Emergency Routes]
        G[Location Routes]
    end

    subgraph "Middleware Layer"
        H[Authentication]
        I[Authorization]
        J[Validation]
        K[Rate Limiting]
        L[Error Handling]
        M[Lockdown Check]
    end

    subgraph "Service Layer"
        N[Face Pipeline]
        O[OCR Service]
        P[Blockchain Service]
        Q[Geolocation Service]
        R[Security Detection]
    end

    subgraph "Models Layer"
        S[User Model]
        T[Admin Model]
        U[Department Model]
        V[Voting Model]
        W[Security Alert Model]
        X[Emergency Control Model]
    end

    A --> H
    B --> H
    C --> I
    D --> I
    E --> H
    F --> I
    G --> H
    
    H --> J
    I --> J
    J --> K
    K --> L
    L --> M
    
    A --> N
    B --> N
    A --> O
    B --> O
    B --> P
    G --> Q
    A --> R
    
    N --> S
    O --> S
    P --> S
    E --> V
    F --> X
    D --> U
```

---

### 3. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User/Admin/Dept
    participant F as Frontend
    participant A as Auth Middleware
    participant J as JWT Service
    participant DB as Database
    participant L as Lockdown Check

    U->>F: Login Request
    F->>A: POST /api/auth/login
    A->>L: Check Lockdown Status
    L->>DB: Query Emergency Control
    DB-->>L: Lockdown Status
    
    alt System Locked
        L-->>A: 403 Forbidden
        A-->>F: Lockdown Error
        F-->>U: Show Lockdown Modal
    else System Active
        L-->>A: Proceed
        A->>DB: Validate Credentials
        DB-->>A: User Data
        A->>J: Generate JWT Token
        J-->>A: Token + Session ID
        A->>DB: Store Session
        A-->>F: Token + User Info
        F-->>U: Redirect to Dashboard
    end
```

---

### 4. Face Verification Pipeline

```mermaid
graph LR
    A[Input: Base64 Images] --> B[Face Detection - SCRFD]
    B --> C{Face Detected?}
    C -->|No| D[Return Error]
    C -->|Yes| E[Face Cropping & Alignment]
    E --> F[Feature Extraction - ArcFace]
    F --> G[Generate Embeddings]
    G --> H[Compare Embeddings]
    H --> I[Calculate Similarity Score]
    I --> J{Score > Threshold?}
    J -->|Yes| K[Match Confirmed]
    J -->|No| L[Match Failed]
    K --> M[Store Verification Result]
    L --> M
```

**Technologies:**
- **SCRFD**: State-of-the-art face detection model
- **ArcFace**: Deep face recognition with 512-dimensional embeddings
- **Cosine Similarity**: For face matching (threshold: 0.7)

---

### 5. Voting System Architecture

```mermaid
graph TB
    subgraph "User Flow"
        A[User Login] --> B[Access Voting]
        B --> C[Face Verification]
        C --> D[Select Party]
        D --> E[Submit Vote]
    end

    subgraph "Verification Layer"
        F[Check Voting Status]
        G[Verify Face Match]
        H[Check Double Vote]
    end

    subgraph "Data Layer"
        I[Voting Session]
        J[Party Records]
        K[Voter Registry]
        L[Vote Counts]
    end

    subgraph "Admin Control"
        M[Start Voting]
        N[Stop Voting]
        O[View Results]
        P[Reset Session]
    end

    C --> G
    E --> F
    E --> H
    
    F --> I
    G --> K
    H --> K
    E --> L
    
    M --> I
    N --> I
    O --> J
    O --> L
    P --> I
    P --> K
    P --> L
```

---

### 6. Department Access Control

```mermaid
graph LR
    A[Department Login] --> B[Auth Middleware]
    B --> C[Department Token]
    C --> D[Search Users]
    D --> E[Fetch User Data]
    E --> F[Permission Filter]
    F --> G{Has Permission?}
    G -->|Yes| H[Show Data]
    G -->|No| I[Hide Data]
    
    subgraph "Permission Categories"
        J[Basic Information]
        K[Document Access]
    end
    
    F --> J
    F --> K
```

**Permission Model:**
- **Immigration Dept**: Passport, Visa, Criminal History, Work Permit
- **Income Tax Dept**: Tax Returns, Payslips, Bank Statements
- **Medical Dept**: Medical History, Insurance Policy, Blood Type

---

### 7. Blockchain Integration

```mermaid
graph TB
    A[User Document] --> B[Encrypt Document]
    B --> C[Upload to IPFS]
    C --> D[Get IPFS Hash]
    D --> E[Store on Blockchain]
    E --> F[Smart Contract]
    F --> G[Generate Transaction Hash]
    G --> H[Store in MongoDB]
    
    I[Retrieve Document] --> J[Fetch IPFS Hash]
    J --> K[Download from IPFS]
    K --> L[Decrypt Document]
    L --> M[Deliver to User]
```

**Features:**
- **Immutable Storage**: Documents stored permanently on IPFS
- **Blockchain Verification**: All transactions recorded on Ethereum
- **Encryption**: AES-256 encryption for sensitive documents
- **Wallet Integration**: Each user has unique blockchain wallet

---

### 8. Emergency Control System

```mermaid
stateDiagram-v2
    [*] --> Normal: System Active
    Normal --> Lockdown: Admin Activates
    Lockdown --> Normal: Admin Deactivates
    
    state Lockdown {
        [*] --> BlockLogins
        BlockLogins --> TerminateSessions
        TerminateSessions --> DisableAccess
        DisableAccess --> LogActivity
    }
    
    state Normal {
        [*] --> AllowLogins
        AllowLogins --> MonitorActivity
        MonitorActivity --> GenerateAlerts
    }
```

**Capabilities:**
- **System Lockdown**: Immediate user logout and access blocking
- **Data Export**: Emergency backup of all user/admin data
- **System Reports**: Comprehensive security and activity reports
- **Real-time Monitoring**: Live user location and activity tracking

---

### 9. Database Schema Overview

```mermaid
erDiagram
    USER ||--o{ DOCUMENT : has
    USER ||--o{ ACCESS_LOG : generates
    USER ||--o{ SESSION : has
    USER ||--o{ SECURITY_ALERT : triggers
    USER {
        ObjectId id
        string email
        string password
        date birthDate
        string residency
        string phoneNumber
        object faceData
        array documents
        object blockchainData
        array accessLogs
        array sessions
    }
    
    DOCUMENT {
        string type
        string fileName
        string filePath
        string documentCategory
        object ocrData
        object blockchainData
        boolean verified
    }
    
    ADMIN ||--o{ SECURITY_ALERT : manages
    ADMIN {
        ObjectId id
        string email
        string password
        string name
        string role
        array permissions
    }
    
    DEPARTMENT ||--o{ PERMISSION : has
    DEPARTMENT {
        ObjectId id
        string name
        string code
        array permissions
        string description
    }
    
    VOTING ||--o{ VOTE : contains
    VOTING ||--o{ PARTY : has
    VOTING {
        ObjectId id
        boolean isActive
        string title
        array parties
        array voters
        number totalVotes
    }
    
    EMERGENCY_CONTROL {
        ObjectId id
        string type
        boolean enabled
        string reason
        date activatedAt
    }
```

---

### 10. Security Architecture

```mermaid
graph TB
    subgraph "Input Security"
        A[Rate Limiting]
        B[Input Validation]
        C[XSS Protection]
        D[CSRF Protection]
    end

    subgraph "Authentication Security"
        E[JWT Tokens]
        F[Password Hashing - bcrypt]
        G[Session Management]
        H[Multi-factor Auth]
    end

    subgraph "Authorization Security"
        I[Role-Based Access]
        J[Permission Checks]
        K[Resource Ownership]
    end

    subgraph "Data Security"
        L[Encryption at Rest]
        M[Encryption in Transit]
        N[Blockchain Verification]
        O[IPFS Storage]
    end

    subgraph "Monitoring & Alerts"
        P[Login Attempts]
        Q[Failed Auth]
        R[Suspicious Activity]
        S[System Anomalies]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> I
    F --> I
    G --> I
    H --> I
    
    I --> L
    J --> L
    K --> L
    
    L --> P
    M --> Q
    N --> R
    O --> S
```

---

## Technology Stack

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **State Management**: React Hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Security**: Helmet, CORS, Express Rate Limit

### AI/ML Services
- **Face Detection**: SCRFD (Python)
- **Face Recognition**: ArcFace (Python)
- **OCR**: PaddleOCR (Python)
- **Communication**: Child Process / HTTP APIs

### Blockchain
- **Platform**: Ethereum
- **Library**: ethers.js
- **Storage**: IPFS
- **Smart Contracts**: Solidity

### DevOps
- **Process Manager**: Nodemon (Development)
- **Environment**: dotenv
- **Version Control**: Git

---

## Data Flow Diagrams

### User Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Services
    participant BC as Blockchain
    participant DB as Database

    U->>F: Start Registration
    F->>U: Step 1: Basic Info
    U->>F: Email, Password, DOB
    
    F->>U: Step 2: Face Capture
    U->>F: Upload ID + Live Photo
    
    F->>B: Submit Face Images
    B->>AI: Detect & Compare Faces
    AI-->>B: Similarity Score
    
    alt Face Match Success
        B->>F: Verification Passed
        F->>U: Step 3: Document Upload
        U->>F: Upload Documents + OCR
        
        F->>B: Submit Full Registration
        B->>AI: Process OCR
        AI-->>B: Extracted Data
        
        B->>BC: Store on Blockchain
        BC-->>B: Transaction Hash
        
        B->>DB: Save User Data
        B-->>F: Registration Success
        F-->>U: Redirect to Dashboard
    else Face Match Fail
        B-->>F: Verification Failed
        F-->>U: Show Error
    end
```

### Voting Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as Face Service
    participant DB as Database

    U->>F: Access Voting System
    F->>B: Get Voting Status
    B->>DB: Check Active Session
    DB-->>B: Voting Active
    B-->>F: Session + Parties
    
    F->>U: Show Voting Interface
    U->>F: Click Face Verify
    F->>U: Open Camera Modal
    
    U->>F: Capture Face
    F->>B: Submit for Verification
    B->>AI: Compare with Registered Face
    AI-->>B: Match Result
    
    alt Verification Success
        B-->>F: Verified
        F->>U: Show Party Selection
        
        U->>F: Select Party
        U->>F: Submit Vote
        
        F->>B: Cast Vote Request
        B->>DB: Check Double Vote
        DB-->>B: Not Voted Yet
        
        B->>DB: Record Vote
        B->>DB: Increment Party Count
        B-->>F: Vote Recorded
        F-->>U: Success Message
    else Verification Fail
        B-->>F: Not Verified
        F-->>U: Error Message
    end
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Tier"
        A[React App - Port 3000]
        B[Static Assets]
    end

    subgraph "Application Tier"
        C[Express Server - Port 5000]
        D[Python AI Services]
    end

    subgraph "Data Tier"
        E[MongoDB - Port 27017]
        F[File Storage]
    end

    subgraph "External Services"
        G[Ethereum Network]
        H[IPFS Network]
    end

    A --> C
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
```

---

## Security Measures

### 1. Authentication
- JWT-based stateless authentication
- Secure password hashing with bcrypt (salt rounds: 10)
- Session management with automatic expiry
- Multi-device session tracking

### 2. Authorization
- Role-based access control (User, Admin, Department)
- Granular permission system for departments
- Resource ownership verification
- Middleware-based access control

### 3. Data Protection
- HTTPS encryption for data in transit
- AES-256 encryption for sensitive documents
- Blockchain verification for immutability
- Regular security audits

### 4. Face Anti-Spoofing
- Liveness detection during verification
- Multiple face angle requirements
- Quality checks on uploaded images
- Similarity threshold enforcement (0.7)

### 5. Emergency Controls
- System-wide lockdown capability
- Immediate session termination
- Audit logging of all actions
- Data export for emergency backup

---

## Performance Optimization

### Frontend
- Component lazy loading
- Image optimization
- Memoization for expensive operations
- Virtual scrolling for large lists
- Debouncing for search inputs

### Backend
- Database indexing on frequently queried fields
- Connection pooling for MongoDB
- Rate limiting to prevent abuse
- Caching strategies for static data
- Efficient query optimization

### AI Services
- Model loading optimization
- Batch processing where applicable
- Result caching for repeated requests
- GPU acceleration when available

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API design for load balancing
- Session storage in distributed cache
- Microservices-ready architecture
- Container-ready deployment

### Vertical Scaling
- Optimized database queries
- Efficient memory management
- Connection pooling
- Resource monitoring

### Data Scaling
- Document storage on IPFS
- Blockchain for immutable records
- Database sharding strategy
- Archive old data periodically

---

## Monitoring & Logging

### Application Monitoring
- Request/response logging
- Error tracking and alerting
- Performance metrics
- User activity tracking

### Security Monitoring
- Failed login attempt tracking
- Unusual access pattern detection
- Real-time security alerts
- Audit trail for sensitive operations

### System Monitoring
- Server health checks
- Database connection monitoring
- AI service availability
- Blockchain network status

---

## Future Enhancements

1. **Mobile Application**: Native iOS/Android apps
2. **Advanced Biometrics**: Fingerprint, iris scanning
3. **Decentralized Identity**: Self-sovereign identity implementation
4. **Multi-language Support**: Internationalization
5. **Advanced Analytics**: ML-based fraud detection
6. **API Gateway**: Centralized API management
7. **Microservices**: Breaking monolith into services
8. **GraphQL**: More efficient data fetching
9. **Real-time Updates**: WebSocket implementation
10. **Enhanced Voting**: Ranked choice, multi-option voting

---

## Conclusion

The Aegis Digital ID System represents a comprehensive, secure, and scalable solution for digital identity management with advanced features including biometric verification, blockchain integration, role-based access control, and democratic voting capabilities. The architecture is designed to be maintainable, secure, and ready for future enhancements.

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Architecture Type**: Layered Monolithic with Service-Oriented Components

