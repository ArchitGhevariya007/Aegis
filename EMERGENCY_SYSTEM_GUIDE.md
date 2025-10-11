# 🚨 Emergency Control System - Complete Guide

## Overview

The Emergency Control Panel is a **critical security feature** designed for **crisis management** in the Aegis Digital ID System. It provides administrators with powerful tools to respond to security breaches, system compromises, or other emergencies.

---

## 🎯 Features

### 1. **System Lockdown** 🔒
**Purpose:** Immediately disable all user access during a security crisis

**What it does:**
- ✅ Forces logout of ALL active users
- ✅ Disables all user login endpoints
- ✅ Marks all active sessions as inactive
- ✅ Creates a CRITICAL security alert
- ✅ Logs the action with admin credentials
- ✅ Requires a reason for activation (audit trail)

**How to use:**
1. Click the Emergency tab in Admin Dashboard
2. Toggle the "System Lockdown" switch
3. Enter a detailed reason (e.g., "Detected brute force attack from multiple IPs")
4. Confirm the action in the warning dialog
5. System will immediately lock down
6. Toggle OFF to restore normal operations

**Technical Details:**
- Backend endpoint: `POST /api/emergency/toggle-lockdown`
- Updates `emergencycontrols` collection
- Updates all `loginlocations` to `isActive: false`
- Creates entry in `securityalerts` collection

---

### 2. **Export All User Data** 💾
**Purpose:** Create emergency backup of all system data

**What it exports:**
- 👥 All user accounts (excluding passwords)
- 📍 All login locations and sessions
- 🚨 All security alerts
- 📊 Summary statistics:
  - Total users
  - Active vs locked users
  - Total login records
  - Total security alerts

**Export Format:** JSON file
**Filename:** `aegis-emergency-backup-YYYY-MM-DD.json`

**How to use:**
1. Click "Export All User Data" button
2. Confirm in the dialog
3. JSON file downloads automatically
4. Action is logged in security alerts

**Technical Details:**
- Backend endpoint: `GET /api/emergency/export-users`
- Excludes password fields for security
- Uses MongoDB `.lean()` for performance
- Creates audit log entry

**Sample Export Structure:**
```json
{
  "exportedAt": "2024-10-11T10:30:00.000Z",
  "exportedBy": "admin@aegis.com",
  "reason": "Emergency System Backup",
  "data": {
    "users": [...],
    "loginLocations": [...],
    "securityAlerts": [...],
    "summary": {
      "totalUsers": 150,
      "totalLoginRecords": 1247,
      "totalSecurityAlerts": 23,
      "activeUsers": 142,
      "lockedUsers": 8
    }
  }
}
```

---

### 3. **Generate System Report** 📄
**Purpose:** Comprehensive security and activity analysis

**Report includes:**

#### **System Status**
- Overall health: HEALTHY / WARNING / CRITICAL
- Active security alerts count
- Critical issues count

#### **User Metrics**
- Total users
- Active users
- Locked accounts
- New registrations today
- Active sessions

#### **Login Metrics**
- Total logins (all time)
- Logins today
- Failed logins today
- Success rate percentage

#### **Security Metrics**
- Total alerts
- Active alerts
- Critical alerts (last 7 days)
- Alert type breakdown

#### **Geographic Data**
- Top 10 countries by login count
- Cities per country

#### **Recent Critical Alerts**
- Last 10 high/critical severity alerts
- Full details: type, user, status, date

#### **Emergency Control History**
- Last 10 emergency activations
- Who activated/deactivated
- Duration and reason

#### **AI-Generated Recommendations**
- System health recommendations
- Security improvement suggestions
- Actionable items based on current state

**Output Formats:** 
1. **JSON** - Machine-readable, full data
2. **TXT** - Human-readable, formatted report

**Filenames:** 
- `aegis-system-report-YYYY-MM-DD.json`
- `aegis-system-report-YYYY-MM-DD.txt`

**How to use:**
1. Click "Generate System Report" button
2. Both JSON and TXT files download automatically
3. Review recommendations in TXT file
4. Archive JSON file for compliance

**Technical Details:**
- Backend endpoint: `GET /api/emergency/system-report`
- Analyzes last 7 days by default
- Uses MongoDB aggregation pipelines
- Generates contextual recommendations

---

## 📊 Statistics Dashboard

The Emergency Panel displays real-time statistics:

| Metric | Description |
|--------|-------------|
| **Total Emergency Events** | Lifetime count of all emergency activations |
| **Active Emergencies** | Currently active emergency controls |
| **System Lockdowns** | Total lockdown events (historical) |

