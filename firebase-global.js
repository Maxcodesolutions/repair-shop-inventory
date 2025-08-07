// Firebase Global Initialization Script
// This script ensures Firebase functions are properly exposed to the global scope

console.log('Firebase Global: Starting initialization...');

// Initialize Firebase using ES6 modules and expose globally
async function initializeFirebaseGlobal() {
    try {
        // Import Firebase modules
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js");
        const { getFirestore, collection, doc, setDoc, getDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js");
        const { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js");

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

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const auth = getAuth(app);

        // Expose functions globally
        window.db = db;
        window.auth = auth;
        window.collection = collection;
        window.doc = doc;
        window.setDoc = setDoc;
        window.getDoc = getDoc;
        window.deleteDoc = deleteDoc;
        window.onAuthStateChanged = onAuthStateChanged;
        window.signInAnonymously = signInAnonymously;
        window.signInWithEmailAndPassword = signInWithEmailAndPassword;
        window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
        window.signOut = signOut;

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
