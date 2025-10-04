# 🧪 Location Testing Guide

## Testing Real Locations on Localhost

### Method 1: **Seed Test Data** (Quickest!)

Run the seeding script to create sample data from around the world:

```bash
cd server
node scripts/seedLocations.js
```

**This will create:**
- ✅ 12 cities across the world
- ✅ 100+ login records
- ✅ Realistic data with different devices
- ✅ Random timestamps over last 30 days

**Cities included:**
- 🇦🇺 Melbourne, Sydney
- 🇺🇸 New York, Toronto
- 🇬🇧 London
- 🇯🇵 Tokyo
- 🇸🇬 Singapore
- 🇦🇪 Dubai
- 🇫🇷 Paris
- 🇮🇳 Mumbai
- 🇩🇪 Berlin
- 🇧🇷 São Paulo

**After running:**
1. Go to Admin Dashboard → Location Map
2. Refresh the page
3. See all locations on the world map! 🌍

---

### Method 2: **Use VPN** (Real Testing)

Test with actual different IP addresses:

1. **Install a VPN:**
   - ProtonVPN (free)
   - NordVPN
   - ExpressVPN
   - Any VPN service

2. **Connect to different countries:**
   ```
   Example:
   - Connect to UK server
   - Login to your app
   - See London appear on map
   
   - Connect to US server
   - Login again
   - See New York appear on map
   ```

3. **Each VPN location creates a real pin!**

---

### Method 3: **Manual MongoDB Insert**

Insert specific locations manually:

```javascript
use aegis

db.loginlocations.insertOne({
  userId: ObjectId("your-user-id"),
  location: {
    type: "Point",
    coordinates: [151.2093, -33.8688] // Sydney
  },
  ipAddress: "203.123.45.67",
  city: "Sydney",
  region: "New South Wales",
  country: "Australia",
  countryCode: "AU",
  timezone: "Australia/Sydney",
  deviceInfo: {
    type: "Mozilla/5.0",
    browser: "Chrome",
    os: "Windows",
    device: "Desktop"
  },
  status: "success",
  loginType: "login",
  loginTime: new Date()
})
```

---

### Method 4: **Deploy to Production**

Deploy your app to a live server:

1. **Deploy backend** (Heroku, Railway, DigitalOcean)
2. **Deploy frontend** (Vercel, Netlify)
3. **Share the link** with friends in different countries
4. **See real locations** as they login!

---

## 🧹 Clear Test Data

To remove all test location data:

```bash
cd server
node scripts/clearLocations.js
```

This will delete all login location records from the database.

---

## 📊 What You'll See

After seeding data, your Location Map will show:

**Interactive World Map:**
- 🟢 Green pins = High activity (10+ logins)
- 🟡 Yellow pins = Medium activity (5-9 logins)
- 🔵 Blue pins = Low activity (<5 logins)
- 🔴 Red pins = Suspicious (<3 logins)

**Click any pin to see:**
- City and country
- Total login count
- Number of unique users
- Status badge
- Last login time

**Recent Activity List:**
- Last 10 locations
- Login counts
- Timestamps
- Coordinates

**Top 3 Locations:**
- Busiest cities
- Login counts displayed

---

## 🎯 Recommended Testing Flow

### Step 1: Clear existing data (optional)
```bash
node scripts/clearLocations.js
```

### Step 2: Seed test data
```bash
node scripts/seedLocations.js
```

### Step 3: View results
1. Open Admin Dashboard
2. Go to "Location Map" tab
3. See all locations on the map!

### Step 4: Test real logins
- Logout and login again
- Your location will be added
- Refresh the map to see it

### Step 5: Test with VPN (optional)
- Connect to different countries
- Login from each
- See multiple locations

---

## 🔧 Customize Seed Data

Edit `server/scripts/seedLocations.js` to add your own locations:

```javascript
{
    city: 'Your City',
    region: 'Your Region',
    country: 'Your Country',
    countryCode: 'XX',
    coordinates: [longitude, latitude],
    timezone: 'Your/Timezone',
    count: 10  // Number of logins to create
}
```

**Find coordinates:**
- Use https://www.latlong.net/
- Or Google Maps (right-click → coordinates)

---

## 🐛 Troubleshooting

### No locations showing up?
1. Check MongoDB is running
2. Run the seed script
3. Refresh the Admin Dashboard
4. Check browser console for errors

### Pins at wrong location?
1. Coordinates are [longitude, latitude] (not lat, lng)
2. Check coordinates in seed script
3. Verify database records

### Can't run seed script?
1. Make sure you're in server directory
2. Check `.env` file exists
3. Verify MongoDB connection string
4. Run `npm install` first

---

## 📝 Summary

**Easiest way to test:**
```bash
cd server
node scripts/seedLocations.js
```

Then open Admin Dashboard → Location Map tab!

You'll see a beautiful world map with pins showing login activity from around the globe! 🌍✨

---

## 🚀 Production Behavior

In production (with real IPs):
- ✅ Automatic location detection
- ✅ Real cities and countries
- ✅ Accurate coordinates
- ✅ No manual seeding needed

The seeding script is **only for testing on localhost**. In production, locations are captured automatically from user IP addresses! 🎉