---

## 🔐 Security & Audit

### **All actions are logged:**
✅ Every emergency action creates a security alert  
✅ Admin email is recorded for accountability  
✅ Timestamps are preserved  
✅ Reasons are required and stored  
✅ Actions cannot be deleted (audit trail)

### **Access Control:**
🔒 **Admin authentication required** - All endpoints use `adminAuth` middleware  
🔒 **JWT token validation** - Expired tokens rejected  
🔒 **No bypass possible** - Cannot be disabled from frontend

---

## 🚀 How to Test

### **1. Test System Lockdown**

**Backend:**
```bash
cd server
node server.js
```

**Frontend:**
```bash
cd client
npm start
```

**Steps:**
1. Login as admin (admin@aegis.com)
2. Open two browser tabs:
   - Tab 1: Admin Dashboard (Emergency tab)
   - Tab 2: User login/dashboard
3. In Tab 2, login as a regular user
4. Check "Location Map" - you'll see active session
5. In Tab 1, toggle System Lockdown ON
6. Enter reason: "Testing emergency lockdown"
7. Confirm the action
8. **Observe:**
   - Tab 2 user is force-logged out
   - Location Map shows no active users
   - Security Alerts show CRITICAL alert
   - Try to login as user → should work (lockdown prevents future logins at middleware level)

**To disable lockdown:**
- Toggle OFF in Admin Dashboard
- System returns to normal

---

### **2. Test Data Export**

**Steps:**
1. Login as admin
2. Emergency tab → "Export All User Data"
3. Confirm dialog
4. Check Downloads folder for `aegis-emergency-backup-*.json`
5. Open JSON file
6. Verify structure:
   ```json
   {
     "exportedAt": "...",
     "exportedBy": "admin@aegis.com",
     "data": {
       "users": [...],
       "loginLocations": [...],
       "securityAlerts": [...],
       "summary": {...}
     }
   }
   ```
7. Check Security Alerts panel - should show "Emergency Data Export" entry

---

### **3. Test System Report**

**Steps:**
1. Create some test data:
   - Register a few users
   - Login/logout multiple times
   - Trigger some security alerts (failed logins)
2. Emergency tab → "Generate System Report"
3. Two files download:
   - `.json` - Full data
   - `.txt` - Readable report
4. Open `.txt` file
5. Verify sections:
   - System Status
   - User Metrics
   - Login Metrics
   - Security Metrics
   - Recommendations
   - Geographic Data

**Sample TXT Report:**
```
═══════════════════════════════════════════════════════════
        AEGIS DIGITAL ID SYSTEM - EMERGENCY REPORT
═══════════════════════════════════════════════════════════

Generated: 10/11/2024, 10:30:00 AM
Generated By: admin@aegis.com
Report Period: 10/4/2024 - 10/11/2024

───────────────────────────────────────────────────────────
SYSTEM STATUS
───────────────────────────────────────────────────────────
Overall Status: HEALTHY
Active Alerts: 0
Critical Issues: 0

───────────────────────────────────────────────────────────
USER METRICS
───────────────────────────────────────────────────────────
Total Users: 25
Active Users: 24
Locked Users: 1
New Users Today: 3
Active Sessions: 5

...
```

---

## 🛠️ Backend API Reference

### **1. Get Emergency Status**
```http
GET /api/emergency/status
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "hasActiveEmergency": true,
  "activeControls": [
    {
      "_id": "...",
      "type": "system_lockdown",
      "status": "active",
      "reason": "Security breach detected",
      "activatedBy": {
        "email": "admin@aegis.com"
      },
      "activatedAt": "2024-10-11T10:00:00.000Z"
    }
  ]
}
```

---

### **2. Toggle System Lockdown**
```http
POST /api/emergency/toggle-lockdown
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "enabled": true,
  "reason": "Detected multiple unauthorized access attempts"
}
```

**Response (Activate):**
```json
{
  "success": true,
  "message": "System lockdown activated. All users have been logged out.",
  "lockdown": {
    "type": "system_lockdown",
    "status": "active",
    "reason": "...",
    "activatedBy": "...",
    "activatedAt": "..."
  }
}
```

**Response (Deactivate):**
```json
{
  "success": true,
  "message": "System lockdown deactivated. Normal operations resumed.",
  "lockdown": {
    "type": "system_lockdown",
    "status": "inactive",
    "deactivatedBy": "...",
    "deactivatedAt": "..."
  }
}
```

---

