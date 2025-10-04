# Aegis - Normalized Database Schema Design

## Database: `aegis`

### 📊 Schema Overview

```
aegis (database)
├── users                    - Core user accounts
├── userprofiles             - Extended user information
├── documents                - User documents (ID, passport, etc.)
├── facedata                 - Biometric face data
├── blockchainrecords        - Blockchain transaction records
├── kycverifications         - KYC verification history
├── admins                   - Administrator accounts
├── roles                    - Role definitions
├── permissions              - Permission definitions
├── userroles                - User-Role mapping
├── securityalerts           - Security incidents
├── emergencycontrols        - System emergency controls
├── loginlocations           - Login tracking
├── insideractivities        - Activity monitoring
├── auditlogs                - Comprehensive audit trail
└── systemsettings           - System configuration
```

---

## 1. Users Collection (Core Authentication)

**Purpose:** Core user authentication and status

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  isActive: Boolean (default: true),
  isEmailVerified: Boolean (default: false),
  accountStatus: String (enum: ['active', 'suspended', 'deactivated', 'locked']),
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  lastLogin: Date,
  lastPasswordChange: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ accountStatus: 1 })
db.users.createIndex({ isActive: 1 })
```

---

## 2. UserProfiles Collection (Extended Information)

**Purpose:** Separate personal information from authentication

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique, indexed),
  firstName: String,
  lastName: String,
  fullName: String,
  dateOfBirth: Date,
  gender: String (enum: ['male', 'female', 'other', 'prefer_not_to_say']),
  nationality: String,
  residency: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      type: "Point",
      coordinates: [Number, Number] // [longitude, latitude]
    }
  },
  phone: {
    countryCode: String,
    number: String,
    verified: Boolean
  },
  profilePicture: String, // URL or file path
  timezone: String,
  language: String (default: 'en'),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.userprofiles.createIndex({ userId: 1 }, { unique: true })
db.userprofiles.createIndex({ "address.coordinates": "2dsphere" })
db.userprofiles.createIndex({ nationality: 1 })
```

---

## 3. Documents Collection (File Management)

**Purpose:** Store all user documents separately

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  documentType: String (enum: ['passport', 'id_card', 'driving_license', 'additional', 'selfie']),
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  fileHash: String (SHA-256 hash for integrity),
  uploadDate: Date,
  expiryDate: Date (for documents with expiration),
  status: String (enum: ['pending', 'verified', 'rejected', 'expired']),
  verifiedBy: ObjectId (ref: 'Admin'),
  verifiedAt: Date,
  rejectionReason: String,
  ocrData: {
    name: String,
    dateOfBirth: Date,
    documentNumber: String,
    issueDate: Date,
    expiryDate: Date,
    nationality: String,
    address: String,
    rawText: String,
    confidence: Number
  },
  metadata: {
    width: Number,
    height: Number,
    format: String
  },
  isDeleted: Boolean (default: false),
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.documents.createIndex({ userId: 1, documentType: 1 })
db.documents.createIndex({ status: 1 })
db.documents.createIndex({ uploadDate: -1 })
db.documents.createIndex({ fileHash: 1 })
db.documents.createIndex({ isDeleted: 1 })
```

---

## 4. FaceData Collection (Biometric Data)

**Purpose:** Store face biometric data separately for security

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique, indexed),
  idFaceImage: String, // Encrypted path or embedding
  liveFaceImage: String, // Encrypted path or embedding
  faceEmbedding: [Number], // Face recognition vector (512 dimensions)
  livenessScore: Number,
  matchScore: Number,
  verificationMethod: String (enum: ['manual', 'automated', 'hybrid']),
  verificationStatus: String (enum: ['pending', 'verified', 'failed']),
  lastVerificationDate: Date,
  verificationAttempts: Number (default: 0),
  isLocked: Boolean (default: false),
  metadata: {
    captureDevice: String,
    captureEnvironment: String,
    lightingCondition: String
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.facedata.createIndex({ userId: 1 }, { unique: true })
db.facedata.createIndex({ verificationStatus: 1 })
db.facedata.createIndex({ lastVerificationDate: -1 })
```

---

## 5. BlockchainRecords Collection

