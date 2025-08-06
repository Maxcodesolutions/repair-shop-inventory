// Firebase Configuration
// Replace with your Firebase project settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();

// Data management functions
class DataManager {
    constructor() {
        this.currentUser = null;
        this.isOnline = false;
    }

    // Initialize data manager
    async init() {
        try {
            // Check if user is authenticated
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.isOnline = true;
                    console.log('User authenticated:', user.email);
                    this.loadDataFromServer();
                } else {
                    this.currentUser = null;
                    this.isOnline = false;
                    console.log('User not authenticated');
                    this.loadDataFromLocal();
                }
            });
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.loadDataFromLocal();
        }
    }

    // Save data to server
    async saveDataToServer() {
        if (!this.currentUser || !this.isOnline) {
            this.saveDataToLocal();
            return;
        }

        try {
            const userData = {
                inventory: inventory,
                vendors: vendors,
                customers: customers,
                purchases: purchases,
                repairs: repairs,
                outsource: outsource,
                invoices: invoices,
                quotations: quotations,
                pickDrops: pickDrops,
                deliveries: deliveries,
                payments: payments,
                users: users,
                lastUpdated: new Date().toISOString()
            };

            await db.collection('users').doc(this.currentUser.uid).set(userData);
            console.log('Data saved to server successfully');
        } catch (error) {
            console.error('Error saving to server:', error);
            this.saveDataToLocal();
        }
    }

    // Load data from server
    async loadDataFromServer() {
        if (!this.currentUser || !this.isOnline) {
            this.loadDataFromLocal();
            return;
        }

        try {
            const doc = await db.collection('users').doc(this.currentUser.uid).get();
            if (doc.exists) {
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
            renderAll();
            updateDashboard();
        } catch (error) {
            console.error('Error loading from local storage:', error);
            this.loadDefaultData();
        }
    }

    // Load default data
    loadDefaultData() {
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
        renderAll();
        updateDashboard();
    }

    // Sync data (save to both server and local)
    async syncData() {
        await this.saveDataToServer();
        this.saveDataToLocal();
    }
}

// Create global data manager instance
const dataManager = new DataManager(); 