// Cloud Sync Manager for Cross-Domain Data Synchronization
// Automatically syncs Firebase data between repairmaniac.netlify.app and repairmaniac.com

console.log('☁️ Cloud Sync Manager: Loading cross-domain sync solution...');

class CloudSyncManager {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Data types to sync
        this.dataTypes = [
            'inventory', 'customers', 'vendors', 'repairs', 'purchases',
            'outsourceRepairs', 'invoices', 'quotations', 'pickDrops',
            'deliveries', 'payments', 'warranties', 'users', 'settings'
        ];
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('☁️ Cloud Sync Manager: Initializing...');
            
            // Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Set up authentication listener
            this.setupAuthListener();
            
            // Start automatic sync
            this.startAutoSync();
            
            this.isInitialized = true;
            console.log('☁️ Cloud Sync Manager: ✅ Initialized successfully');
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: ❌ Initialization failed:', error);
            this.retryInitialization();
        }
    }

    async waitForFirebase(timeout = 60000) { // Increased from 30s to 60s
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            console.log(`☁️ Cloud Sync Manager: Waiting for Firebase (timeout: ${timeout/1000}s)...`);
            
            const checkInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = timeout - elapsed;
                
                if (window.firebaseReady && window.db && window.auth) {
                    clearInterval(checkInterval);
                    console.log(`☁️ Cloud Sync Manager: ✅ Firebase ready after ${(elapsed/1000).toFixed(1)}s`);
                    
                    // Test Firestore connection before resolving
                    this.testFirestoreConnection().then(() => {
                        resolve(true);
                    }).catch((error) => {
                        console.warn('☁️ Cloud Sync Manager: Firestore connection test failed, but continuing...', error);
                        resolve(true); // Continue anyway, let individual operations handle errors
                    });
                } else if (elapsed > timeout) {
                    clearInterval(checkInterval);
                    console.error(`☁️ Cloud Sync Manager: ❌ Firebase timeout after ${(elapsed/1000).toFixed(1)}s`);
                    console.error('☁️ Cloud Sync Manager: Firebase status:', {
                        firebaseReady: window.firebaseReady,
                        db: !!window.db,
                        auth: !!window.auth,
                        elapsed: `${(elapsed/1000).toFixed(1)}s`
                    });
                    reject(new Error(`Firebase initialization timeout after ${(elapsed/1000).toFixed(1)}s`));
                } else {
                    // Log progress every 10 seconds
                    if (Math.floor(elapsed / 10000) > Math.floor((elapsed - 500) / 10000)) {
                        console.log(`☁️ Cloud Sync Manager: Still waiting for Firebase... (${(remaining/1000).toFixed(1)}s remaining)`);
                    }
                }
            }, 500);
        });
    }

    // Test Firestore connection to detect 400 errors early
    async testFirestoreConnection() {
        try {
            console.log('☁️ Cloud Sync Manager: Testing Firestore connection...');
            
            // Check browser online status first
            if (!navigator.onLine) {
                console.warn('☁️ Cloud Sync Manager: ⚠️ Browser is offline, skipping connection test');
                return false;
            }
            
            // Check if Firebase is marked as offline
            if (window.firebaseOffline) {
                console.warn('☁️ Cloud Sync Manager: ⚠️ Firebase marked as offline, attempting to reset...');
                if (window.resetFirestoreConnection) {
                    try {
                        await window.resetFirestoreConnection();
                        console.log('☁️ Cloud Sync Manager: ✅ Firebase connection reset successful');
                    } catch (resetError) {
                        console.error('☁️ Cloud Sync Manager: ❌ Failed to reset Firebase connection:', resetError);
                        return false;
                    }
                }
            }
            
            // Test basic read operation
            const testCollection = window.collection(window.db, '_connection_test');
            const testDoc = window.doc(testCollection, 'test');
            
            // Try to get the document (this will fail if there are connection issues)
            await window.getDoc(testDoc);
            
            console.log('☁️ Cloud Sync Manager: ✅ Firestore connection test passed');
            return true;
        } catch (error) {
            console.warn('☁️ Cloud Sync Manager: ⚠️ Firestore connection test failed:', error);
            
            // Check if it's a 400 error
            if (error.code === 400 || error.message.includes('400')) {
                console.error('☁️ Cloud Sync Manager: ❌ Firestore 400 error detected - connection issues');
                
                // Try to reset the connection
                if (window.resetFirestoreConnection) {
                    console.log('☁️ Cloud Sync Manager: Attempting to reset Firestore connection...');
                    try {
                        await window.resetFirestoreConnection();
                        console.log('☁️ Cloud Sync Manager: ✅ Firestore connection reset successful');
                        return true;
                    } catch (resetError) {
                        console.error('☁️ Cloud Sync Manager: ❌ Failed to reset Firestore connection:', resetError);
                    }
                }
            }
            
            // Check for offline-specific errors
            if (error.message.includes('client is offline') || error.message.includes('Failed to get document')) {
                console.warn('☁️ Cloud Sync Manager: ⚠️ Client appears to be offline, will retry when connection is restored');
                window.firebaseOffline = true;
                return false;
            }
            
            throw error;
        }
    }

    setupAuthListener() {
        try {
            console.log('☁️ Cloud Sync Manager: Setting up auth listener...');
            console.log('☁️ Cloud Sync Manager: Current auth state:', {
                windowAuth: !!window.auth,
                windowOnAuthStateChanged: !!window.onAuthStateChanged,
                authOnAuthStateChanged: !!(window.auth && window.auth.onAuthStateChanged)
            });

            let onAuthStateChanged;
            
            // Check if onAuthStateChanged is available globally
            if (window.onAuthStateChanged && typeof window.onAuthStateChanged === 'function') {
                onAuthStateChanged = window.onAuthStateChanged;
                console.log('☁️ Cloud Sync Manager: Using global onAuthStateChanged');
            } else {
                // Try to get it from the auth object
                if (window.auth && typeof window.auth.onAuthStateChanged === 'function') {
                    onAuthStateChanged = window.auth.onAuthStateChanged.bind(window.auth);
                    console.log('☁️ Cloud Sync Manager: Using auth.onAuthStateChanged');
                } else {
                    console.error('☁️ Cloud Sync Manager: onAuthStateChanged function not found');
                    console.log('☁️ Cloud Sync Manager: Available auth functions:', {
                        signInWithEmailAndPassword: !!window.signInWithEmailAndPassword,
                        createUserWithEmailAndPassword: !!window.createUserWithEmailAndPassword,
                        signOut: !!window.signOut
                    });
                    return;
                }
            }

            // Set up the auth state listener
            onAuthStateChanged(async (user) => {
                console.log('☁️ Cloud Sync Manager: Auth state changed:', user ? 'User signed in' : 'User signed out');
                
                if (user) {
                    this.currentUser = user;
                    console.log('☁️ Cloud Sync Manager: User authenticated:', user.email);
                    console.log('☁️ Cloud Sync Manager: User UID:', user.uid);
                    
                    // Perform initial sync when user signs in
                    await this.performFullSync();
                    
                    // Start periodic sync
                    this.startPeriodicSync();
                    
                } else {
                    this.currentUser = null;
                    console.log('☁️ Cloud Sync Manager: User signed out');
                    console.log('☁️ Cloud Sync Manager: Checking if user should be signed in...');
                    
                    // Check if there are stored credentials and try to sign in automatically
                    this.checkForStoredCredentials();
                    
                    // Stop periodic sync
                    this.stopPeriodicSync();
                }
            });

            console.log('☁️ Cloud Sync Manager: Auth listener set up successfully');
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Error setting up auth listener:', error);
            // Don't throw error, just log it and continue without auth
        }
    }

    // Check for stored credentials and attempt automatic sign-in
    async checkForStoredCredentials() {
        try {
            // Check multiple possible credential storage locations
            const storedEmail = localStorage.getItem('cloudSyncEmail') || 
                               localStorage.getItem('userEmail') || 
                               localStorage.getItem('email');
            const storedPassword = localStorage.getItem('cloudSyncPassword') || 
                                  localStorage.getItem('userPassword') || 
                                  localStorage.getItem('password');
            
            if (storedEmail && storedPassword && storedEmail !== 'null' && storedPassword !== 'null') {
                console.log('☁️ Cloud Sync Manager: Found stored credentials, attempting automatic sign-in...');
                console.log('☁️ Cloud Sync Manager: Email:', storedEmail);
                
                if (window.signInWithEmailAndPassword && typeof window.signInWithEmailAndPassword === 'function' && window.auth) {
                    try {
                        console.log('☁️ Cloud Sync Manager: Attempting sign-in with stored credentials...');
                        console.log('☁️ Cloud Sync Manager: Auth object:', !!window.auth);
                        console.log('☁️ Cloud Sync Manager: Email:', storedEmail);
                        
                        // Enhanced debugging for email parameter
                        console.log('🔍 Cloud Sync Manager: Email parameter debugging:', {
                            email: storedEmail,
                            emailType: typeof storedEmail,
                            emailLength: storedEmail ? storedEmail.length : 'undefined',
                            emailTrimmed: storedEmail ? storedEmail.trim() : 'undefined',
                            emailJSON: JSON.stringify(storedEmail),
                            emailKeys: storedEmail && typeof storedEmail === 'object' ? Object.keys(storedEmail) : 'N/A',
                            emailConstructor: storedEmail ? storedEmail.constructor.name : 'N/A'
                        });
                        
                        // Validate email before Firebase call
                        if (!storedEmail || typeof storedEmail !== 'string') {
                            console.error('❌ Cloud Sync Manager: Invalid email type for Firebase:', {
                                email: storedEmail,
                                type: typeof storedEmail
                            });
                            this.clearStoredCredentials();
                            return;
                        }
                        
                        // Ensure email is properly trimmed
                        const cleanEmail = storedEmail.trim();
                        if (cleanEmail !== storedEmail) {
                            console.log('🔧 Cloud Sync Manager: Email trimmed from:', JSON.stringify(storedEmail), 'to:', JSON.stringify(cleanEmail));
                        }
                        
                        await window.signInWithEmailAndPassword(window.auth, cleanEmail, storedPassword);
                        console.log('☁️ Cloud Sync Manager: Automatic sign-in successful');
                    } catch (signInError) {
                        console.log('☁️ Cloud Sync Manager: Automatic sign-in failed:', signInError.message);
                        console.log('☁️ Cloud Sync Manager: Error code:', signInError.code);
                        
                        // Check for specific error types
                        if (signInError.code === 'auth/invalid-credential') {
                            console.log('☁️ Cloud Sync Manager: Invalid credentials - clearing stored data');
                            this.clearStoredCredentials();
                        } else if (signInError.code === 'auth/user-not-found' && window.createUserWithEmailAndPassword) {
                            console.log('☁️ Cloud Sync Manager: User not found, attempting to create account...');
                            try {
                                // Enhanced debugging for account creation
                                console.log('🔍 Cloud Sync Manager: Account creation debugging:', {
                                    email: storedEmail,
                                    emailType: typeof storedEmail,
                                    emailTrimmed: storedEmail ? storedEmail.trim() : 'undefined',
                                    emailJSON: JSON.stringify(storedEmail)
                                });
                                
                                // Use clean email for account creation
                                const cleanEmail = storedEmail ? storedEmail.trim() : storedEmail;
                                await window.createUserWithEmailAndPassword(window.auth, cleanEmail, storedPassword);
                                console.log('☁️ Cloud Sync Manager: Account created successfully');
                            } catch (createError) {
                                console.log('☁️ Cloud Sync Manager: Account creation failed:', createError.message);
                                console.log('☁️ Cloud Sync Manager: Create error code:', createError.code);
                                
                                // Clear invalid stored credentials
                                this.clearStoredCredentials();
                            }
                        } else if (signInError.code === 'auth/too-many-requests') {
                            console.log('☁️ Cloud Sync Manager: Too many requests - rate limited');
                        } else if (signInError.code === 'auth/network-request-failed') {
                            console.log('☁️ Cloud Sync Manager: Network request failed');
                        } else {
                            console.log('☁️ Cloud Sync Manager: Unknown error - clearing stored credentials');
                            this.clearStoredCredentials();
                        }
                    }
                } else {
                    console.log('☁️ Cloud Sync Manager: Required functions not available:', {
                        signInWithEmailAndPassword: !!window.signInWithEmailAndPassword,
                        auth: !!window.auth,
                        createUserWithEmailAndPassword: !!window.createUserWithEmailAndPassword
                    });
                }
            } else {
                console.log('☁️ Cloud Sync Manager: No valid stored credentials found, user needs to sign in manually');
                console.log('☁️ Cloud Sync Manager: Raw credential values:', {
                    cloudSyncEmail: localStorage.getItem('cloudSyncEmail'),
                    cloudSyncPassword: localStorage.getItem('cloudSyncPassword') ? '***' + localStorage.getItem('cloudSyncPassword').slice(-4) : 'null',
                    userEmail: localStorage.getItem('userEmail'),
                    userPassword: localStorage.getItem('userPassword') ? '***' + localStorage.getItem('userPassword').slice(-4) : 'null',
                    email: localStorage.getItem('email'),
                    password: localStorage.getItem('password') ? '***' + localStorage.getItem('password').slice(-4) : 'null'
                });
                console.log('☁️ Cloud Sync Manager: Credential validation:', {
                    cloudSyncEmail: storedEmail && storedEmail !== 'null' ? 'Valid' : 'Invalid/Null',
                    cloudSyncPassword: storedPassword && storedPassword !== 'null' ? 'Valid' : 'Invalid/Null',
                    userEmail: localStorage.getItem('userEmail') && localStorage.getItem('userEmail') !== 'null' ? 'Valid' : 'Invalid/Null',
                    userPassword: localStorage.getItem('userPassword') && localStorage.getItem('userPassword') !== 'null' ? 'Valid' : 'Invalid/Null'
                });
            }
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Error checking stored credentials:', error);
        }
    }

    // Clear stored credentials
    clearStoredCredentials() {
        localStorage.removeItem('cloudSyncEmail');
        localStorage.removeItem('cloudSyncPassword');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPassword');
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        localStorage.removeItem('consistentUserId');
        console.log('☁️ Cloud Sync Manager: Stored credentials cleared');
    }

    // Manual credential clearing for debugging
    manualClearCredentials() {
        console.log('☁️ Cloud Sync Manager: Manual credential clearing triggered');
        this.clearStoredCredentials();
        console.log('☁️ Cloud Sync Manager: All stored credentials have been manually cleared');
        console.log('☁️ Cloud Sync Manager: You can now try logging in again');
    }

    // Check current authentication status and provide debugging info
    checkAuthStatus() {
        console.log('☁️ Cloud Sync Manager: === AUTHENTICATION STATUS CHECK ===');
        console.log('☁️ Cloud Sync Manager: Current user:', this.currentUser);
        console.log('☁️ Cloud Sync Manager: Firebase ready:', window.firebaseReady);
        console.log('☁️ Cloud Sync Manager: Auth object available:', !!window.auth);
        console.log('☁️ Cloud Sync Manager: Auth current user:', window.auth?.currentUser);
        console.log('☁️ Cloud Sync Manager: Auth functions available:', {
            onAuthStateChanged: !!window.onAuthStateChanged,
            signInWithEmailAndPassword: !!window.signInWithEmailAndPassword,
            createUserWithEmailAndPassword: !!window.createUserWithEmailAndPassword,
            signOut: !!window.signOut
        });
        console.log('☁️ Cloud Sync Manager: Stored credentials:', {
            email: !!localStorage.getItem('userEmail'),
            password: !!localStorage.getItem('userPassword')
        });
        console.log('☁️ Cloud Sync Manager: ======================================');
        
        return {
            currentUser: this.currentUser,
            firebaseReady: window.firebaseReady,
            authAvailable: !!window.auth,
            authCurrentUser: window.auth?.currentUser,
            authFunctions: {
                onAuthStateChanged: !!window.onAuthStateChanged,
                signInWithEmailAndPassword: !!window.signInWithEmailAndPassword,
                createUserWithEmailAndPassword: !!window.createUserWithEmailAndPassword,
                signOut: !!window.signOut
            },
            storedCredentials: {
                email: !!localStorage.getItem('userEmail'),
                password: !!localStorage.getItem('userPassword')
            }
        };
    }

    // Manually trigger authentication check and provide user guidance
    async triggerAuthCheck() {
        console.log('☁️ Cloud Sync Manager: Triggering authentication check...');
        
        // Check if we have the basic credentials needed
        const hasBasicCredentials = localStorage.getItem('userEmail') && localStorage.getItem('userPassword');
        
        if (!hasBasicCredentials) {
            console.log('☁️ Cloud Sync Manager: No basic credentials found');
            console.log('🔧 SOLUTION: You need to log in to the application first');
            console.log('🔧 The login process should store userEmail and userPassword');
            console.log('🔧 Then cloud sync can use those credentials for Firebase');
            return {
                status: 'no_credentials',
                message: 'No basic credentials found - log in to the application first'
            };
        }
        
        // Check if we have cloud sync credentials
        const hasCloudSyncCredentials = localStorage.getItem('cloudSyncEmail') && localStorage.getItem('cloudSyncPassword');
        
        if (!hasCloudSyncCredentials) {
            console.log('☁️ Cloud Sync Manager: No cloud sync credentials found');
            console.log('🔧 SOLUTION: Cloud sync credentials need to be set up');
            console.log('🔧 This usually happens automatically during login');
            console.log('🔧 You can manually set them using setCloudSyncCredentials()');
            return {
                status: 'no_cloud_sync_credentials',
                message: 'No cloud sync credentials found - use setCloudSyncCredentials() to set them'
            };
        }
        
        console.log('☁️ Cloud Sync Manager: Credentials found, attempting authentication...');
        return await this.checkForStoredCredentials();
    }

    // Function to manually set cloud sync credentials
    setCloudSyncCredentials(email, password) {
        console.log('☁️ Cloud Sync Manager: Setting cloud sync credentials...');
        
        if (!email || !password) {
            console.error('☁️ Cloud Sync Manager: Email and password are required');
            return false;
        }
        
        // Store the credentials
        localStorage.setItem('cloudSyncEmail', email);
        localStorage.setItem('cloudSyncPassword', password);
        
        console.log('☁️ Cloud Sync Manager: Cloud sync credentials stored');
        console.log('☁️ Cloud Sync Manager: Email:', email);
        console.log('☁️ Cloud Sync Manager: Password: ***' + password.slice(-4));
        
        // Try to authenticate with the new credentials
        this.checkForStoredCredentials();
        
        return true;
    }

    // Function to set up default cloud sync credentials
    setupDefaultCloudSyncCredentials() {
        console.log('☁️ Cloud Sync Manager: Setting up default cloud sync credentials...');
        
        // Get the current user's email and password from localStorage
        const userEmail = localStorage.getItem('userEmail');
        const userPassword = localStorage.getItem('userPassword');
        
        if (!userEmail || !userPassword) {
            console.log('☁️ Cloud Sync Manager: No user credentials found');
            console.log('🔧 SOLUTION: Log in to the application first to get user credentials');
            return false;
        }
        
        // Create cloud sync email (usually user@repairshop.com format)
        const cloudSyncEmail = userEmail.includes('@repairshop.com') ? userEmail : `${userEmail.split('@')[0]}@repairshop.com`;
        const cloudSyncPassword = userPassword;
        
        console.log('☁️ Cloud Sync Manager: Creating cloud sync credentials from user credentials');
        console.log('☁️ Cloud Sync Manager: User email:', userEmail);
        console.log('☁️ Cloud Sync Manager: Cloud sync email:', cloudSyncEmail);
        
        // Store the cloud sync credentials
        this.setCloudSyncCredentials(cloudSyncEmail, cloudSyncPassword);
        
        return true;
    }

    // Manually trigger authentication check and provide user guidance
    async triggerAuthCheck() {
        console.log('☁️ Cloud Sync Manager: Triggering authentication check...');
        
        // Check if we have the basic credentials needed
        const hasBasicCredentials = localStorage.getItem('userEmail') && localStorage.getItem('userPassword');
        
        if (!hasBasicCredentials) {
            console.log('☁️ Cloud Sync Manager: No basic credentials found');
            console.log('🔧 SOLUTION: You need to log in to the application first');
            console.log('🔧 The login process should store userEmail and userPassword');
            console.log('🔧 Then cloud sync can use those credentials for Firebase');
            return {
                status: 'no_credentials',
                message: 'No basic credentials found - log in to the application first'
            };
        }
        
        // Check if we have cloud sync credentials
        const hasCloudSyncCredentials = localStorage.getItem('cloudSyncEmail') && localStorage.getItem('cloudSyncPassword');
        
        if (!hasCloudSyncCredentials) {
            console.log('☁️ Cloud Sync Manager: No cloud sync credentials found');
            console.log('🔧 SOLUTION: Cloud sync credentials need to be set up');
            console.log('🔧 This usually happens automatically during login');
            console.log('🔧 You can manually set them using setCloudSyncCredentials()');
            return {
                status: 'no_cloud_sync_credentials',
                message: 'No cloud sync credentials found - use setCloudSyncCredentials() to set them'
            };
        }
        
        console.log('☁️ Cloud Sync Manager: Credentials found, attempting authentication...');
        return await this.checkForStoredCredentials();
    }

    // Function to manually set cloud sync credentials
    setCloudSyncCredentials(email, password) {
        console.log('☁️ Cloud Sync Manager: Setting cloud sync credentials...');
        
        if (!email || !password) {
            console.error('☁️ Cloud Sync Manager: Email and password are required');
            return false;
        }
        
        // Store the credentials
        localStorage.setItem('cloudSyncEmail', email);
        localStorage.setItem('cloudSyncPassword', password);
        
        console.log('☁️ Cloud Sync Manager: Cloud sync credentials stored');
        console.log('☁️ Cloud Sync Manager: Email:', email);
        console.log('☁️ Cloud Sync Manager: Password: ***' + password.slice(-4));
        
        // Try to authenticate with the new credentials
        this.checkForStoredCredentials();
        
        return true;
    }

    // Function to set up default cloud sync credentials
    setupDefaultCloudSyncCredentials() {
        console.log('☁️ Cloud Sync Manager: Setting up default cloud sync credentials...');
        
        // Get the current user's email and password from localStorage
        const userEmail = localStorage.getItem('userEmail');
        const userPassword = localStorage.getItem('userPassword');
        
        if (!userEmail || !userPassword) {
            console.log('☁️ Cloud Sync Manager: No user credentials found');
            console.log('🔧 SOLUTION: Log in to the application first to get user credentials');
            return false;
        }
        
        // Create cloud sync email (usually user@repairshop.com format)
        const cloudSyncEmail = userEmail.includes('@repairshop.com') ? userEmail : `${userEmail.split('@')[0]}@repairshop.com`;
        const cloudSyncPassword = userPassword;
        
        console.log('☁️ Cloud Sync Manager: Creating cloud sync credentials from user credentials');
        console.log('☁️ Cloud Sync Manager: User email:', userEmail);
        console.log('☁️ Cloud Sync Manager: Cloud sync email:', cloudSyncEmail);
        
        // Store the cloud sync credentials
        this.setCloudSyncCredentials(cloudSyncEmail, cloudSyncPassword);
        
        return true;
    }

    // Check current authentication status and provide debugging info
    checkAuthStatus() {
        const authStatus = this.checkAuthStatus();
        
        if (!authStatus.firebaseReady) {
            console.log('☁️ Cloud Sync Manager: Firebase not ready yet. Please wait for initialization...');
            return { status: 'firebase_not_ready', message: 'Firebase is still initializing. Please wait a moment and try again.' };
        }
        
        if (!authStatus.authAvailable) {
            console.log('☁️ Cloud Sync Manager: Firebase Auth not available. Please refresh the page and try again.');
            return { status: 'auth_not_available', message: 'Firebase Auth is not available. Please refresh the page and try again.' };
        }
        
        if (authStatus.currentUser) {
            console.log('☁️ Cloud Sync Manager: User is already authenticated:', authStatus.currentUser.email);
            return { status: 'already_authenticated', message: 'User is already signed in.', user: authStatus.currentUser };
        }
        
        if (authStatus.storedCredentials.email && authStatus.storedCredentials.password) {
            console.log('☁️ Cloud Sync Manager: Found stored credentials, attempting automatic sign-in...');
            try {
                await this.checkForStoredCredentials();
                return { status: 'attempting_auto_signin', message: 'Attempting automatic sign-in with stored credentials...' };
            } catch (error) {
                return { status: 'auto_signin_failed', message: 'Automatic sign-in failed. Please sign in manually.', error: error.message };
            }
        }
        
        console.log('☁️ Cloud Sync Manager: No stored credentials found. User needs to sign in manually.');
        return { 
            status: 'needs_manual_signin', 
            message: 'Please sign in to enable cloud synchronization.',
            instructions: [
                '1. Click the "Sign In" button or navigate to the login section',
                '2. Enter your Firebase email and password',
                '3. Once signed in, cloud sync will start automatically'
            ]
        };
    }

    // Enable cross-domain sync manually
    async enableCrossDomainSync() {
        console.log('☁️ Cloud Sync Manager: Enabling cross-domain sync...');
        
        try {
            // Check if we can create a default account for sync
            if (!window.createUserWithEmailAndPassword) {
                throw new Error('Firebase account creation not available');
            }
            
            // Use the same credentials that are working on the netlify domain
            // This ensures both domains use the same Firebase user account
            const defaultEmail = 'admin@repairshop.local';
            const defaultPassword = 'admin123456';
            
            console.log('☁️ Cloud Sync Manager: Using consistent credentials for cross-domain sync:', defaultEmail);
            
            try {
                // Try to sign in with the existing account first
                await window.signInWithEmailAndPassword(defaultEmail, defaultPassword);
                console.log('☁️ Cloud Sync Manager: Signed in to existing cross-domain sync account');
                
                // Store credentials for future use
                localStorage.setItem('cloudSyncEmail', defaultEmail);
                localStorage.setItem('cloudSyncPassword', defaultPassword);
                
                return { 
                    status: 'success', 
                    message: 'Cross-domain sync enabled successfully!',
                    credentials: { email: defaultEmail, password: defaultPassword },
                    note: 'Using same account as netlify domain for data consistency'
                };
                
            } catch (signInError) {
                if (signInError.message.includes('user-not-found')) {
                    // Account doesn't exist, try to create it
                    console.log('☁️ Cloud Sync Manager: Account not found, attempting to create...');
                    try {
                        await window.createUserWithEmailAndPassword(defaultEmail, defaultPassword);
                        console.log('☁️ Cloud Sync Manager: Cross-domain sync account created successfully');
                        
                        // Store credentials for future use
                        localStorage.setItem('cloudSyncEmail', defaultEmail);
                        localStorage.setItem('cloudSyncPassword', defaultPassword);
                        
                        return { 
                            status: 'success', 
                            message: 'Cross-domain sync account created and enabled!',
                            credentials: { email: defaultEmail, password: defaultPassword },
                            note: 'New account created for cross-domain data consistency'
                        };
                        
                    } catch (createError) {
                        throw new Error(`Failed to create cross-domain sync account: ${createError.message}`);
                    }
                } else {
                    throw new Error(`Failed to sign in to cross-domain sync account: ${signInError.message}`);
                }
            }
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Failed to enable cross-domain sync:', error);
            return { 
                status: 'error', 
                message: 'Failed to enable cross-domain sync',
                error: error.message,
                instructions: [
                    'Please try signing in manually with: admin@repairshop.local / admin123456',
                    'This ensures both domains use the same Firebase user account',
                    'Or contact support for assistance'
                ]
            };
        }
    }

    // Switch to cross-domain sync account
    async switchToCrossDomainAccount() {
        console.log('☁️ Cloud Sync Manager: Switching to cross-domain sync account...');
        
        try {
            // First, sign out of current account if any
            if (window.signOut && this.currentUser) {
                await window.signOut();
                console.log('☁️ Cloud Sync Manager: Signed out of current account');
            }
            
            // Use the consistent credentials for cross-domain sync
            const crossDomainEmail = 'admin@repairshop.local';
            const crossDomainPassword = 'admin123456';
            
            console.log('☁️ Cloud Sync Manager: Signing in to cross-domain account:', crossDomainEmail);
            
            try {
                await window.signInWithEmailAndPassword(crossDomainEmail, crossDomainPassword);
                console.log('☁️ Cloud Sync Manager: Successfully switched to cross-domain sync account');
                
                // Store credentials for future use
                localStorage.setItem('cloudSyncEmail', crossDomainEmail);
                localStorage.setItem('cloudSyncPassword', crossDomainPassword);
                
                return { 
                    status: 'success', 
                    message: 'Successfully switched to cross-domain sync account',
                    credentials: { email: crossDomainEmail, password: crossDomainPassword },
                    note: 'Now using same account as netlify domain for data consistency'
                };
                
            } catch (signInError) {
                if (signInError.message.includes('user-not-found')) {
                    // Account doesn't exist, create it
                    console.log('☁️ Cloud Sync Manager: Cross-domain account not found, creating...');
                    await window.createUserWithEmailAndPassword(crossDomainEmail, crossDomainPassword);
                    console.log('☁️ Cloud Sync Manager: Cross-domain account created successfully');
                    
                    // Store credentials for future use
                    localStorage.setItem('cloudSyncEmail', crossDomainEmail);
                    localStorage.setItem('cloudSyncPassword', crossDomainPassword);
                    
                    return { 
                        status: 'success', 
                        message: 'Cross-domain sync account created and activated',
                        credentials: { email: crossDomainEmail, password: crossDomainPassword },
                        note: 'New account created for cross-domain data consistency'
                    };
                } else {
                    throw signInError;
                }
            }
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Failed to switch to cross-domain account:', error);
            return { 
                status: 'error', 
                message: 'Failed to switch to cross-domain sync account',
                error: error.message,
                instructions: [
                    'Please try manually signing in with: admin@repairshop.local / admin123456',
                    'This ensures both domains use the same Firebase user account',
                    'Or contact support for assistance'
                ]
            };
        }
    }

    async performFullSync() {
        if (this.syncInProgress) {
            console.log('☁️ Cloud Sync Manager: Sync already in progress, skipping...');
            return;
        }

        try {
            this.syncInProgress = true;
            console.log('☁️ Cloud Sync Manager: 🔄 Starting full data sync...');
            
            // Test connection before proceeding
            await this.testFirestoreConnection();
            
            // Load data from cloud first
            await this.loadDataFromCloud();
            
            // Save current data to cloud
            await this.saveDataToCloud();
            
            this.lastSyncTime = new Date().toISOString();
            console.log('☁️ Cloud Sync Manager: ✅ Full sync completed successfully');
            
            // Trigger UI refresh
            this.triggerDataRefresh('all');
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: ❌ Full sync failed:', error);
            
            // Handle specific Firestore errors
            if (error.code === 400 || error.message.includes('400')) {
                console.error('☁️ Cloud Sync Manager: ❌ Firestore 400 error - attempting connection reset...');
                try {
                    if (window.resetFirestoreConnection) {
                        await window.resetFirestoreConnection();
                        console.log('☁️ Cloud Sync Manager: ✅ Connection reset successful, retrying sync...');
                        // Retry once after reset
                        setTimeout(() => this.performFullSync(), 2000);
                        return;
                    }
                } catch (resetError) {
                    console.error('☁️ Cloud Sync Manager: ❌ Failed to reset connection:', resetError);
                }
            }
            
            // Dispatch error event
            try {
                window.dispatchEvent(new CustomEvent('cloudSyncError', { 
                    detail: { error: error.message, timestamp: new Date().toISOString() } 
                }));
            } catch (eventError) {
                console.warn('☁️ Cloud Sync Manager: Could not dispatch error event:', eventError);
            }
            
        } finally {
            this.syncInProgress = false;
        }
    }

    async loadDataFromCloud() {
        try {
            console.log('☁️ Cloud Sync Manager: 📥 Loading data from cloud...');
            
            // Test connection before proceeding
            await this.testFirestoreConnection();
            
            if (!window.dataManager || typeof window.dataManager.loadAllAppData !== 'function') {
                console.warn('☁️ Cloud Sync Manager: Data manager not available, using direct Firebase calls');
                
                // Fallback to direct Firebase operations
                for (const dataType of this.dataTypes) {
                    try {
                        const collectionRef = window.collection(dataType);
                        const docRef = window.doc(collectionRef, 'data');
                        const docSnap = await window.getDoc(docRef);
                        
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            if (data && data.items) {
                                // Store in localStorage as fallback
                                localStorage.setItem(dataType, JSON.stringify(data.items));
                                console.log(`☁️ Cloud Sync Manager: ✅ Loaded ${data.items.length} ${dataType} items`);
                            }
                        }
                    } catch (itemError) {
                        console.warn(`☁️ Cloud Sync Manager: Could not load ${dataType}:`, itemError);
                    }
                }
            } else {
                // Use the data manager
                await window.dataManager.loadAllAppData();
                console.log('☁️ Cloud Sync Manager: ✅ Data loaded via data manager');
            }
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: ❌ Failed to load data from cloud:', error);
            
            // Handle specific Firestore errors
            if (error.code === 400 || error.message.includes('400')) {
                console.error('☁️ Cloud Sync Manager: ❌ Firestore 400 error during load - connection issues');
                throw error; // Re-throw to let caller handle it
            }
            
            // For other errors, try to continue with local data
            console.warn('☁️ Cloud Sync Manager: Continuing with local data due to load error');
        }
    }

    async manualCloudLoad() {
        if (!window.db || !this.currentUser) {
            console.log('☁️ Cloud Sync Manager: Firebase not ready or user not authenticated, skipping cloud load');
            return;
        }

        try {
            const userDocRef = window.doc(window.collection('users'), this.currentUser.uid);
            const userDoc = await window.getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Load each data type from the user document
                this.dataTypes.forEach(dataType => {
                    if (userData[dataType]) {
                        try {
                            localStorage.setItem(dataType, JSON.stringify(userData[dataType]));
                            console.log(`☁️ Cloud Sync Manager: Loaded ${dataType} from cloud`);
                        } catch (error) {
                            console.error(`☁️ Cloud Sync Manager: Error loading ${dataType}:`, error);
                        }
                    }
                });
                
                console.log('☁️ Cloud Sync Manager: Manual cloud load completed');
            } else {
                console.log('☁️ Cloud Sync Manager: No user data found in cloud, using local data');
            }
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Manual cloud load failed:', error);
            // Don't throw error, just log it and continue with local data
        }
    }

    async saveDataToCloud() {
        try {
            console.log('☁️ Cloud Sync Manager: 📤 Saving data to cloud...');
            
            // Test connection before proceeding
            await this.testFirestoreConnection();
            
            if (!window.dataManager || typeof window.dataManager.saveAllAppData !== 'function') {
                console.warn('☁️ Cloud Sync Manager: Data manager not available, using direct Firebase calls');
                
                // Fallback to direct Firebase operations
                for (const dataType of this.dataTypes) {
                    try {
                        const localData = localStorage.getItem(dataType);
                        if (localData) {
                            const items = JSON.parse(localData);
                            const collectionRef = window.collection(dataType);
                            const docRef = window.doc(collectionRef, 'data');
                            
                            await window.setDoc(docRef, {
                                items: items,
                                lastUpdated: new Date().toISOString(),
                                user: this.currentUser ? this.currentUser.email : 'unknown'
                            });
                            
                            console.log(`☁️ Cloud Sync Manager: ✅ Saved ${items.length} ${dataType} items`);
                        }
                    } catch (itemError) {
                        console.warn(`☁️ Cloud Sync Manager: Could not save ${dataType}:`, itemError);
                    }
                }
            } else {
                // Use the data manager
                await window.dataManager.saveAllAppData();
                console.log('☁️ Cloud Sync Manager: ✅ Data saved via data manager');
            }
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: ❌ Failed to save data to cloud:', error);
            
            // Handle specific Firestore errors
            if (error.code === 400 || error.message.includes('400')) {
                console.error('☁️ Cloud Sync Manager: ❌ Firestore 400 error during save - connection issues');
                throw error; // Re-throw to let caller handle it
            }
            
            // For other errors, log but don't fail completely
            console.warn('☁️ Cloud Sync Manager: Save error occurred, but continuing...');
        }
    }

    async manualCloudSave() {
        if (!window.db || !this.currentUser) {
            console.log('☁️ Cloud Sync Manager: Firebase not ready or user not authenticated, skipping cloud save');
            return;
        }

        try {
            const userDocRef = window.doc(window.collection('users'), this.currentUser.uid);
            
            // Collect all local data
            const userData = {
                lastUpdated: new Date().toISOString(),
                domain: window.location.hostname,
                email: this.currentUser.email
            };
            
            // Add each data type
            this.dataTypes.forEach(dataType => {
                try {
                    const localData = localStorage.getItem(dataType);
                    if (localData) {
                        userData[dataType] = JSON.parse(localData);
                    }
                } catch (error) {
                    console.error(`☁️ Cloud Sync Manager: Error processing ${dataType}:`, error);
                }
            });
            
            // Save to Firestore
            await window.setDoc(userDocRef, userData, { merge: true });
            console.log('☁️ Cloud Sync Manager: Manual cloud save completed');
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Manual cloud save failed:', error);
            throw error;
        }
    }

    startPeriodicSync() {
        // Stop any existing sync
        this.stopPeriodicSync();
        
        // Start new sync interval (every 5 minutes)
        this.syncInterval = setInterval(async () => {
            if (this.currentUser && !this.syncInProgress) {
                console.log('☁️ Cloud Sync Manager: 🔄 Performing periodic sync...');
                try {
                    await this.performFullSync();
                    console.log('☁️ Cloud Sync Manager: ✅ Periodic sync completed successfully');
                } catch (error) {
                    console.error('☁️ Cloud Sync Manager: ❌ Periodic sync failed:', error);
                }
            } else {
                console.log('☁️ Cloud Sync Manager: ⏸️ Skipping periodic sync - user not authenticated or sync in progress');
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        console.log('☁️ Cloud Sync Manager: 🚀 Periodic sync started (every 5 minutes)');
    }

    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('☁️ Cloud Sync Manager: Periodic sync stopped');
        }
    }

    startAutoSync() {
        // Perform initial sync after a short delay
        setTimeout(async () => {
            if (this.currentUser) {
                await this.performFullSync();
                // Start periodic sync after successful initial sync
                this.startPeriodicSync();
            } else {
                console.log('☁️ Cloud Sync Manager: No user authenticated, skipping initial sync');
                // Start periodic sync anyway - it will wait for user authentication
                this.startPeriodicSync();
            }
        }, 3000);
    }

    retrySync() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(5000 * Math.pow(2, this.retryCount - 1), 30000);
            
            console.log(`☁️ Cloud Sync Manager: Retrying sync in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(async () => {
                await this.performFullSync();
            }, delay);
        } else {
            console.error('☁️ Cloud Sync Manager: Max retries exceeded, sync failed');
            this.retryCount = 0;
        }
    }

    retryInitialization() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = Math.min(2000 * Math.pow(2, this.retryCount - 1), 10000);
            
            console.log(`☁️ Cloud Sync Manager: Retrying initialization in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
            
            setTimeout(() => {
                this.initialize();
            }, delay);
        } else {
            console.error('☁️ Cloud Sync Manager: Max initialization retries exceeded');
            this.retryCount = 0;
            
            // Try to continue with limited functionality
            console.log('☁️ Cloud Sync Manager: Continuing with limited functionality - will retry Firebase connection');
            this.isInitialized = true;
            
            // Set up a background retry mechanism
            this.setupBackgroundRetry();
        }
    }

    // Manual sync trigger
    async triggerManualSync() {
        console.log('☁️ Cloud Sync Manager: Manual sync triggered');
        await this.performFullSync();
    }

    // Get sync status
    getSyncStatus() {
        return {
            isInitialized: this.isInitialized,
            currentUser: this.currentUser ? this.currentUser.email : null,
            lastSyncTime: this.lastSyncTime,
            syncInProgress: this.syncInProgress,
            retryCount: this.retryCount,
            periodicSyncActive: !!this.syncInterval
        };
    }

    // Force sync from cloud (overwrites local data)
    async forceSyncFromCloud() {
        console.log('☁️ Cloud Sync Manager: Force syncing from cloud...');
        
        try {
            await this.loadDataFromCloud();
            
            // Refresh the page to show new data
            if (confirm('Data synced from cloud successfully! Refresh the page to see the updated data?')) {
                window.location.reload();
            }
            
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Force sync failed:', error);
            alert('Error syncing from cloud: ' + error.message);
        }
    }
    
    // Trigger UI refresh for specific data type
    triggerDataRefresh(dataType) {
        try {
            console.log(`☁️ Cloud Sync Manager: 🔄 Triggering UI refresh for ${dataType}`);
            
            // Dispatch custom event to notify the app that data has changed
            try {
                window.dispatchEvent(new CustomEvent('dataRefreshed', {
                    detail: { 
                        dataType: dataType,
                        timestamp: new Date().toISOString(),
                        source: 'cloud-sync'
                    }
                }));
            } catch (eventError) {
                console.warn(`☁️ Cloud Sync Manager: Could not dispatch dataRefreshed event for ${dataType}:`, eventError);
            }
            
            // Try to call app-specific refresh methods if they exist
            if (window.refreshInventory && dataType === 'inventory') {
                try {
                    window.refreshInventory();
                    console.log(`☁️ Cloud Sync Manager: ✅ Called refreshInventory()`);
                } catch (refreshError) {
                    console.warn(`☁️ Cloud Sync Manager: refreshInventory() failed:`, refreshError);
                }
            }
            
            if (window.refreshCustomers && dataType === 'customers') {
                try {
                    window.refreshCustomers();
                    console.log(`☁️ Cloud Sync Manager: ✅ Called refreshCustomers()`);
                } catch (refreshError) {
                    console.warn(`☁️ Cloud Sync Manager: refreshCustomers() failed:`, refreshError);
                }
            }
            
            if (window.refreshData && typeof window.refreshData === 'function') {
                try {
                    window.refreshData(dataType);
                    console.log(`☁️ Cloud Sync Manager: ✅ Called refreshData(${dataType})`);
                } catch (refreshError) {
                    console.warn(`☁️ Cloud Sync Manager: refreshData(${dataType}) failed:`, refreshError);
                }
            }
            
            console.log(`☁️ Cloud Sync Manager: ✅ UI refresh triggered for ${dataType}`);
            
        } catch (error) {
            console.error(`☁️ Cloud Sync Manager: Error triggering UI refresh for ${dataType}:`, error);
        }
    }
    
    // Check if data actually changed during sync
    hasDataChanged(oldData, newData) {
        try {
            if (!oldData || !newData) return true;
            
            const oldStr = JSON.stringify(oldData);
            const newStr = JSON.stringify(newData);
            
            return oldStr !== newStr;
        } catch (error) {
            console.error('☁️ Cloud Sync Manager: Error checking data change:', error);
            return true; // Assume changed if we can't compare
        }
    }
    
    // Background retry mechanism for Firebase connection
    setupBackgroundRetry() {
        console.log('☁️ Cloud Sync Manager: Setting up background Firebase retry...');
        
        // Retry Firebase connection every 2 minutes
        setInterval(async () => {
            if (!window.firebaseReady || !window.db || !window.auth) {
                console.log('☁️ Cloud Sync Manager: 🔄 Background retry: Attempting Firebase connection...');
                try {
                    await this.waitForFirebase(30000); // Shorter timeout for background retries
                    console.log('☁️ Cloud Sync Manager: ✅ Background retry: Firebase connection successful!');
                    
                    // Re-enable full functionality
                    this.setupAuthListener();
                    this.startAutoSync();
                    
                } catch (error) {
                    console.log('☁️ Cloud Sync Manager: ⏸️ Background retry: Firebase still not ready, will retry later...');
                }
            }
        }, 2 * 60 * 1000); // Every 2 minutes
        
        console.log('☁️ Cloud Sync Manager: Background retry mechanism active (every 2 minutes)');
    }
}

