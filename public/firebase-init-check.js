// Firebase Initialization Check Script
// Simple status checker for Firebase availability

console.log('🔍 Firebase Init Check: Loading status checker...');

// Function to check Firebase status
function checkFirebaseStatus() {
    const status = {
        'Firebase Ready': !!window.firebaseReady,
        'Database': !!window.db,
        'Authentication': !!window.auth,
        'Analytics': !!window.analytics,
        'Collection Function': !!window.collection,
        'Doc Function': !!window.doc,
        'SetDoc Function': !!window.setDoc,
        'GetDoc Function': !!window.getDoc
    };
    
    console.log('🔍 Firebase Init Check: Status:', status);
    
    const allAvailable = Object.values(status).every(Boolean);
    
    if (allAvailable) {
        console.log('🔍 Firebase Init Check: ✅ All Firebase services available');
    } else {
        console.log('🔍 Firebase Init Check: ⚠️ Some Firebase services missing');
        const missing = Object.keys(status).filter(key => !status[key]);
        console.log('🔍 Firebase Init Check: Missing:', missing);
    }
    
    return status;
}

// Function to wait for Firebase (with timeout)
function waitForFirebase(timeout = 15000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
            if (window.firebaseReady && window.db && window.auth) {
                clearInterval(checkInterval);
                console.log('🔍 Firebase Init Check: ✅ Firebase ready');
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                console.log('🔍 Firebase Init Check: ❌ Timeout waiting for Firebase');
                reject(new Error('Firebase initialization timeout'));
            }
        }, 500);
    });
}

// Listen for Firebase ready event
window.addEventListener('firebaseReady', () => {
    console.log('🔍 Firebase Init Check: Received firebaseReady event');
    checkFirebaseStatus();
});

// Export functions for use in other scripts
window.checkFirebaseStatus = checkFirebaseStatus;
window.waitForFirebase = waitForFirebase;

// Auto-check with better timing - wait longer for Firebase to initialize
setTimeout(() => {
    console.log('🔍 Firebase Init Check: Auto-checking Firebase status...');
    checkFirebaseStatus();
    
    // If Firebase is still not ready, wait for it
    if (!window.firebaseReady) {
        console.log('🔍 Firebase Init Check: Firebase not ready yet, waiting...');
        waitForFirebase().then(() => {
            console.log('🔍 Firebase Init Check: Firebase became ready, checking status...');
            checkFirebaseStatus();
        }).catch((error) => {
            console.error('🔍 Firebase Init Check: Failed to wait for Firebase:', error);
            // Try to initialize Firebase manually if it failed
            if (window.initializeFirebase) {
                console.log('🔍 Firebase Init Check: Attempting manual initialization...');
                window.initializeFirebase();
            }
        });
    }
}, 5000); // Increased from 2000ms to 5000ms

console.log('🔍 Firebase Init Check: Status checker loaded');