### **3. Export All User Data**
```http
GET /api/emergency/export-users
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportedAt": "2024-10-11T10:30:00.000Z",
    "exportedBy": "admin@aegis.com",
    "reason": "Emergency System Backup",
    "data": {
      "users": [...],
      "loginLocations": [...],
      "securityAlerts": [...],
      "summary": {...}
    }
  },
  "message": "User data exported successfully"
}
```

---

### **4. Generate System Report**
```http
GET /api/emergency/system-report
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "generatedAt": "...",
    "generatedBy": "...",
    "reportPeriod": {...},
    "systemStatus": {...},
    "userMetrics": {...},
    "loginMetrics": {...},
    "securityMetrics": {...},
    "geographicData": {...},
    "recentCriticalAlerts": [...],
    "emergencyControlHistory": [...],
    "recommendations": [...]
  }
}
```

---

### **5. Get Emergency Statistics**
```http
GET /api/emergency/stats
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "total": 15,
  "active": 0,
  "systemLockdowns": 5,
  "securityProtocols": 7,
  "dataProtection": 3
}
```

---

## 💡 Best Practices

### **When to Use System Lockdown:**
✅ Active security breach detected  
✅ Multiple unauthorized access attempts  
✅ Compromised admin credentials  
✅ Database tampering detected  
✅ DDoS attack in progress  

### **When to Export Data:**
✅ Before major system updates  
✅ During security incident investigation  
✅ For compliance and audit requirements  
✅ Regular backup schedule (weekly/monthly)  

### **When to Generate Reports:**
✅ End of day/week/month  
✅ After resolving security incidents  
✅ For management review  
✅ Compliance audits  

---

## 🔄 Integration with Other Systems

The Emergency Control Panel integrates seamlessly with:

- **Security Alerts Panel** - All actions create alerts
- **Location Map** - Lockdown affects active sessions
- **Login System** - Lockdown prevents new logins
- **Audit Logs** - All actions are recorded

---

## 📝 Notes

- **System Lockdown** does NOT affect admin accounts (you can still login as admin)
- **Export Data** excludes password hashes for security
- **Reports** are generated in real-time from live database
- All actions require **active admin JWT token**
- Failed actions are logged and do not crash the system

---

## 🐛 Troubleshooting

### **Problem:** Lockdown toggle doesn't work
**Solution:** 
- Check browser console for errors
- Verify backend server is running
- Check admin token is valid
- Review Network tab for failed requests

### **Problem:** Export downloads empty file
**Solution:**
- Ensure database has data
- Check backend console for errors
- Verify MongoDB connection

### **Problem:** Report generation fails
**Solution:**
- Check database connection
- Ensure sufficient data exists
- Review backend logs for aggregation errors

---

## 🎓 Technical Architecture

```
┌─────────────────────────────────────────┐
│     Emergency Control Panel (UI)       │
│  - EmergencyPanel.js                    │
│  - React Hooks (useState, useEffect)    │
└──────────────┬──────────────────────────┘
               │
               │ API Calls (emergencyAPI)
               ▼
┌─────────────────────────────────────────┐
│     Frontend API Layer (api.js)         │
│  - emergencyAPI.toggleLockdown()        │
│  - emergencyAPI.exportUsers()           │
│  - emergencyAPI.generateReport()        │
│  - emergencyAPI.getStats()              │
└──────────────┬──────────────────────────┘
               │
               │ HTTP Requests (JWT Auth)
               ▼
┌─────────────────────────────────────────┐
│   Backend Routes                        │
│  - emergencyControlRoutes.js            │
│  - adminAuth middleware                 │
└──────────────┬──────────────────────────┘
               │
               │ Database Operations
               ▼
┌─────────────────────────────────────────┐
│   MongoDB Collections                   │
│  - emergencycontrols                    │
│  - users                                │
│  - loginlocations                       │
│  - securityalerts                       │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist for Production

Before deploying to production:

- [ ] Test system lockdown with real users
- [ ] Verify data export includes all necessary fields
- [ ] Review report recommendations logic
- [ ] Set up automated report generation schedule
- [ ] Document emergency response procedures
- [ ] Train administrators on proper usage
- [ ] Set up alerts for lockdown activations
- [ ] Configure backup storage for exports
- [ ] Test with large datasets (performance)
- [ ] Implement rate limiting for export endpoints
- [ ] Add email notifications for lockdown events
- [ ] Create runbook for emergency scenarios

---

**Last Updated:** October 11, 2024  
**Version:** 1.0  
**System:** Aegis Digital ID System  
**Author:** Admin Development Team

