// Firebase Initialization Check Script
// This script ensures Firebase is properly loaded and available before the main app starts

console.log('Firebase Init Check: Starting...');

// Function to check if Firebase is properly initialized
function checkFirebaseInit() {
    console.log('Firebase Init Check: Checking Firebase availability...');
    
    const checks = {
        'window.db': !!window.db,
        'window.auth': !!window.auth,
        'window.collection': !!window.collection,
        'window.doc': !!window.doc,
        'window.setDoc': !!window.setDoc,
        'window.getDoc': !!window.getDoc,
        'window.onAuthStateChanged': !!window.onAuthStateChanged
    };
    
    console.log('Firebase Init Check: Status:', checks);
    
    const allAvailable = Object.values(checks).every(Boolean);
    
    if (allAvailable) {
        console.log('Firebase Init Check: ✅ All Firebase functions available');
        return true;
    } else {
        console.log('Firebase Init Check: ❌ Some Firebase functions missing');
        console.log('Missing functions:', Object.keys(checks).filter(key => !checks[key]));
        return false;
    }
}

// Function to wait for Firebase to be ready
function waitForFirebase(maxAttempts = 10) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
            attempts++;
            console.log(`Firebase Init Check: Attempt ${attempts}/${maxAttempts}`);
            
            if (checkFirebaseInit()) {
                clearInterval(checkInterval);
                console.log('Firebase Init Check: ✅ Firebase ready');
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.log('Firebase Init Check: ❌ Firebase not ready after max attempts');
                reject(new Error('Firebase initialization timeout'));
            }
        }, 500); // Check every 500ms
    });
}

// Function to initialize Firebase if not already available
function ensureFirebaseAvailable() {
    if (checkFirebaseInit()) {
        console.log('Firebase Init Check: Firebase already available');
        return Promise.resolve(true);
    }
    
    console.log('Firebase Init Check: Waiting for Firebase to be ready...');
    return waitForFirebase();
}

// Listen for Firebase ready event
window.addEventListener('firebaseReady', () => {
    console.log('Firebase Init Check: Received firebaseReady event');
    checkFirebaseInit();
});

// Export functions for use in other scripts
window.checkFirebaseInit = checkFirebaseInit;
window.waitForFirebase = waitForFirebase;
window.ensureFirebaseAvailable = ensureFirebaseAvailable;

// Auto-check after a short delay
setTimeout(() => {
    console.log('Firebase Init Check: Auto-checking Firebase status...');
    checkFirebaseInit();
}, 1000);

console.log('Firebase Init Check: Script loaded');