**Purpose:** Track blockchain transactions separately

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  recordType: String (enum: ['identity', 'document', 'verification', 'update']),
  documentId: ObjectId (ref: 'Document'), // Optional
  blockchainNetwork: String (enum: ['ethereum', 'polygon', 'amoy_testnet']),
  transactionHash: String (indexed),
  blockNumber: Number,
  contractAddress: String,
  documentHash: String, // Hash of the document on blockchain
  ipfsHash: String, // IPFS content hash
  encryptionKey: String, // Encrypted
  encryptionIV: String, // Initialization vector
  status: String (enum: ['pending', 'confirmed', 'failed']),
  confirmations: Number (default: 0),
  gasUsed: Number,
  gasCost: String,
  timestamp: Date,
  metadata: {
    walletAddress: String,
    nonce: Number,
    chainId: Number
  },
  errorMessage: String, // If transaction failed
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.blockchainrecords.createIndex({ userId: 1, recordType: 1 })
db.blockchainrecords.createIndex({ transactionHash: 1 }, { unique: true, sparse: true })
db.blockchainrecords.createIndex({ status: 1 })
db.blockchainrecords.createIndex({ timestamp: -1 })
db.blockchainrecords.createIndex({ documentHash: 1 })
```

---

## 6. KYCVerifications Collection

**Purpose:** Track KYC verification process

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  verificationLevel: String (enum: ['basic', 'intermediate', 'advanced']),
  status: String (enum: ['pending', 'in_review', 'approved', 'rejected', 'expired']),
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId (ref: 'Admin'),
  approvalDate: Date,
  expiryDate: Date,
  checks: {
    documentVerification: Boolean,
    faceMatch: Boolean,
    livenessCheck: Boolean,
    addressVerification: Boolean,
    sanctionsCheck: Boolean,
    pepCheck: Boolean, // Politically Exposed Person
    ageVerification: Boolean
  },
  scores: {
    overall: Number,
    documentAuthenticity: Number,
    faceMatchConfidence: Number,
    livenessScore: Number,
    riskScore: Number
  },
  rejectionReasons: [String],
  notes: String,
  ipAddress: String,
  userAgent: String,
  geolocation: {
    type: "Point",
    coordinates: [Number, Number]
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.kycverifications.createIndex({ userId: 1, status: 1 })
db.kycverifications.createIndex({ status: 1, submittedAt: -1 })
db.kycverifications.createIndex({ verificationLevel: 1 })
db.kycverifications.createIndex({ expiryDate: 1 })
```

---

## 7. Roles Collection

**Purpose:** Define system roles

```javascript
{
  _id: ObjectId,
  name: String (unique, indexed),
  displayName: String,
  description: String,
  level: Number (hierarchy: 1=highest, 100=lowest),
  permissions: [ObjectId] (ref: 'Permission'),
  isSystemRole: Boolean (default: false), // Cannot be deleted
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: 'Admin'),
  updatedBy: ObjectId (ref: 'Admin'),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.roles.createIndex({ name: 1 }, { unique: true })
db.roles.createIndex({ isActive: 1 })
db.roles.createIndex({ level: 1 })
```

---

## 8. Permissions Collection

**Purpose:** Granular permission control

```javascript
{
  _id: ObjectId,
  name: String (unique, indexed),
  resource: String (e.g., 'users', 'documents', 'kyc'),
  action: String (e.g., 'read', 'write', 'delete', 'approve'),
  description: String,
  category: String (enum: ['user_management', 'document_management', 'security', 'system']),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.permissions.createIndex({ name: 1 }, { unique: true })
db.permissions.createIndex({ resource: 1, action: 1 })
db.permissions.createIndex({ category: 1 })
```

---

## 9. UserRoles Collection (Many-to-Many)

