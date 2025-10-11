# 🔧 Lockdown Toggle - Request Body Empty Issue

## 🐛 The Problem

**Frontend sends:**
```json
{enabled: true, reason: "test"}
```

**Backend receives:**
```json
{enabled: undefined, reason: undefined, body: {}}
```

The request body is **NOT reaching the backend**!

---

## 🔍 Debug Changes Added

### **1. Frontend API Logging**
**File:** `client/src/services/api.js`

```javascript
toggleLockdown: async (enabled, reason, token) => {
    const payload = { enabled, reason };
    console.log('[API] Sending lockdown toggle:', payload);
    console.log('[API] Stringified:', JSON.stringify(payload));
    
    return apiCall('/emergency/toggle-lockdown', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
```

### **2. Server Debug Middleware**
**File:** `server/server.js`

```javascript
// Debug middleware for emergency routes
app.use('/api/emergency', (req, res, next) => {
  console.log('[DEBUG] Emergency route hit:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers['content-type']
  });
  next();
});
```

### **3. Backend Route Logging**
**File:** `server/routes/emergencyControlRoutes.js`

```javascript
console.log('[EMERGENCY] Toggle lockdown request:', { 
    enabled,                    
    enabledType: typeof enabled,
    enabledValue: enabled,      
    enabledStrictTrue: enabled === true,
    enabledLooseTrue: enabled == true,
    reason,
    body: req.body
});

// Ensure enabled is a boolean (handle both true and 'true')
const shouldEnable = enabled === true || enabled === 'true';
```

---

## 🧪 How to Test & Debug

### **Step 1: Start Server (Keep Terminal Visible)**

```bash
cd server
npm start
```

**Keep this terminal window open to see logs!**

### **Step 2: Start Client (Separate Terminal)**

```bash
cd client
npm start
```

### **Step 3: Test Lockdown Toggle**

1. Open browser console (F12)
2. Go to Admin Dashboard → Emergency tab
3. Click the lockdown toggle
4. Watch **TWO places**:

#### **Browser Console Should Show:**
```
[API] Sending lockdown toggle: {enabled: true, reason: "your reason"}
[API] Stringified: {"enabled":true,"reason":"your reason"}
Making API call to: http://localhost:5000/api/emergency/toggle-lockdown with method: POST
```

#### **Server Terminal Should Show:**
```
[DEBUG] Emergency route hit: {
  method: 'POST',
  path: '/toggle-lockdown',
  body: { enabled: true, reason: 'your reason' },  ← SHOULD NOT BE EMPTY!
  headers: 'application/json'
}

[EMERGENCY] Toggle lockdown request: {
  enabled: true,                ← SHOULD BE true
  enabledType: 'boolean',       ← SHOULD BE 'boolean'
  enabledStrictTrue: true,      ← SHOULD BE true
  body: { enabled: true, reason: 'your reason' }
}

[EMERGENCY] System lockdown activated by admin@aegis.com
```

---

## 🔍 Troubleshooting

### **If `body: {}` is still empty:**

#### **Possible Cause 1: CORS Preflight**
Check if there's an OPTIONS request before POST:
```
[DEBUG] Emergency route hit: {
  method: 'OPTIONS',  ← Preflight request
  ...
}
[DEBUG] Emergency route hit: {
  method: 'POST',     ← Actual request
  body: {}            ← Body might be lost here
}
```

**Fix:** Add proper CORS handling:
```javascript
// server/server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

#### **Possible Cause 2: Body Parser Order**
Check if `express.json()` is BEFORE routes:

**File:** `server/server.js`
```javascript
// ✅ CORRECT ORDER:
app.use(express.json({ limit: '50mb' }));     // 1. Body parser FIRST
app.use(express.urlencoded({ extended: true }));
app.use(cors());                               // 2. CORS
app.use('/api/emergency', emergencyRoutes);    // 3. Routes LAST
```

---

#### **Possible Cause 3: Middleware Consuming Body**
Check if `adminAuth` middleware is reading the body:

**File:** `server/middleware/adminAuth.js`

The middleware should **NOT** call `req.body` or consume the stream.

---

#### **Possible Cause 4: Content-Type Mismatch**
Check server logs for:
```
headers: 'application/json'  ← Should be this
headers: undefined           ← BAD!
headers: 'text/plain'        ← BAD!
```

If not `application/json`, the body parser won't parse it!

---

## 📋 Quick Fix Checklist

If body is still empty after checking logs:

- [ ] `express.json()` is in server.js BEFORE routes
- [ ] CORS is properly configured
- [ ] `Content-Type: application/json` header is sent
- [ ] No middleware is consuming the request body
- [ ] adminAuth middleware doesn't touch req.body
- [ ] Browser console shows the body is being sent
- [ ] Server logs show the body is received

---

## 🎯 Expected Flow

```
Frontend (EmergencyPanel.js)
  ↓ calls
emergencyAPI.toggleLockdown(true, "reason", token)
  ↓ logs
[API] Sending lockdown toggle: {enabled: true, reason: "reason"}
  ↓ sends
POST http://localhost:5000/api/emergency/toggle-lockdown
  ↓ hits
Debug Middleware (server.js)
  ↓ logs
[DEBUG] Emergency route hit: {body: {enabled: true, reason: "reason"}}
  ↓ passes to
adminAuth Middleware
  ↓ verifies token, passes to
Route Handler (emergencyControlRoutes.js)
  ↓ logs
[EMERGENCY] Toggle lockdown request: {enabled: true, enabledType: 'boolean'}
  ↓ executes
if (shouldEnable) { ... ACTIVATE LOCKDOWN ... }
  ↓ returns
{success: true, message: "System lockdown activated", lockdown: {...}}
```

---

## 🚀 Next Steps

1. **Restart server** with logs visible
2. **Test lockdown toggle**
3. **Check BOTH browser console AND server terminal**
4. **Share the output** from both places

The logs will tell us exactly where the request body is being lost!

---

## 💡 Temporary Workaround

If you need lockdown to work RIGHT NOW while debugging:

**Option 1: Use Query Parameters**
```javascript
// Frontend
return apiCall(`/emergency/toggle-lockdown?enabled=${enabled}&reason=${encodeURIComponent(reason)}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});

// Backend
router.post('/toggle-lockdown', adminAuth, async (req, res) => {
  const { enabled, reason } = req.query;  // ← Use req.query instead of req.body
  const shouldEnable = enabled === 'true';
  ...
});
```

**Option 2: Direct Database Activation**
```bash
cd server
node -e "const mongoose = require('mongoose'); const EmergencyControl = require('./models/EmergencyControl'); mongoose.connect('mongodb://localhost:27017/aegis').then(async () => { await EmergencyControl.create({ type: 'system_lockdown', status: 'active', reason: 'Manual activation', activatedBy: '...' }); console.log('Lockdown activated!'); process.exit(0); });"
```

---

**Once you see the debug logs, we'll know exactly what's wrong and can fix it!** 🔍