// Initialize the cloud sync manager
let cloudSyncManager;

// Wait for Firebase to be ready before initializing
function initializeCloudSync() {
    if (window.firebaseReady && window.db && window.auth) {
        cloudSyncManager = new CloudSyncManager();
        window.cloudSyncManager = cloudSyncManager;
        setupDebugMethods();
    } else {
        // Wait for Firebase ready event
        window.addEventListener('firebaseReady', () => {
            cloudSyncManager = new CloudSyncManager();
            window.cloudSyncManager = cloudSyncManager;
            setupDebugMethods();
        });
    }
}

// Setup debugging methods globally
function setupDebugMethods() {
    window.cloudSyncDebug = {
        checkAuthStatus: () => {
            if (window.cloudSyncManager) {
                return window.cloudSyncManager.checkAuthStatus();
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        triggerAuthCheck: async () => {
            if (window.cloudSyncManager) {
                return await window.cloudSyncManager.triggerAuthCheck();
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        forceSync: async () => {
            if (window.cloudSyncManager) {
                return await window.cloudSyncManager.triggerManualSync();
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        startPeriodicSync: () => {
            if (window.cloudSyncManager) {
                window.cloudSyncManager.startPeriodicSync();
                return { message: 'Periodic sync started manually' };
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        stopPeriodicSync: () => {
            if (window.cloudSyncManager) {
                window.cloudSyncManager.stopPeriodicSync();
                return { message: 'Periodic sync stopped manually' };
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        getStatus: () => {
            if (window.cloudSyncManager) {
                return window.cloudSyncManager.getSyncStatus();
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        enableCrossDomainSync: async () => {
            if (window.cloudSyncManager) {
                return await window.cloudSyncManager.enableCrossDomainSync();
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        switchToCrossDomainAccount: async () => {
            if (window.cloudSyncManager) {
                return await window.cloudSyncManager.switchToCrossDomainAccount();
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        clearCredentials: () => {
            if (window.cloudSyncManager) {
                window.cloudSyncManager.clearStoredCredentials();
                return { message: 'Stored credentials cleared successfully' };
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        checkLocalData: () => {
            if (window.cloudSyncManager) {
                const dataStatus = {};
                window.cloudSyncManager.dataTypes.forEach(dataType => {
                    try {
                        const data = localStorage.getItem(dataType);
                        if (data) {
                            const parsed = JSON.parse(data);
                            dataStatus[dataType] = {
                                count: Array.isArray(parsed) ? parsed.length : 'Not array',
                                size: data.length,
                                sample: Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : parsed
                            };
                        } else {
                            dataStatus[dataType] = 'No data';
                        }
                    } catch (error) {
                        dataStatus[dataType] = `Error: ${error.message}`;
                    }
                });
                
                return {
                    domain: window.location.hostname,
                    user: window.auth?.currentUser?.email,
                    uid: window.auth?.currentUser?.uid,
                    dataStatus: dataStatus,
                    lastSync: localStorage.getItem('lastCloudSync')
                };
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        },
        
        compareDataWithCloud: async () => {
            if (window.cloudSyncManager) {
                try {
                    const localData = {};
                    const cloudData = await window.dataManager.loadAllAppData();
                    
                    window.cloudSyncManager.dataTypes.forEach(dataType => {
                        const local = localStorage.getItem(dataType);
                        localData[dataType] = local ? JSON.parse(local) : null;
                    });
                    
                    return {
                        local: localData,
                        cloud: cloudData,
                        differences: window.cloudSyncManager.dataTypes.map(dataType => {
                            const local = localData[dataType];
                            const cloud = cloudData ? cloudData[dataType] : null;
                            
                            if (!local && !cloud) return { dataType, status: 'Both empty' };
                            if (!local) return { dataType, status: 'Local empty, cloud has data', cloudCount: Array.isArray(cloud) ? cloud.length : 'Not array' };
                            if (!cloud) return { dataType, status: 'Cloud empty, local has data', localCount: Array.isArray(local) ? local.length : 'Not array' };
                            
                            const localCount = Array.isArray(local) ? local.length : 'Not array';
                            const cloudCount = Array.isArray(cloud) ? cloud.length : 'Not array';
                            
                            return {
                                dataType,
                                localCount,
                                cloudCount,
                                status: localCount === cloudCount ? 'Same count' : 'Different count'
                            };
                        })
                    };
                } catch (error) {
                    return { error: `Failed to compare data: ${error.message}` };
                }
            } else {
                return { error: 'Cloud Sync Manager not initialized yet' };
            }
        }
    };
    
    console.log('☁️ Cloud Sync Manager: Debug methods available at window.cloudSyncDebug');
    console.log('☁️ Cloud Sync Manager: Use enableCrossDomainSync() to automatically enable cross-domain sync');
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCloudSync);
} else {
    initializeCloudSync();
}

// Add global error handlers to prevent message channel errors
window.addEventListener('unhandledrejection', (event) => {
    console.warn('☁️ Cloud Sync Manager: Caught unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the error from showing in console
});

window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('message channel')) {
        console.warn('☁️ Cloud Sync Manager: Caught message channel error:', event.message);
        event.preventDefault(); // Prevent the error from showing in console
    }
});

// Add global error handlers for Firestore connection issues
window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('firestore')) {
        console.warn('🔥 Firebase Global: Firestore error detected, connection may be unstable');
    }
    
    // Prevent message channel errors
    if (event.error && event.error.message && (
        event.error.message.includes('message channel') ||
        event.error.message.includes('asynchronous response') ||
        event.error.message.includes('response by returning true')
    )) {
        console.log('☁️ Cloud Sync Manager: Message channel error prevented');
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('firestore')) {
        console.warn('🔥 Firebase Global: Firestore promise rejection detected');
        event.preventDefault(); // Prevent the error from being logged
    }
    
    // Prevent message channel promise rejections
    if (event.reason && event.reason.message && (
        event.reason.message.includes('message channel') ||
        event.reason.message.includes('asynchronous response') ||
        event.reason.message.includes('response by returning true')
    )) {
        console.log('☁️ Cloud Sync Manager: Message channel promise rejection prevented');
        event.preventDefault();
        return false;
    }
});

// Export for manual use
window.CloudSyncManager = CloudSyncManager;
window.initializeCloudSync = initializeCloudSync;

// Global utility functions for debugging
window.clearCloudCredentials = function() {
    if (window.cloudSyncManager) {
        window.cloudSyncManager.manualClearCredentials();
    } else {
        console.log('☁️ Cloud Sync Manager: Manager not initialized, clearing credentials manually...');
        localStorage.removeItem('cloudSyncEmail');
        localStorage.removeItem('cloudSyncPassword');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPassword');
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        localStorage.removeItem('consistentUserId');
        console.log('☁️ Cloud Sync Manager: Credentials cleared manually');
    }
};

window.checkCloudAuth = function() {
    if (window.cloudSyncManager) {
        return window.cloudSyncManager.checkAuthStatus();
    } else {
        console.log('☁️ Cloud Sync Manager: Manager not initialized');
        return null;
    }
};

// Test function to debug email parameter issues
window.testFirebaseEmail = function() {
    console.log('🧪 Testing Firebase email parameter...');
    
    const storedEmail = localStorage.getItem('cloudSyncEmail');
    const storedPassword = localStorage.getItem('cloudSyncPassword');
    
    console.log('🔍 Stored credentials test:', {
        email: storedEmail,
        emailType: typeof storedEmail,
        emailLength: storedEmail ? storedEmail.length : 'undefined',
        emailTrimmed: storedEmail ? storedEmail.trim() : 'undefined',
        emailJSON: JSON.stringify(storedEmail),
        emailKeys: storedEmail && typeof storedEmail === 'object' ? Object.keys(storedEmail) : 'N/A',
        emailConstructor: storedEmail ? storedEmail.constructor.name : 'N/A',
        password: storedPassword ? '***' + storedPassword.slice(-4) : 'undefined'
    });
    
    if (storedEmail && typeof storedEmail === 'string') {
        console.log('✅ Email appears to be a valid string');
        console.log('🔍 Email content analysis:');
        console.log('  - Raw:', JSON.stringify(storedEmail));
        console.log('  - Length:', storedEmail.length);
        console.log('  - Characters:', Array.from(storedEmail).map(c => c.charCodeAt(0)));
        console.log('  - Trimmed:', JSON.stringify(storedEmail.trim()));
    } else {
        console.error('❌ Email is not a valid string:', storedEmail);
    }
    
    return { email: storedEmail, type: typeof storedEmail };
};

// Function to manually create test credentials for debugging
window.createTestCredentials = function() {
    console.log('🧪 Creating test credentials for debugging...');
    
    const testEmail = 'admin@repairshop.com';
    const testPassword = 'admin123456';
    
    localStorage.setItem('cloudSyncEmail', testEmail);
    localStorage.setItem('cloudSyncPassword', testPassword);
    
    console.log('✅ Test credentials created:', {
        email: testEmail,
        password: '***' + testPassword.slice(-4)
    });
    
    console.log('🔄 Now try testFirebaseEmail() again to verify credentials');
    
    return { email: testEmail, password: testPassword };
};

console.log('☁️ Cloud Sync Manager: Script loaded and ready');
console.log('☁️ Cloud Sync Manager: Global functions available:');
console.log('☁️ Cloud Sync Manager: - clearCloudCredentials() - Clear stored credentials');
console.log('☁️ Cloud Sync Manager: - checkCloudAuth() - Check authentication status');
console.log('☁️ Cloud Sync Manager: - testFirebaseEmail() - Debug email parameter issues');
console.log('☁️ Cloud Sync Manager: - createTestCredentials() - Create test credentials for debugging');

