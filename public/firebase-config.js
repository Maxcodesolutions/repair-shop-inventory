// Firebase Configuration Utility
// This file provides helper functions for Firebase operations
// Firebase initialization is handled by firebase-global.js

console.log('🔧 Firebase Config: Loading utility functions...');

// Wait for Firebase to be ready
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseReady && window.db && window.auth) {
            resolve();
        } else {
            window.addEventListener('firebaseReady', resolve);
        }
    });
}

// Data management utility class
class DataManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = false;
    }

    // Initialize data manager
    async init() {
        try {
            await waitForFirebase();
            
            // Check if Firebase is available
            if (!window.auth) {
                console.error('🔧 Firebase Config: Firebase not available. Please ensure Firebase is initialized correctly.');
                this.isOnline = false;
                return;
            }

            this.isOnline = true;
            console.log('🔧 Firebase Config: Data manager initialized with Firebase');
            
        } catch (error) {
            console.error('🔧 Firebase Config: Initialization error:', error);
            this.isOnline = false;
        }
    }

    // Check if Firebase is available
    isFirebaseAvailable() {
        return window.firebaseReady && window.db && window.auth;
    }

    // Get current user
    getCurrentUser() {
        return window.auth?.currentUser || null;
    }

    // Save data to server
    async saveDataToServer(collectionName, data, documentId = null) {
        if (!this.isFirebaseAvailable()) {
            console.error('🔧 Firebase Config: Firebase not available, cannot save data.');
            return false;
        }

        try {
            // Ensure we have a valid collection name
            if (!collectionName || typeof collectionName !== 'string') {
                throw new Error('Invalid collection name provided');
            }

            // Use provided document ID or generate one
            const docId = documentId || 'default';
            
            // Create proper document reference
            const collectionRef = window.collection(window.db, collectionName);
            const docRef = window.doc(collectionRef, docId);
            
            // Add metadata to the data
            const dataWithMetadata = {
                ...data,
                lastUpdated: new Date().toISOString(),
                updatedBy: this.getCurrentUser()?.email || 'unknown'
            };
            
            await window.setDoc(docRef, dataWithMetadata, { merge: true });
            console.log(`🔧 Firebase Config: Data saved to server successfully in collection: ${collectionName}, document: ${docId}`);
            return true;
        } catch (error) {
            console.error('🔧 Firebase Config: Error saving to server:', error);
            return false;
        }
    }

    // Load data from server
    async loadDataFromServer(collectionName, documentId = null) {
        if (!this.isFirebaseAvailable()) {
            console.error('🔧 Firebase Config: Firebase not available, cannot load data.');
            return null;
        }

        try {
            // Ensure we have a valid collection name
            if (!collectionName || typeof collectionName !== 'string') {
                throw new Error('Invalid collection name provided');
            }

            // Use provided document ID or default
            const docId = documentId || 'default';
            
            // Create proper document reference
            const collectionRef = window.collection(window.db, collectionName);
            const docRef = window.doc(collectionRef, docId);
            
            const docSnap = await window.getDoc(docRef);
            
            if (docSnap.exists()) {
                console.log(`🔧 Firebase Config: Data loaded from server successfully from collection: ${collectionName}, document: ${docId}`);
                return docSnap.data();
            } else {
                console.log(`🔧 Firebase Config: No data found on server in collection: ${collectionName}, document: ${docId}`);
                return null;
            }
        } catch (error) {
            console.error('🔧 Firebase Config: Error loading from server:', error);
            return null;
        }
    }

    // Save user-specific data
    async saveUserData(dataType, data) {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('🔧 Firebase Config: No user authenticated, cannot save user data.');
            return false;
        }

        return await this.saveDataToServer('users', { [dataType]: data }, user.uid);
    }

    // Load user-specific data
    async loadUserData(dataType) {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('🔧 Firebase Config: No user authenticated, cannot load user data.');
            return null;
        }

        const userData = await this.loadDataFromServer('users', user.uid);
        return userData ? userData[dataType] : null;
    }

    // Save all application data for current user
    async saveAllAppData(appData) {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('🔧 Firebase Config: No user authenticated, cannot save app data.');
            return false;
        }

        try {
            const userDocRef = window.doc(window.collection(window.db, 'users'), user.uid);
            const dataWithMetadata = {
                ...appData,
                lastUpdated: new Date().toISOString(),
                updatedBy: user.email,
                domain: window.location.hostname
            };
            
            await window.setDoc(userDocRef, dataWithMetadata, { merge: true });
            console.log('🔧 Firebase Config: All app data saved to server successfully');
            return true;
        } catch (error) {
            console.error('🔧 Firebase Config: Error saving all app data:', error);
            return false;
        }
    }

    // Load all application data for current user
    async loadAllAppData() {
        const user = this.getCurrentUser();
        if (!user) {
            console.error('🔧 Firebase Config: No user authenticated, cannot load app data.');
            return null;
        }

        try {
            const userDocRef = window.doc(window.collection(window.db, 'users'), user.uid);
            const docSnap = await window.getDoc(userDocRef);
            
            if (docSnap.exists()) {
                console.log('🔧 Firebase Config: All app data loaded from server successfully');
                return docSnap.data();
            } else {
                console.log('🔧 Firebase Config: No user app data found on server');
                return null;
            }
        } catch (error) {
            console.error('🔧 Firebase Config: Error loading all app data:', error);
            return null;
        }
    }
}

// Create global data manager instance
window.dataManager = new DataManager();

// Initialize when Firebase is ready
window.addEventListener('firebaseReady', () => {
    console.log('🔧 Firebase Config: Firebase ready, initializing data manager...');
    window.dataManager.init();
});

console.log('🔧 Firebase Config: Utility functions loaded'); 