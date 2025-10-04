# Admin Setup Guide

## Setting up Admin Credentials

The admin credentials are stored securely in environment variables and NOT hardcoded in the application.

### Steps to Configure Admin Account:

1. **Create a `.env` file** in the `server` directory if it doesn't exist.

2. **Add the following environment variables** to your `.env` file:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/aegis

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key_here

# Server Port
PORT=5000

# Admin Credentials (Set your own admin email and password)
ADMIN_EMAIL=admin@aegis.com
ADMIN_PASSWORD=Admin@123
```

3. **Customize the admin credentials** by changing `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your desired values.

4. **Start the server**:
```bash
cd server
node app.js
```

The system will automatically:
- Check if an admin account exists
- Create the admin account if it doesn't exist
- Hash the password securely using bcrypt

### Security Notes:

- ⚠️ **NEVER** commit the `.env` file to version control
- ⚠️ Change the default admin password in production
- ⚠️ Use a strong JWT secret in production
- ⚠️ The password is hashed using bcrypt before storing in the database

### Login Flow:

1. Users can log in using the same login page (`/login`)
2. The system automatically detects if the email belongs to an admin
3. Admin users are redirected to `/AdminDashboard`
4. Regular users are redirected to `/dashboard`

### Changing Admin Password:

To change the admin password:
1. Update `ADMIN_PASSWORD` in the `.env` file
2. Delete the existing admin account from the database
3. Restart the server (it will create a new admin with the updated password)

Or use the admin panel's change password feature after logging in.

