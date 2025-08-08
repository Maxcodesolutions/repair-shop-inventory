// Firebase Configuration (v12 SDK)
// Note: Firebase is initialized in the HTML module script

// Wait for Firebase to be ready
let db, auth;

function initializeFirebaseServices() {
    if (window.db && window.auth) {
        db = window.db;
        auth = window.auth;
        console.log('Firebase services initialized successfully');
        
        // Initialize data manager if it exists
        if (typeof dataManager !== 'undefined') {
            dataManager.init();
        }
    } else {
        console.log('Firebase not ready yet, retrying...');
        setTimeout(initializeFirebaseServices, 100);
    }
}

// Listen for Firebase ready event
window.addEventListener('firebaseReady', () => {
    console.log('Firebase ready event received');
    initializeFirebaseServices();
});

// Also try to initialize immediately (in case event was already fired)
if (window.firebaseReady) {
    initializeFirebaseServices();
}

// Data management functions
class DataManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = false;
    }

    // Initialize data manager
    async init() {
        try {
            // Check if Firebase is available
            if (!window.auth || !window.onAuthStateChanged) {
                console.log('Firebase not available, using localStorage only');
                this.isOnline = false;
                // Don't load data here - let the main script handle it
                return;
            }

            // Check if user is authenticated
            window.onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.currentUser = user;
                    this.isOnline = true;
                    console.log('User authenticated:', user.email);
                    // Don't automatically load data - let main script handle it
                } else {
                    this.currentUser = null;
                    this.isOnline = false;
                    console.log('User not authenticated');
                    // Don't automatically load data - let main script handle it
                }
            });
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.isOnline = false;
            // Don't load data here - let the main script handle it
        }
    }

    // Wait for main script variables to be available
    waitForMainScript() {
        return new Promise((resolve) => {
            const checkVariables = () => {
                if (typeof inventory !== 'undefined' && 
                    typeof vendors !== 'undefined' && 
                    typeof customers !== 'undefined' &&
                    typeof repairs !== 'undefined' &&
                    typeof invoices !== 'undefined' &&
                    typeof quotations !== 'undefined' &&
                    typeof pickDrops !== 'undefined' &&
                    typeof payments !== 'undefined' &&
                    typeof users !== 'undefined') {
                    console.log('Main script variables are available');
                    resolve();
                } else {
                    console.log('Waiting for main script variables...');
                    setTimeout(checkVariables, 100);
                }
            };
            checkVariables();
        });
    }

    // Save data to server
    async saveDataToServer() {
        if (!this.currentUser || !this.isOnline || !window.setDoc || !window.doc || !window.collection) {
            console.log('Firebase not available, saving to localStorage only');
            this.saveDataToLocal();
            return;
        }

        try {
            // Wait for main script variables to be available
            await this.waitForMainScript();

            const fallbackArray = (val) => Array.isArray(val) ? val : [];
            const userDataRaw = {
                inventory: fallbackArray(inventory),
                vendors: fallbackArray(vendors),
                customers: fallbackArray(customers),
                purchases: fallbackArray(purchases),
                repairs: fallbackArray(repairs),
                outsource: Array.isArray(outsource) ? outsource : (Array.isArray(outsourceRepairs) ? outsourceRepairs : []),
                outsourceRepairs: Array.isArray(outsourceRepairs) ? outsourceRepairs : (Array.isArray(outsource) ? outsource : []),
                invoices: fallbackArray(invoices),
                quotations: fallbackArray(quotations),
                pickDrops: fallbackArray(pickDrops),
                deliveries: fallbackArray(deliveries),
                payments: fallbackArray(payments),
                users: fallbackArray(users),
                lastUpdated: new Date().toISOString()
            };

            const userData = (function sanitizeForFirestore(value) {
                if (value === undefined) return null;
                if (value === null) return null;
                if (Array.isArray(value)) return value.map(sanitizeForFirestore);
                if (typeof value === 'object') {
                    const out = {};
                    Object.entries(value).forEach(([k, v]) => {
                        if (v === undefined) return;
                        out[k] = sanitizeForFirestore(v);
                    });
                    return out;
                }
                return value;
            })(userDataRaw);

            await window.setDoc(window.doc(window.collection(db, 'users'), this.currentUser.uid), userData);
            console.log('Data saved to server successfully');
        } catch (error) {
            console.error('Error saving to server:', error);
            this.saveDataToLocal();
        }
    }

    // Load data from server
    async loadDataFromServer() {
        if (!this.currentUser || !this.isOnline || !window.getDoc || !window.doc || !window.collection) {
            console.log('Firebase not available, loading from localStorage only');
            this.loadDataFromLocal();
            return;
        }

        try {
            const doc = await window.getDoc(window.doc(window.collection(db, 'users'), this.currentUser.uid));
            if (doc.exists()) {
                const data = doc.data();
                inventory = data.inventory || [];
                vendors = data.vendors || [];
                customers = data.customers || [];
                purchases = data.purchases || [];
                repairs = data.repairs || [];
                outsource = data.outsource || [];
                invoices = data.invoices || [];
                quotations = data.quotations || [];
                pickDrops = data.pickDrops || [];
                deliveries = data.deliveries || [];
                payments = data.payments || [];
                users = data.users || getDefaultUsers();
                
                console.log('Data loaded from server successfully');
                renderAll();
                updateDashboard();
            } else {
                console.log('No server data found, using defaults');
                this.loadDataFromLocal();
            }
        } catch (error) {
            console.error('Error loading from server:', error);
            this.loadDataFromLocal();
        }
    }

    // Save data to local storage (fallback)
    saveDataToLocal() {
        try {
            localStorage.setItem('inventory', JSON.stringify(inventory));
            localStorage.setItem('vendors', JSON.stringify(vendors));
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('purchases', JSON.stringify(purchases));
            localStorage.setItem('repairs', JSON.stringify(repairs));
            localStorage.setItem('outsource', JSON.stringify(outsource));
            localStorage.setItem('invoices', JSON.stringify(invoices));
            localStorage.setItem('quotations', JSON.stringify(quotations));
            localStorage.setItem('pickDrops', JSON.stringify(pickDrops));
            localStorage.setItem('deliveries', JSON.stringify(deliveries));
            localStorage.setItem('payments', JSON.stringify(payments));
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Data saved to local storage');
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }

    // Load data from local storage (fallback)
    loadDataFromLocal() {
        try {
            // Check if main script variables are available
            if (typeof inventory === 'undefined') {
                console.log('Main script not loaded yet, deferring data loading');
                // Set a flag to load data when main script is ready
                window.deferDataLoading = true;
                return;
            }

            const inventoryData = localStorage.getItem('inventory');
            const vendorsData = localStorage.getItem('vendors');
            const customersData = localStorage.getItem('customers');
            const purchasesData = localStorage.getItem('purchases');
            const repairsData = localStorage.getItem('repairs');
            const outsourceData = localStorage.getItem('outsource');
            const invoicesData = localStorage.getItem('invoices');
            const quotationsData = localStorage.getItem('quotations');
            const pickDropsData = localStorage.getItem('pickDrops');
            const deliveriesData = localStorage.getItem('deliveries');
            const paymentsData = localStorage.getItem('payments');
            const usersData = localStorage.getItem('users');

            // Only load data if it exists in localStorage
            if (inventoryData) inventory = JSON.parse(inventoryData);
            if (vendorsData) vendors = JSON.parse(vendorsData);
            if (customersData) customers = JSON.parse(customersData);
            if (purchasesData) purchases = JSON.parse(purchasesData);
            if (repairsData) repairs = JSON.parse(repairsData);
            if (outsourceData) outsource = JSON.parse(outsourceData);
            if (invoicesData) invoices = JSON.parse(invoicesData);
            if (quotationsData) quotations = JSON.parse(quotationsData);
            if (pickDropsData) pickDrops = JSON.parse(pickDropsData);
            if (deliveriesData) deliveries = JSON.parse(deliveriesData);
            if (paymentsData) payments = JSON.parse(paymentsData);
            if (usersData) users = JSON.parse(usersData);

            console.log('Data loaded from local storage');
            console.log('Loaded data counts:', {
                inventory: inventory ? inventory.length : 0,
                vendors: vendors ? vendors.length : 0,
                customers: customers ? customers.length : 0,
                repairs: repairs ? repairs.length : 0,
                invoices: invoices ? invoices.length : 0,
                quotations: quotations ? quotations.length : 0
            });
            
            // Only call render functions if they exist
            if (typeof renderAll === 'function') {
                renderAll();
            }
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
            this.loadDefaultData();
        }
    }

    // Load default data
    loadDefaultData() {
        // Check if main script functions are available
        if (typeof getDefaultInventory === 'undefined') {
            console.log('Main script functions not available, using basic defaults');
            // Set basic defaults
            if (typeof inventory !== 'undefined') inventory = [];
            if (typeof vendors !== 'undefined') vendors = [];
            if (typeof customers !== 'undefined') customers = [];
            if (typeof purchases !== 'undefined') purchases = [];
            if (typeof repairs !== 'undefined') repairs = [];
            if (typeof outsource !== 'undefined') outsource = [];
            if (typeof invoices !== 'undefined') invoices = [];
            if (typeof quotations !== 'undefined') quotations = [];
            if (typeof pickDrops !== 'undefined') pickDrops = [];
            if (typeof deliveries !== 'undefined') deliveries = [];
            if (typeof payments !== 'undefined') payments = [];
            if (typeof users !== 'undefined') users = [];
            return;
        }

        inventory = getDefaultInventory();
        vendors = getDefaultVendors();
        customers = getDefaultCustomers();
        purchases = [];
        repairs = [];
        outsource = [];
        invoices = [];
        quotations = [];
        pickDrops = [];
        deliveries = [];
        payments = [];
        users = getDefaultUsers();
        
        console.log('Default data loaded');
        
        // Only call render functions if they exist
        if (typeof renderAll === 'function') {
            renderAll();
        }
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    // Sync data (save to both server and local)
    async syncData() {
        await this.saveDataToServer();
        this.saveDataToLocal();
    }
}

// Create global data manager instance
const dataManager = new DataManager(); 