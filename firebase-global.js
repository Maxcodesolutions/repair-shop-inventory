// Firebase Global Initialization Script
// Single, clean Firebase initialization to avoid conflicts and QUIC protocol errors

console.log('🔥 Firebase Global: Starting clean initialization...');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCvuJuOlhqasNbpCkyJjOH1YKJKnjvxLvk",
    authDomain: "repair-shop-inventory.firebaseapp.com",
    projectId: "repair-shop-inventory",
    storageBucket: "repair-shop-inventory.appspot.com",
    messagingSenderId: "91629691464",
    appId: "1:91629691464:web:d20cabddb6dcbf755dee7d",
    measurementId: "G-K78PVPW0MG"
};

// Global Firebase variables
let app, db, auth, analytics;
let isInitializing = false;
let isInitialized = false;
let retryCount = 0;
const maxRetries = 3;
let connectionRetryInterval = null;

// Initialize Firebase with error handling and retry logic
async function initializeFirebase() {
    if (isInitializing || isInitialized) {
        console.log('🔥 Firebase Global: Already initializing or initialized');
        return;
    }

    isInitializing = true;
    console.log(`🔥 Firebase Global: Attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    try {
        console.log('🔥 Firebase Global: Importing Firebase modules...');
        
        // Import Firebase modules
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js");
        const { getFirestore, collection: firestoreCollection, doc: firestoreDoc, setDoc: firestoreSetDoc, getDoc: firestoreGetDoc, connectFirestoreEmulator } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
        const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, connectAuthEmulator } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js");
        const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js");

        console.log('🔥 Firebase Global: Modules imported, initializing app...');
        
        // Initialize Firebase app
        app = initializeApp(firebaseConfig);
        
        // Initialize services
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Initialize analytics (optional, won't break if it fails)
        try {
            analytics = getAnalytics(app);
            console.log('🔥 Firebase Global: Analytics initialized');
        } catch (analyticsError) {
            console.log('🔥 Firebase Global: Analytics not available (development mode)');
        }

        // Expose Firebase services globally
        window.app = app;
        window.db = db;
        window.auth = auth;
        window.analytics = analytics;
        window.firebaseConfig = firebaseConfig;
        window.firebaseReady = true;
        window.isInitialized = true;

        // Expose commonly used functions directly (not async)
        window.collection = (db, collectionPath) => firestoreCollection(db, collectionPath);
        if (!window._originalCollection) {
            window._originalCollection = window.collection;
            window.collection = function(db, collectionPath) {
                if (!collectionPath || typeof collectionPath !== 'string' || collectionPath.trim().length === 0) {
                    console.error("❌ Invalid collection path (global patch):", collectionPath);
                    return null;
                }
                return window._originalCollection(db, collectionPath);
            };
        }
        window.doc = (collectionRef, documentId) => firestoreDoc(collectionRef, documentId);
        window.setDoc = (docRef, data, options) => firestoreSetDoc(docRef, data, options);
        window.getDoc = (docRef) => firestoreGetDoc(docRef);
        window.onSnapshot = (...args) => (await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js")).then(m => m.onSnapshot(...args));
        
        // Expose auth functions properly bound to the auth object
        window.onAuthStateChanged = (callback) => onAuthStateChanged(auth, callback);
        window.signInWithEmailAndPassword = signInWithEmailAndPassword;
        window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
        window.signOut = signOut;

        // Add connection health monitoring
        window.checkFirestoreConnection = () => {
            try {
                // Test basic Firestore operations
                const testCollection = firestoreCollection(db, '_test_connection');
                const testDoc = firestoreDoc(testCollection, 'test');
                return {
                    status: 'connected',
                    db: !!db,
                    auth: !!auth,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        };

        // Add offline detection
        window.checkOnlineStatus = () => {
            const isOnline = navigator.onLine;
            const hasFirebase = !!window.firebaseReady;
            const hasAuth = !!window.auth;
            const hasDb = !!window.db;
            
            return {
                browserOnline: isOnline,
                firebaseReady: hasFirebase,
                authAvailable: hasAuth,
                dbAvailable: hasDb,
                timestamp: new Date().toISOString()
            };
        };

        // Add connection reset functionality
        window.resetFirestoreConnection = async () => {
            try {
                console.log('🔥 Firebase Global: Resetting Firestore connection...');
                
                // Clear any existing connections
                if (connectionRetryInterval) {
                    clearInterval(connectionRetryInterval);
                    connectionRetryInterval = null;
                }
                
                // Reset state
                isInitialized = false;
                isInitializing = false;
                retryCount = 0;
                
                // Re-initialize
                await initializeFirebase();
                return true;
            } catch (error) {
                console.error('🔥 Firebase Global: Failed to reset connection:', error);
                return false;
            }
        };

        // Add network status monitoring
        window.setupNetworkMonitoring = () => {
            // Monitor online/offline status
            window.addEventListener('online', () => {
                console.log('🔥 Firebase Global: Browser went online, checking Firebase connection...');
                if (window.checkFirestoreConnection) {
                    const status = window.checkFirestoreConnection();
                    console.log('🔥 Firebase Global: Connection status after going online:', status);
                }
            });

            window.addEventListener('offline', () => {
                console.log('🔥 Firebase Global: Browser went offline');
                // Mark Firebase as potentially offline
                window.firebaseOffline = true;
            });

            // Check connection periodically
            setInterval(() => {
                if (window.checkFirestoreConnection) {
                    const status = window.checkFirestoreConnection();
                    if (status.status === 'error') {
                        console.log('🔥 Firebase Global: Periodic connection check failed:', status);
                        window.firebaseOffline = true;
                    } else {
                        window.firebaseOffline = false;
                    }
                }
            }, 30000); // Check every 30 seconds
        };

        console.log('🔥 Firebase Global: ✅ Firebase initialized successfully');
        console.log('🔥 Firebase Global: Services available:', {
            app: !!app,
            db: !!db,
            auth: !!auth,
            analytics: !!analytics,
            collection: !!window.collection,
            doc: !!window.doc,
            setDoc: !!window.setDoc,
            getDoc: !!window.getDoc,
            checkConnection: !!window.checkFirestoreConnection,
            resetConnection: !!window.resetFirestoreConnection
        });

        // Reset retry count on success
        retryCount = 0;
        
        // Clear any connection retry intervals
        if (connectionRetryInterval) {
            clearInterval(connectionRetryInterval);
            connectionRetryInterval = null;
        }
        
        // Setup network monitoring
        window.setupNetworkMonitoring();
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
        isInitialized = true;
        isInitializing = false;

    } catch (error) {
        console.error('🔥 Firebase Global: ❌ Error initializing Firebase:', error);
        isInitializing = false;
        
        // Increment retry count
        retryCount++;
        
        if (retryCount <= maxRetries) {
            // Retry after delay (exponential backoff)
            const delay = Math.min(2000 * Math.pow(2, retryCount - 1), 10000);
            console.log(`🔥 Firebase Global: Retrying initialization in ${delay}ms (attempt ${retryCount}/${maxRetries})...`);
            setTimeout(() => {
                initializeFirebase();
            }, delay);
        } else {
            console.error('🔥 Firebase Global: ❌ Max retries exceeded. Firebase initialization failed.');
            
            // Set up background retry mechanism
            setupBackgroundRetry();
            
            // Dispatch error event
            window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
        }
    }
}

// Background retry mechanism for persistent connection issues
function setupBackgroundRetry() {
    if (connectionRetryInterval) {
        clearInterval(connectionRetryInterval);
    }
    
    console.log('🔥 Firebase Global: Setting up background retry mechanism...');
    
    connectionRetryInterval = setInterval(async () => {
        if (!isInitialized && !isInitializing) {
            console.log('🔥 Firebase Global: Background retry attempt...');
            try {
                await initializeFirebase();
                if (isInitialized) {
                    console.log('🔥 Firebase Global: Background retry successful!');
                    clearInterval(connectionRetryInterval);
                    connectionRetryInterval = null;
                }
            } catch (error) {
                console.log('🔥 Firebase Global: Background retry failed, will try again...');
            }
        }
    }, 30000); // Try every 30 seconds
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    // DOM already loaded, initialize immediately
    initializeFirebase();
}

// Export for manual initialization
window.initializeFirebase = initializeFirebase;

// Health check function
window.checkFirebaseHealth = () => {
    return {
        isInitialized,
        isInitializing,
        retryCount,
        maxRetries,
        connectionRetryActive: !!connectionRetryInterval,
        services: {
            app: !!app,
            db: !!db,
            auth: !!auth,
            analytics: !!analytics,
            collection: !!window.collection,
            doc: !!window.doc,
            setDoc: !!window.setDoc,
            getDoc: !!window.getDoc,
            checkConnection: !!window.checkFirestoreConnection,
            resetConnection: !!window.resetFirestoreConnection
        },
        config: firebaseConfig
    };
};

// Add global error handlers for Firestore connection issues
window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('firestore')) {
        console.warn('🔥 Firebase Global: Firestore error detected, connection may be unstable');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('firestore')) {
        console.warn('🔥 Firebase Global: Firestore promise rejection detected');
        event.preventDefault(); // Prevent the error from being logged
    }
});

console.log('🔥 Firebase Global: Script loaded, waiting for DOM...');
