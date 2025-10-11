# Universal Modal Component - Usage Guide

## Overview
Single, reusable modal component for the entire application with customizable colors, icons, and content.

---

## Import

```javascript
import Modal, { ConfirmModal, SuccessModal } from './Components/common/Modal';
```

---

## Basic Usage

### 1. **Info Modal** (Default)
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Information"
  type="info"
>
  <p>Your content here</p>
</Modal>
```

### 2. **Success Modal**
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Success"
  type="success"
>
  <p>Operation completed successfully!</p>
</Modal>
```

### 3. **Danger/Error Modal**
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Error"
  type="danger"
>
  <p>Something went wrong!</p>
</Modal>
```

### 4. **Warning Modal**
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Warning"
  type="warning"
>
  <p>Please review this action carefully.</p>
</Modal>
```

### 5. **Lockdown Modal**
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="System Lockdown"
  subtitle="Security Protocol Active"
  type="lockdown"
  fullHeader={true}
  showClose={false}
>
  <p>System is in lockdown mode.</p>
</Modal>
```

### 6. **Security Modal**
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Security Alert"
  type="security"
  fullHeader={true}
>
  <p>Suspicious activity detected.</p>
</Modal>
```

---

## Available Types

| Type | Use Case | Color | Icon |
|------|----------|-------|------|
| `info` | General information | Blue | Info circle |
| `success` | Success messages | Green | Check circle |
| `danger` | Errors, critical actions | Red | Alert triangle |
| `warning` | Warnings, cautions | Amber | Alert triangle |
| `lockdown` | System lockdown | Red | Lock |
| `security` | Security alerts | Slate/Gray | Shield |

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | - | Controls modal visibility |
| `onClose` | function | - | Called when modal is closed |
| `title` | string | - | Modal title |
| `subtitle` | string | - | Optional subtitle (for fullHeader) |
| `children` | ReactNode | - | Modal content |
| `type` | string | `'info'` | Modal type (info/success/danger/warning/lockdown/security) |
| `showClose` | boolean | `true` | Show close button |
| `customIcon` | ReactNode | - | Custom icon (overrides type icon) |
| `fullHeader` | boolean | `false` | Use full gradient header with larger icons |

---

## Advanced Usage

### Full Header with Subtitle
```javascript
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="System Lockdown"
  subtitle="Security Protocol Active"
  type="lockdown"
  fullHeader={true}
>
  <div className="space-y-4">
    <p>Content with styled header</p>
  </div>
</Modal>
```

### Custom Icon
```javascript
import { Database } from 'lucide-react';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Database Backup"
  type="info"
  customIcon={<Database className="w-6 h-6 text-blue-600" />}
>
  <p>Backup in progress...</p>
</Modal>
```

### No Close Button (Force Action)
```javascript
<Modal
  isOpen={showModal}
  onClose={() => {}}
  title="Required Action"
  type="warning"
  showClose={false}
>
  <div>
    <p>You must complete this action.</p>
    <button onClick={handleAction}>Proceed</button>
  </div>
</Modal>
```

---

## Helper Components

### ConfirmModal
Pre-styled confirmation modal with cancel/confirm buttons.

```javascript
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Account"
  message="Are you sure you want to delete your account? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  type="danger"
  loading={isDeleting}
/>
```

**Props:**
- All Modal props
- `onConfirm`: Function called when confirm button is clicked
- `message`: Optional message text
- `confirmText`: Confirm button text (default: "Confirm")
- `cancelText`: Cancel button text (default: "Cancel")
- `loading`: Show loading state (default: false)
- `disabled`: Disable confirm button (default: false)

### SuccessModal
Pre-styled success modal with centered icon and action button.

```javascript
<SuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Account Created"
  message="Your account has been successfully created. You can now log in."
/>
```

---

## Complete Examples

### Example 1: Data Export
```javascript
const [showExportModal, setShowExportModal] = useState(false);
const [exporting, setExporting] = useState(false);

const handleExport = async () => {
  setExporting(true);
  await exportData();
  setExporting(false);
  setShowExportModal(false);
};

<ConfirmModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  onConfirm={handleExport}
  title="Export User Data"
  type="info"
  confirmText="Download"
  loading={exporting}
>
  <div className="space-y-3">
    <p>This will download all user data in JSON format.</p>
    <div className="bg-blue-50 p-3 rounded">
      <p className="text-sm text-blue-800">
        Export includes: profiles, documents, permissions
      </p>
    </div>
  </div>
</ConfirmModal>
```

### Example 2: System Lockdown Warning
```javascript
const [showLockdownModal, setShowLockdownModal] = useState(false);
const [reason, setReason] = useState('');

<Modal
  isOpen={showLockdownModal}
  onClose={() => setShowLockdownModal(false)}
  title="Activate System Lockdown"
  subtitle="Critical Security Action"
  type="lockdown"
  fullHeader={true}
>
  <div className="space-y-4">
    <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
      <p className="text-sm text-red-900 font-semibold mb-2">
        This action will immediately:
      </p>
      <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
        <li>Lock down the entire system</li>
        <li>Force logout ALL active users</li>
        <li>Disable all user logins</li>
      </ul>
    </div>
    
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Reason for Lockdown
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-4 py-3 border rounded-lg"
        rows="3"
        placeholder="e.g., Security breach detected..."
      />
    </div>

    <div className="flex gap-3">
      <button
        onClick={() => setShowLockdownModal(false)}
        className="flex-1 px-4 py-2 border rounded-lg"
      >
        Cancel
      </button>
      <button
        onClick={handleLockdown}
        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Activate Lockdown
      </button>
    </div>
  </div>
</Modal>
```

### Example 3: Success with Action
```javascript
<SuccessModal
  isOpen={showSuccess}
  onClose={() => {
    setShowSuccess(false);
    navigate('/dashboard');
  }}
  title="Registration Complete"
  message="Your account has been created successfully. Welcome to Aegis!"
/>
```

---

## Styling Tips

### Content Structure
```javascript
<Modal {...props}>
  <div className="space-y-4">
    {/* Info box */}
    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
      <p>Important information</p>
    </div>

    {/* Details section */}
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-sm text-slate-700">Details here</p>
    </div>

    {/* Actions */}
    <div className="flex gap-3 pt-2">
      <button className="flex-1 ...">Cancel</button>
      <button className="flex-1 ...">Confirm</button>
    </div>
  </div>
</Modal>
```

### Color Boxes by Type
```javascript
// Info (Blue)
<div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">

// Success (Green)
<div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">

// Danger (Red)
<div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">

// Warning (Amber)
<div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded">
```

---

## Icons

Use `lucide-react` icons throughout:

```javascript
import { 
  Lock, Shield, AlertTriangle, CheckCircle, 
  Info, AlertCircle, Database, Users, FileText 
} from 'lucide-react';
```

**Common icon sizes:**
- Small: `w-4 h-4`
- Medium: `w-5 h-5`
- Large: `w-6 h-6`
- Extra Large: `w-8 h-8`

---

## Best Practices

1. Use `type` prop to match the context (success/danger/warning/info)
2. Use `fullHeader={true}` for important system-level actions (lockdown, security)
3. Always provide clear, actionable content
4. Use icons from `lucide-react` (no emojis)
5. Set `showClose={false}` when user must take action
6. Use `ConfirmModal` for destructive actions
7. Use `SuccessModal` for positive feedback
8. Keep titles short and descriptive
9. Use colored info boxes for important details
10. Maintain consistent spacing with `space-y-*` classes