**Purpose:** Map users to roles

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  roleId: ObjectId (ref: 'Role', indexed),
  assignedBy: ObjectId (ref: 'Admin'),
  assignedAt: Date,
  expiresAt: Date (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.userroles.createIndex({ userId: 1, roleId: 1 }, { unique: true })
db.userroles.createIndex({ roleId: 1 })
db.userroles.createIndex({ isActive: 1 })
db.userroles.createIndex({ expiresAt: 1 })
```

---

## 10. SecurityAlerts Collection

**Purpose:** Security monitoring and alerts

```javascript
{
  _id: ObjectId,
  alertType: String (enum: ['login_attempt', 'suspicious_activity', 'data_breach', 'unauthorized_access']),
  severity: String (enum: ['low', 'medium', 'high', 'critical']),
  title: String,
  description: String,
  userId: ObjectId (ref: 'User', indexed),
  sourceIp: String,
  location: {
    type: "Point",
    coordinates: [Number, Number]
  },
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
    device: String
  },
  status: String (enum: ['new', 'investigating', 'resolved', 'dismissed']),
  assignedTo: ObjectId (ref: 'Admin'),
  resolvedBy: ObjectId (ref: 'Admin'),
  resolvedAt: Date,
  resolution: String,
  metadata: Map,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.securityalerts.createIndex({ userId: 1, createdAt: -1 })
db.securityalerts.createIndex({ alertType: 1, severity: 1 })
db.securityalerts.createIndex({ status: 1 })
db.securityalerts.createIndex({ createdAt: -1 })
db.securityalerts.createIndex({ location: "2dsphere" })
```

---

## 11. AuditLogs Collection

**Purpose:** Comprehensive audit trail

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  adminId: ObjectId (ref: 'Admin', indexed),
  action: String (indexed), // e.g., 'user.login', 'document.upload', 'kyc.approved'
  resourceType: String, // e.g., 'user', 'document', 'kyc'
  resourceId: ObjectId,
  result: String (enum: ['success', 'failure', 'error']),
  ipAddress: String,
  userAgent: String,
  geolocation: {
    type: "Point",
    coordinates: [Number, Number]
  },
  changes: {
    before: Object,
    after: Object
  },
  metadata: Object,
  timestamp: Date (indexed),
  createdAt: Date
}

// Indexes
db.auditlogs.createIndex({ userId: 1, timestamp: -1 })
db.auditlogs.createIndex({ adminId: 1, timestamp: -1 })
db.auditlogs.createIndex({ action: 1, timestamp: -1 })
db.auditlogs.createIndex({ resourceType: 1, resourceId: 1 })
db.auditlogs.createIndex({ timestamp: -1 })
```

---

## Relationships Diagram

```
User (1) ──→ (1) UserProfile
  │
  ├──→ (∞) Documents
  │
  ├──→ (1) FaceData
  │
  ├──→ (∞) BlockchainRecords
  │
  ├──→ (∞) KYCVerifications
  │
  ├──→ (∞) SecurityAlerts
  │
  ├──→ (∞) AuditLogs
  │
  └──→ (∞) UserRoles ──→ (1) Role ──→ (∞) Permissions
```

---

## Benefits of This Design

### 1. Scalability
- ✅ Separate collections allow horizontal scaling
- ✅ Indexes on frequently queried fields
- ✅ Efficient joins using aggregation pipeline
- ✅ Can shard by userId for large datasets

### 2. Performance
- ✅ Smaller document sizes = faster queries
- ✅ Targeted indexes reduce query time
- ✅ No need to load entire user object
- ✅ Better caching possibilities

### 3. Security
- ✅ Biometric data isolated
- ✅ Easier to implement field-level encryption
- ✅ Audit trail for all changes
- ✅ Granular access control

### 4. Maintainability
- ✅ Clear separation of concerns
- ✅ Easier to update specific data
- ✅ Better version control
- ✅ Simplified backup strategies

### 5. Flexibility
- ✅ Easy to add new document types
- ✅ Multiple roles per user
- ✅ Extensible permission system
- ✅ Support for document expiry

---

## Migration Strategy

### Phase 1: Create New Collections
```javascript
// Run migration script to create all collections with indexes
```

### Phase 2: Migrate Data
```javascript
// Transform existing data to new schema
// Maintain old data during transition
```

### Phase 3: Update Application Code
```javascript
// Update models and queries
// Test thoroughly
```

### Phase 4: Cutover
```javascript
// Switch to new schema
// Archive old data
```

---

## Query Examples

### Get User Complete Profile
```javascript
const user = await User.aggregate([
  { $match: { email: 'user@example.com' } },
  {
    $lookup: {
      from: 'userprofiles',
      localField: '_id',
      foreignField: 'userId',
      as: 'profile'
    }
  },
  {
    $lookup: {
      from: 'documents',
      localField: '_id',
      foreignField: 'userId',
      as: 'documents'
    }
  },
  {
    $lookup: {
      from: 'kycverifications',
      localField: '_id',
      foreignField: 'userId',
      as: 'kycStatus'
    }
  }
]);
```

### Get User Roles and Permissions
```javascript
const userPermissions = await UserRole.aggregate([
  { $match: { userId: userId, isActive: true } },
  {
    $lookup: {
      from: 'roles',
      localField: 'roleId',
      foreignField: '_id',
      as: 'role'
    }
  },
  { $unwind: '$role' },
  {
    $lookup: {
      from: 'permissions',
      localField: 'role.permissions',
      foreignField: '_id',
      as: 'permissions'
    }
  }
]);
```

---

## Data Retention Policy

- **AuditLogs**: Keep 2 years, archive older
- **SecurityAlerts**: Keep 1 year active, archive rest
- **Documents**: Keep until user deletion + 30 days
- **BlockchainRecords**: Permanent (immutable)
- **KYCVerifications**: Keep all, mark expired

---

This schema is production-ready, scalable, and follows MongoDB best practices! 🚀

