# 🔌 Firebase Connection Troubleshooting Guide

## Overview
This guide helps resolve the "FirebaseError: Failed to get document because the client is offline" error that can affect data persistence in the Repair Shop Inventory system.

## 🔍 Common Causes

### 1. **Network Connectivity Issues**
- **Browser offline**: Check if your browser shows as offline
- **Internet connection**: Verify your internet connection is working
- **Firewall/Proxy**: Corporate networks may block Firebase connections

### 2. **Firebase Project Configuration**
- **Project disabled**: Firebase project might be paused or disabled
- **Billing issues**: Firebase project might have billing problems
- **Region restrictions**: Some regions may have access restrictions

### 3. **Firestore Rules**
- **Security rules**: Firestore security rules might be blocking access
- **Authentication**: User might not be properly authenticated
- **Permissions**: User might not have read/write permissions

### 4. **Browser Issues**
- **Cache problems**: Browser cache might be corrupted
- **Extensions**: Browser extensions might be interfering
- **Security policies**: Browser security settings might be blocking connections

## 🛠️ Troubleshooting Steps

### Step 1: Check Connection Status
Look at the connection indicator in the header:
- 🟢 **Green (Online)**: Connection is working
- 🔴 **Red (Offline)**: Connection is down
- 🟡 **Yellow (Connecting)**: Attempting to connect
- 🟣 **Purple (Error)**: Connection error detected

### Step 2: Browser Network Check
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for failed requests to Firebase domains
5. Check if any requests are blocked

### Step 3: Firebase Console Check
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Check project status and billing
4. Verify Firestore database is enabled
5. Check authentication methods

### Step 4: Firestore Rules Check
1. In Firebase Console, go to Firestore Database
2. Click on "Rules" tab
3. Ensure rules allow read/write for authenticated users
4. Test rules with the Rules Playground

### Step 5: Authentication Check
1. Check if user is properly signed in
2. Verify user has correct permissions
3. Try signing out and back in
4. Check browser console for auth errors

## 🔧 Quick Fixes

### Fix 1: Refresh and Retry
```javascript
// In browser console
window.resetFirestoreConnection();
```

### Fix 2: Clear Browser Cache
1. Clear browser cache and cookies
2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Try in incognito/private mode

### Fix 3: Check Network Status
```javascript
// In browser console
console.log('Browser online:', navigator.onLine);
console.log('Firebase ready:', window.firebaseReady);
console.log('Auth user:', window.auth?.currentUser);
```

### Fix 4: Force Local Storage Mode
If cloud sync continues to fail, the system will automatically fall back to localStorage:
```javascript
// In browser console
window.loadDataFromLocal();
```

## 📱 Testing Connection

### Use the Debug Page
1. Open `debug-pickdrop-repair.html` in another tab
2. Use the connection testing tools
3. Monitor console logs for detailed error information

### Manual Connection Test
```javascript
// In browser console
if (window.checkFirestoreConnection) {
    window.checkFirestoreConnection().then(result => {
        console.log('Connection test result:', result);
    }).catch(error => {
        console.error('Connection test failed:', error);
    });
}
```

## 🚨 Emergency Procedures

### If All Else Fails
1. **Export your data** using the debug tools
2. **Clear all data** and start fresh
3. **Check Firebase project status** in console
4. **Contact support** with error details

### Data Export
```javascript
// In browser console
const data = {
    pickDrops: window.pickDrops,
    repairs: window.repairs,
    customers: window.customers,
    inventory: window.inventory
};
console.log('Current data:', data);
// Copy this data to a safe location
```

## 🔄 Prevention

### Best Practices
1. **Regular backups**: Export data periodically
2. **Monitor connection**: Watch the status indicator
3. **Test regularly**: Use debug tools to verify functionality
4. **Keep updated**: Ensure browser and Firebase SDK are current

### Connection Monitoring
The system automatically:
- Monitors network status
- Detects connection failures
- Falls back to localStorage when needed
- Attempts to reconnect automatically
- Validates data consistency

## 📞 Getting Help

### Debug Information to Collect
1. **Browser console logs** (F12 → Console)
2. **Network tab information** (F12 → Network)
3. **Connection status** from header indicator
4. **Firebase error messages**
5. **Steps to reproduce** the issue

### Support Channels
- Check this troubleshooting guide first
- Review Firebase documentation
- Check browser compatibility
- Verify network connectivity
- Test in different browsers/environments

## ✅ Success Indicators

You'll know the connection is working when:
- 🟢 Status indicator shows green "Connected"
- Data saves and loads properly
- No console errors about offline clients
- Pick & drop status updates persist after refresh
- Repairs are properly linked to pick & drops

---

**Remember**: The system is designed to work offline using localStorage as a fallback. Your data is safe even when cloud sync fails.
