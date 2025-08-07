// Firebase Global Initialization Script
// This script ensures Firebase functions are properly exposed to the global scope

console.log('Firebase Global: Starting initialization...');

// Load Firebase SDKs using script tags to ensure global availability
function loadFirebaseScripts() {
    return new Promise((resolve, reject) => {
        // Check if Firebase is already loaded
        if (window.firebase) {
            console.log('Firebase Global: Firebase already loaded');
            resolve();
            return;
        }

        // Load Firebase App
        const appScript = document.createElement('script');
        appScript.src = 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
        appScript.onload = () => {
            console.log('Firebase Global: App SDK loaded');
            
            // Load Firestore
            const firestoreScript = document.createElement('script');
            firestoreScript.src = 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
            firestoreScript.onload = () => {
                console.log('Firebase Global: Firestore SDK loaded');
                
                // Load Auth
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
                authScript.onload = () => {
                    console.log('Firebase Global: Auth SDK loaded');
                    resolve();
                };
                authScript.onerror = reject;
                document.head.appendChild(authScript);
            };
            firestoreScript.onerror = reject;
            document.head.appendChild(firestoreScript);
        };
        appScript.onerror = reject;
        document.head.appendChild(appScript);
    });
}

// Initialize Firebase with global functions
async function initializeFirebaseGlobal() {
    try {
        await loadFirebaseScripts();
        
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCvuJuOlhqasNbpCkyJjOH1YKJKnjvxLvk",
            authDomain: "repair-shop-inventory.firebaseapp.com",
            projectId: "repair-shop-inventory",
            storageBucket: "repair-shop-inventory.firebasestorage.app",
            messagingSenderId: "91629691464",
            appId: "1:91629691464:web:d20cabddb6dcbf755dee7d",
            measurementId: "G-K78PVPW0MG"
        };

        // Initialize Firebase using global firebase object
        const app = firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore(app);
        const auth = firebase.auth(app);

        // Expose functions globally
        window.db = db;
        window.auth = auth;
        window.collection = db.collection.bind(db);
        window.doc = db.doc.bind(db);
        window.setDoc = db.setDoc.bind(db);
        window.getDoc = db.getDoc.bind(db);
        window.onAuthStateChanged = auth.onAuthStateChanged.bind(auth);
        window.signInAnonymously = auth.signInAnonymously.bind(auth);
        window.signInWithEmailAndPassword = auth.signInWithEmailAndPassword.bind(auth);
        window.createUserWithEmailAndPassword = auth.createUserWithEmailAndPassword.bind(auth);
        window.signOut = auth.signOut.bind(auth);

        // Signal that Firebase is ready
        window.firebaseReady = true;
        window.firebaseConfig = firebaseConfig;

        console.log('Firebase Global: ✅ Firebase initialized successfully');
        console.log('Firebase Global: Available functions:', {
            db: !!window.db,
            auth: !!window.auth,
            collection: !!window.collection,
            doc: !!window.doc,
            setDoc: !!window.setDoc,
            getDoc: !!window.getDoc
        });

        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('firebaseReady'));

    } catch (error) {
        console.error('Firebase Global: ❌ Error initializing Firebase:', error);
        throw error;
    }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebaseGlobal);
} else {
    initializeFirebaseGlobal();
}

// Export for manual initialization
window.initializeFirebaseGlobal = initializeFirebaseGlobal;
