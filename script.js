// Login functionality
let isLoggedIn = false;

// Check if user is already logged in
function checkLoginStatus() {
    const loginStatus = localStorage.getItem('loginStatus');
    const currentUserId = localStorage.getItem('currentUserId');
    
    if (loginStatus === 'true' && currentUserId) {
        // Restore current user
        currentUser = users.find(u => u.id === parseInt(currentUserId));
        if (currentUser) {
            isLoggedIn = true;
            showApp();
        } else {
            // User not found, clear login status
            localStorage.removeItem('loginStatus');
            localStorage.removeItem('currentUserId');
            showLogin();
        }
    } else {
        showLogin();
    }
}

// Show login overlay
function showLogin() {
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('app-container').classList.remove('logged-in');
    isLoggedIn = false;
}

// Show application
function showApp() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('app-container').classList.add('logged-in');
    isLoggedIn = true;
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    const loginSuccess = document.getElementById('login-success');
    
    // Hide previous messages
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
    
    // Authenticate user
    const authenticatedUser = authenticateUser(username, password);
    if (authenticatedUser) {
        // Show success message
        loginSuccess.style.display = 'block';
        
        // Store login status
        localStorage.setItem('loginStatus', 'true');
        localStorage.setItem('currentUserId', authenticatedUser.id);
        
        // Hide login and show app after a short delay
        setTimeout(() => {
            showApp();
            // Initialize the application
            initializeApp();
        }, 1000);
    } else {
        // Show error message
        loginError.style.display = 'block';
        document.getElementById('password').value = '';
    }
}

// Handle logout
function logout() {
    // Clear login status
    localStorage.removeItem('loginStatus');
    isLoggedIn = false;
    
    // Show login overlay
    showLogin();
    
    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-success').style.display = 'none';
}



// Initialize application after login
function initializeApp() {
    console.log('Initializing application...');
    loadData();
    setupEventListeners();
    renderAll();
    updateDashboard();
    
    // Apply user permissions
    applyUserPermissions();
    
    // Restore the last active section (only if user has permission)
    const lastSection = localStorage.getItem('lastActiveSection') || 'dashboard';
    console.log('Attempting to restore section:', lastSection);
    
    // Add a small delay to ensure DOM is fully ready
    setTimeout(() => {
        if (hasPermission(lastSection)) {
            showSection(lastSection);
        } else {
            // Show first available section
            const availableSections = currentUser.permissions.filter(p => p !== 'users');
            if (availableSections.length > 0) {
                showSection(availableSections[0]);
            }
        }
        console.log('Section restoration completed');
    }, 100);
    
    console.log('Application initialized successfully');
    console.log('Loaded quotations:', quotations);
    console.log('Restored section:', lastSection);
}

// Global data
let inventory = [];
let vendors = [];
let customers = [];
let purchases = [];
let repairs = [];
let outsourceRepairs = [];
let invoices = [];
let quotations = [];
let pickDrops = [];
let deliveries = [];
let payments = [];
let users = [];
let currentUser = null;

// User roles and permissions
const userRoles = {
    admin: {
        name: 'Admin',
        permissions: ['dashboard', 'inventory', 'purchases', 'vendors', 'customers', 'repairs', 'outsource', 'invoices', 'quotations', 'pickdrop', 'delivery', 'payments', 'reports', 'users']
    },
    manager: {
        name: 'Manager',
        permissions: ['dashboard', 'inventory', 'purchases', 'vendors', 'customers', 'repairs', 'outsource', 'invoices', 'quotations', 'pickdrop', 'delivery', 'payments', 'reports']
    },
    technician: {
        name: 'Technician',
        permissions: ['dashboard', 'inventory', 'repairs', 'outsource', 'customers', 'delivery']
    },
    sales: {
        name: 'Sales',
        permissions: ['dashboard', 'customers', 'invoices', 'quotations', 'pickdrop', 'delivery', 'payments']
    },
    viewer: {
        name: 'Viewer',
        permissions: ['dashboard', 'inventory', 'customers', 'repairs', 'delivery', 'reports']
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking login status...');
    
    // Uncomment the next line to reset all data and start fresh
    // localStorage.clear();
    
    // Load data first
    loadData();
    
    checkLoginStatus();
    
    // Setup login form event listener
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Setup customer autocomplete
    setupCustomerAutocomplete();
});

// Data management
function loadData() {
    console.log('Loading data from localStorage...');
    
    inventory = JSON.parse(localStorage.getItem('inventory')) || getDefaultInventory();
    // Migrate existing items to include units if they don't have them
    inventory.forEach(item => {
        if (!item.unit) {
            item.unit = 'pcs'; // Default to pieces for existing items
            console.log('Migrated item:', item.name, 'to have unit:', item.unit);
        }
    });
    vendors = JSON.parse(localStorage.getItem('vendors')) || getDefaultVendors();
    customers = JSON.parse(localStorage.getItem('customers')) || getDefaultCustomers();
    purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    repairs = JSON.parse(localStorage.getItem('repairs')) || [];
    outsourceRepairs = JSON.parse(localStorage.getItem('outsourceRepairs')) || [];
    invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    quotations = JSON.parse(localStorage.getItem('quotations')) || [];
    pickDrops = JSON.parse(localStorage.getItem('pickDrops')) || [];
    payments = JSON.parse(localStorage.getItem('payments')) || [];
    // Load users with error handling
    try {
        const usersData = localStorage.getItem('users');
        
        if (usersData) {
            users = JSON.parse(usersData);
        } else {
            users = getDefaultUsers();
        }
    } catch (error) {
        console.error('Error loading users from localStorage:', error);
        users = getDefaultUsers();
    }
    
    deliveries = JSON.parse(localStorage.getItem('deliveries')) || getDefaultDeliveries();
    
    // Migrate existing users to include delivery and payment permissions
    users.forEach(user => {
        if (user.permissions && !user.permissions.includes('delivery')) {
            user.permissions.push('delivery');
            console.log('Added delivery permission to user:', user.username);
        }
        if (user.permissions && !user.permissions.includes('payments')) {
            user.permissions.push('payments');
            console.log('Added payments permission to user:', user.username);
        }
    });
    
    console.log('Final users after migration:', users);
    
    console.log('Loaded quotations from localStorage:', quotations);
    console.log('Raw quotations from localStorage:', localStorage.getItem('quotations'));
    console.log('Quotations array length:', quotations.length);
    console.log('All loaded data:', {
        inventory: inventory.length,
        vendors: vendors.length,
        customers: customers.length,
        purchases: purchases.length,
        repairs: repairs.length,
        outsourceRepairs: outsourceRepairs.length,
        invoices: invoices.length,
        quotations: quotations.length,
        users: users.length
    });
}

function saveData() {
    console.log('Saving data to localStorage...');
    console.log('Saving quotations:', quotations);
    
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('vendors', JSON.stringify(vendors));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('purchases', JSON.stringify(purchases));
    localStorage.setItem('repairs', JSON.stringify(repairs));
    localStorage.setItem('outsourceRepairs', JSON.stringify(outsourceRepairs));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('quotations', JSON.stringify(quotations));
    localStorage.setItem('pickDrops', JSON.stringify(pickDrops));
    localStorage.setItem('payments', JSON.stringify(payments));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
    
    console.log('Data saved successfully');
    console.log('Quotations in localStorage after save:', localStorage.getItem('quotations'));
}

function getDefaultInventory() {
    return [
        {id: 1, name: "Laptop Battery", category: "laptop-parts", brand: "generic", model: "Universal", sku: "LAP-BAT-001", quantity: 15, unit: "pcs", price: 45.99},
        {id: 2, name: "iPhone Screen", category: "mobile-parts", brand: "apple", model: "iPhone 12/13", sku: "IPH-SCR-001", quantity: 8, unit: "pcs", price: 89.99},
        {id: 3, name: "Screwdriver Set", category: "tools", brand: "generic", model: "Professional", sku: "TOOL-SCR-001", quantity: 25, unit: "set", price: 12.99}
    ];
}

function getDefaultVendors() {
    return [
        {id: 1, name: "TechParts Pro", email: "contact@techpartspro.com", phone: "+1-555-0123"},
        {id: 2, name: "MobileFix Supplies", email: "orders@mobilefix.com", phone: "+1-555-0456"}
    ];
}

function getDefaultCustomers() {
    return [
        {
            id: 1,
            name: "Rahul Sharma",
            phone: "+91-98765-43210",
            email: "rahul.sharma@email.com",
            address: "123 Main Street, Mumbai, Maharashtra",
            preferredDevice: "laptop",
            status: "active",
            notes: "Regular customer, prefers quick service",
            totalRepairs: 5,
            lastVisit: "2024-01-15"
        },
        {
            id: 2,
            name: "Priya Patel",
            phone: "+91-87654-32109",
            email: "priya.patel@email.com",
            address: "456 Park Avenue, Delhi, Delhi",
            preferredDevice: "mobile",
            status: "active",
            notes: "iPhone specialist, very particular about quality",
            totalRepairs: 3,
            lastVisit: "2024-01-20"
        }
    ];
}

function getDefaultUsers() {
    return [
        {
            id: 1,
            username: 'admin',
            password: 'admin',
            fullName: 'System Administrator',
            email: 'admin@repairmaniac.com',
            role: 'admin',
            status: 'active',
            permissions: ['dashboard', 'inventory', 'purchases', 'vendors', 'customers', 'repairs', 'outsource', 'invoices', 'quotations', 'pickdrop', 'delivery', 'payments', 'reports', 'users'],
            lastLogin: null,
            createdAt: new Date().toISOString()
        }
    ];
}

// User management functions
function authenticateUser(username, password) {
    console.log('Attempting to authenticate user:', username);
    console.log('Available users:', users);
    
    const user = users.find(u => u.username === username && u.password === password && u.status === 'active');
    if (user) {
        console.log('User authenticated successfully:', user);
        currentUser = user;
        user.lastLogin = new Date().toISOString();
        saveData();
        return user;
    } else {
        console.log('Authentication failed. User not found or invalid credentials.');
        console.log('Looking for user with username:', username);
        console.log('Users in system:', users.map(u => ({ username: u.username, status: u.status })));
    }
    return null;
}

function hasPermission(permission) {
    if (!currentUser) return false;
    return currentUser.permissions.includes(permission);
}

function applyUserPermissions() {
    if (!currentUser) return;
    
    console.log('Applying permissions for user:', currentUser.username);
    console.log('User permissions:', currentUser.permissions);
    
    // Hide/show navigation links based on permissions
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const section = link.getAttribute('data-section');
        if (section && !hasPermission(section)) {
            link.classList.add('nav-link-hidden');
            console.log('Hiding nav link for section:', section);
        } else {
            link.classList.remove('nav-link-hidden');
            console.log('Showing nav link for section:', section);
        }
    });
    
    // Hide/show content sections based on permissions
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        const sectionId = section.id;
        if (!hasPermission(sectionId)) {
            section.classList.add('section-hidden');
            console.log('Hiding content section:', sectionId);
        } else {
            section.classList.remove('section-hidden');
            console.log('Showing content section:', sectionId);
        }
    });
    
    // Update current user name in header
    document.getElementById('current-user-name').textContent = currentUser.fullName;
}

function createUser(userData) {
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username: userData.username,
        password: userData.password,
        fullName: userData.fullName,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        permissions: userData.permissions,
        lastLogin: null,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveData();
    renderUsers();
    return newUser;
}

function updateUser(userId, userData) {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userData };
        saveData();
        renderUsers();
        return users[userIndex];
    }
    return null;
}

function deleteUser(userId) {
    if (currentUser.id === userId) {
        alert('You cannot delete your own account!');
        return false;
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users.splice(userIndex, 1);
        saveData();
        renderUsers();
        return true;
    }
    return false;
}

function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td><span class="user-role-badge role-${user.role}">${userRoles[user.role]?.name || user.role}</span></td>
            <td>
                <div class="user-permissions">
                    ${user.permissions.slice(0, 3).map(p => `<span class="permission-tag">${p}</span>`).join('')}
                    ${user.permissions.length > 3 ? `<span class="permission-tag">+${user.permissions.length - 3} more</span>` : ''}
                </div>
            </td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
            <td><span class="user-status-${user.status}">${user.status}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.id !== currentUser?.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Populate the modal with user data
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-fullname').value = user.fullName;
    document.getElementById('user-email').value = user.email;
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;
    
    // Set permissions
    user.permissions.forEach(permission => {
        const checkbox = document.getElementById(`perm-${permission}`);
        if (checkbox) checkbox.checked = true;
    });
    
    // Show modal in edit mode
    showModal('add-user-modal');
}

// Event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Forms
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);
    document.getElementById('add-vendor-form').addEventListener('submit', handleAddVendor);
    document.getElementById('add-customer-form').addEventListener('submit', handleAddCustomer);
    document.getElementById('add-purchase-form').addEventListener('submit', handleAddPurchase);
    document.getElementById('add-repair-form').addEventListener('submit', handleAddRepair);
    document.getElementById('add-outsource-form').addEventListener('submit', handleAddOutsource);
    document.getElementById('add-invoice-form').addEventListener('submit', handleAddInvoice);
    document.getElementById('add-quotation-form').addEventListener('submit', handleAddQuotation);
    document.getElementById('add-pickdrop-form').addEventListener('submit', handleAddPickDrop);
    document.getElementById('add-delivery-form').addEventListener('submit', handleAddDelivery);
    document.getElementById('add-payment-form').addEventListener('submit', handleAddPayment);
    document.getElementById('add-user-form').addEventListener('submit', handleAddUser);

    // Search functionality
    document.getElementById('search-inventory').addEventListener('input', filterInventory);
    document.getElementById('category-filter').addEventListener('change', filterInventory);
    document.getElementById('brand-filter').addEventListener('change', filterInventory);
    document.getElementById('stock-filter').addEventListener('change', filterInventory);
    
    // Outsource search functionality
    document.getElementById('search-outsource').addEventListener('input', filterOutsource);
    document.getElementById('outsource-status-filter').addEventListener('change', filterOutsource);
    document.getElementById('outsource-vendor-filter').addEventListener('change', filterOutsource);
    
    // Customer search functionality
    document.getElementById('search-customers').addEventListener('input', filterCustomers);
    document.getElementById('customer-status-filter').addEventListener('change', filterCustomers);
    
    // Outsource customer search functionality
    document.getElementById('outsource-customer').addEventListener('input', searchCustomersForOutsource);
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.customer-search-container')) {
            hideCustomerSuggestions();
        }
    });
    
    // Invoice customer search functionality
    document.getElementById('invoice-customer').addEventListener('input', searchCustomersForInvoice);
    
    // Invoice calculations
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('invoice-quantity') || 
            e.target.classList.contains('invoice-price') ||
            e.target.id === 'invoice-tax-rate' ||
            e.target.id === 'invoice-discount') {
            calculateInvoiceTotals();
        }
    });
    
    // Invoice item search functionality
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('invoice-item-name')) {
            searchInventoryForInvoice(e.target);
        }
    });
    
    // Hide item suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.item-search-container')) {
            hideAllItemSuggestions();
        }
    });
    
    // Invoice search functionality
    document.getElementById('search-invoices').addEventListener('input', filterInvoices);
    document.getElementById('invoice-status-filter').addEventListener('change', filterInvoices);
    document.getElementById('invoice-customer-filter').addEventListener('change', filterInvoices);
    
    // Quotation customer search functionality
    document.getElementById('quotation-customer').addEventListener('input', searchCustomersForQuotation);
    
    // Quotation calculations
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('quotation-quantity') || 
            e.target.classList.contains('quotation-price') ||
            e.target.id === 'quotation-tax-rate' ||
            e.target.id === 'quotation-discount') {
            calculateQuotationTotals();
        }
    });
    
    // Quotation item search functionality
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('quotation-item-name')) {
            searchInventoryForQuotation(e.target);
        }
    });
    
    // Quotation search functionality
    document.getElementById('search-quotations').addEventListener('input', filterQuotations);
    document.getElementById('quotation-status-filter').addEventListener('change', filterQuotations);
    document.getElementById('quotation-customer-filter').addEventListener('change', filterQuotations);
    
    // User search functionality
    document.getElementById('search-users').addEventListener('input', filterUsers);
    document.getElementById('user-role-filter').addEventListener('change', filterUsers);
    document.getElementById('user-status-filter').addEventListener('change', filterUsers);
    
    // Pick & Drop search functionality
    document.getElementById('search-pickdrop').addEventListener('input', filterPickDrops);
    document.getElementById('pickdrop-status-filter').addEventListener('change', filterPickDrops);
    document.getElementById('pickdrop-customer-filter').addEventListener('change', filterPickDrops);
    
    // Delivery filters
    document.getElementById('search-delivery').addEventListener('input', filterDeliveries);
    document.getElementById('delivery-status-filter').addEventListener('change', filterDeliveries);
    document.getElementById('delivery-customer-filter').addEventListener('change', filterDeliveries);
    document.getElementById('search-payments').addEventListener('input', filterPayments);
    document.getElementById('payment-status-filter').addEventListener('change', filterPayments);
    document.getElementById('payment-method-filter').addEventListener('change', filterPayments);
    document.getElementById('payment-customer-filter').addEventListener('change', filterPayments);
}

// Navigation
function showSection(sectionName) {
    console.log('showSection called with:', sectionName);
    
    // Check if section element exists
    const sectionElement = document.getElementById(sectionName);
    if (!sectionElement) {
        console.error('Section element not found:', sectionName);
        return;
    }
    
    // Check if nav link exists
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (!navLink) {
        console.error('Nav link not found for section:', sectionName);
        return;
    }
    
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    sectionElement.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    navLink.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        inventory: 'Inventory Management',
        purchases: 'Purchase Management',
        vendors: 'Vendor Management',
        customers: 'Customer Management',
        repairs: 'Repair Management',
        outsource: 'Outsource Repair Management',
        invoices: 'Invoice Management',
        quotations: 'Quotation Management',
        pickdrop: 'Pick & Drop Management',
        delivery: 'Delivery Management',
        payments: 'Payment Management',
        reports: 'Reports & Analytics'
    };
    document.getElementById('page-title').textContent = titles[sectionName] || 'Dashboard';
    
    // Save the current section to localStorage
    localStorage.setItem('lastActiveSection', sectionName);
    console.log('Saved active section:', sectionName);
    
    // Re-render data for specific sections to ensure fresh data
    if (sectionName === 'quotations') {
        console.log('Re-rendering quotations data...');
        renderQuotations();
    } else if (sectionName === 'inventory') {
        renderInventory();
    } else if (sectionName === 'customers') {
        renderCustomers();
    } else if (sectionName === 'repairs') {
        renderRepairs();
    } else if (sectionName === 'invoices') {
        renderInvoices();
    } else if (sectionName === 'pickdrop') {
        renderPickDrops();
    } else if (sectionName === 'delivery') {
        renderDeliveries();
    } else if (sectionName === 'payments') {
        renderPayments();
    }
    
    console.log('Section display completed for:', sectionName);
}

function renderPayments() {
    const tbody = document.getElementById('payments-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const statusClass = `status-${payment.status}`;
        const invoice = payment.invoiceId ? invoices.find(inv => inv.id === parseInt(payment.invoiceId)) : null;
        
        const row = `
            <tr>
                <td>PAY-${payment.id.toString().padStart(4, '0')}</td>
                <td>${payment.customer}</td>
                <td>${invoice ? `INV-${invoice.id.toString().padStart(4, '0')}` : 'N/A'}</td>
                <td>₹${payment.amount.toFixed(2)}</td>
                <td>${payment.method}</td>
                <td>${payment.date}</td>
                <td><span class="status-badge ${statusClass}">${payment.status}</span></td>
                <td>${payment.reference || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewPayment(${payment.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="editPayment(${payment.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePayment(${payment.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    updatePaymentSummary();
}

function updatePaymentSummary() {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    
    // Update summary cards if they exist
    const summaryCards = document.querySelector('.payment-summary-cards');
    if (summaryCards) {
        summaryCards.innerHTML = `
            <div class="summary-card">
                <h3>${totalPayments}</h3>
                <p>Total Payments</p>
            </div>
            <div class="summary-card">
                <h3>₹${totalAmount.toFixed(2)}</h3>
                <p>Total Amount</p>
            </div>
            <div class="summary-card">
                <h3>${completedPayments}</h3>
                <p>Completed</p>
            </div>
            <div class="summary-card">
                <h3>${pendingPayments}</h3>
                <p>Pending</p>
            </div>
        `;
    }
}

function viewPayment(id) {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    alert(`Payment Details:\nID: PAY-${payment.id}\nCustomer: ${payment.customer}\nAmount: ₹${payment.amount}\nMethod: ${payment.method}\nDate: ${payment.date}\nStatus: ${payment.status}`);
}

function editPayment(id) {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    // For now, just show an alert. You can implement a full edit modal later
    alert('Edit payment functionality will be implemented in the next update.');
}

function deletePayment(id) {
    if (confirm('Are you sure you want to delete this payment?')) {
        payments = payments.filter(p => p.id !== id);
        saveData();
        renderPayments();
        updateDashboard();
    }
}



// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    if (modalId === 'add-purchase-modal') {
        populatePurchaseModal();
    }
    if (modalId === 'add-outsource-modal') {
        populateOutsourceModal();
    }
    if (modalId === 'add-invoice-modal') {
        populateInvoiceModal();
    }
    if (modalId === 'add-quotation-modal') {
        populateQuotationModal();
    }
    if (modalId === 'add-delivery-modal') {
        populateDeliveryModal();
    }
    if (modalId === 'add-payment-modal') {
        populatePaymentModal();
    }
}

function populatePaymentModal() {
    // Populate invoice dropdown
    const invoiceSelect = document.getElementById('payment-invoice');
    if (invoiceSelect) {
        invoiceSelect.innerHTML = '<option value="">Select Invoice</option>';
        invoices.forEach(invoice => {
            if (invoice.status !== 'paid') {
                invoiceSelect.innerHTML += `<option value="${invoice.id}">INV-${invoice.id.toString().padStart(4, '0')} - ${invoice.customer} - ₹${invoice.totalAmount}</option>`;
            }
        });
    }
    
    // Set default date to today
    const dateInput = document.getElementById('payment-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Set default reference
    const referenceInput = document.getElementById('payment-reference');
    if (referenceInput) {
        referenceInput.value = `REF-${Date.now()}`;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById(modalId).querySelector('form').reset();
    
    // Reset modal title and clear editing flag for add-item-modal
    if (modalId === 'add-item-modal') {
        document.querySelector('#add-item-modal .modal-header h3').textContent = 'Add New Item';
        document.getElementById('add-item-form').removeAttribute('data-editing-id');
    }
    
    // Reset modal title and clear editing flag for add-vendor-modal
    if (modalId === 'add-vendor-modal') {
        document.querySelector('#add-vendor-modal .modal-header h3').textContent = 'Add New Vendor';
        document.getElementById('add-vendor-form').removeAttribute('data-editing-id');
    }
    
    // Reset modal title and clear editing flag for add-customer-modal
    if (modalId === 'add-customer-modal') {
        document.querySelector('#add-customer-modal .modal-header h3').textContent = 'Add New Customer';
        document.getElementById('add-customer-form').removeAttribute('data-editing-id');
    }
    
    // Clear repair ID for add-invoice-modal
    if (modalId === 'add-invoice-modal') {
        document.getElementById('add-invoice-form').removeAttribute('data-repair-id');
    }
}

function populatePurchaseModal() {
    const vendorSelect = document.getElementById('purchase-vendor');
    vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
    vendors.forEach(vendor => {
        vendorSelect.innerHTML += `<option value="${vendor.id}">${vendor.name}</option>`;
    });
}

function populateOutsourceModal() {
    const vendorSelect = document.getElementById('outsource-vendor');
    vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
    vendors.forEach(vendor => {
        vendorSelect.innerHTML += `<option value="${vendor.id}">${vendor.name}</option>`;
    });
    
    // Populate vendor filter dropdown
    const vendorFilter = document.getElementById('outsource-vendor-filter');
    vendorFilter.innerHTML = '<option value="">All Vendors</option>';
    vendors.forEach(vendor => {
        vendorFilter.innerHTML += `<option value="${vendor.id}">${vendor.name}</option>`;
    });
}

function populateInvoiceModal() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    document.getElementById('invoice-date').value = today;
    document.getElementById('invoice-due-date').value = dueDateStr;
    
    // Populate customer filter dropdown
    const customerFilter = document.getElementById('invoice-customer-filter');
    customerFilter.innerHTML = '<option value="">All Customers</option>';
    customers.forEach(customer => {
        customerFilter.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
    });
}

function populateQuotationModal() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7); // 7 days validity
    const validUntilStr = validUntil.toISOString().split('T')[0];
    
    document.getElementById('quotation-date').value = today;
    document.getElementById('quotation-valid-until').value = validUntilStr;
    
    // Populate customer filter dropdown
    const customerFilter = document.getElementById('quotation-customer-filter');
    customerFilter.innerHTML = '<option value="">All Customers</option>';
    customers.forEach(customer => {
        customerFilter.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
    });
}

function populateDeliveryModal() {
    // Set default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('delivery-scheduled-date').value = today;
    
    // Populate repair options with completed repairs
    const repairSelect = document.getElementById('delivery-repair-id');
    repairSelect.innerHTML = '<option value="">Select Repair</option>';
    
    repairs.filter(repair => repair.status === 'completed' || repair.status === 'ready-for-delivery')
          .forEach(repair => {
        repairSelect.innerHTML += `<option value="${repair.id}">JC-${repair.id.toString().padStart(4, '0')} - ${repair.customer} (${repair.deviceType})</option>`;
    });
    
    // Populate customer filter dropdown
    const customerFilter = document.getElementById('delivery-customer-filter');
    customerFilter.innerHTML = '<option value="">All Customers</option>';
    customers.forEach(customer => {
        customerFilter.innerHTML += `<option value="${customer.name}">${customer.name}</option>`;
    });
}

function populateInvoiceFromRepair(repair) {
    console.log('populateInvoiceFromRepair called with repair:', repair);
    
    // Set customer
    document.getElementById('invoice-customer').value = repair.customer;
    
    // Set dates
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-due-date').value = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from now
    
    // Set default tax rate and discount
    document.getElementById('invoice-tax-rate').value = '18';
    document.getElementById('invoice-discount').value = '0';
    
    // Clear existing items
    const itemsContainer = document.getElementById('invoice-items-list');
    itemsContainer.innerHTML = '';
    
    // Add repair service as an item
    const repairItem = {
        name: `${repair.deviceType} Repair - ${repair.issue}`,
        quantity: 1,
        price: 0, // Will be filled by user
        total: 0
    };
    
    addInvoiceItemWithData(repairItem);
    
    // Store repair ID for later use
    document.getElementById('add-invoice-form').setAttribute('data-repair-id', repair.id);
    
    console.log('Invoice form populated with repair data');
}

// Form handlers
function handleAddItem(e) {
    e.preventDefault();
    
            const itemName = document.getElementById('item-name').value;
        const itemCategory = document.getElementById('item-category').value;
        const itemBrand = document.getElementById('item-brand').value;
        const itemModel = document.getElementById('item-model').value;
        const itemSku = document.getElementById('item-sku').value;
        const itemQuantity = parseInt(document.getElementById('item-quantity').value);
        const itemUnit = document.getElementById('item-unit').value;
        const itemPrice = parseFloat(document.getElementById('item-price').value);
        const itemDescription = document.getElementById('item-description').value;
    
    // Check if we're editing an existing item (check if the form has an editing flag)
    const editingItemId = document.getElementById('add-item-form').getAttribute('data-editing-id');
    
    if (editingItemId) {
        // Update existing item
        const existingItemIndex = inventory.findIndex(item => item.id === parseInt(editingItemId));
        if (existingItemIndex !== -1) {
            console.log('Updating item with unit:', itemUnit);
            inventory[existingItemIndex] = {
                ...inventory[existingItemIndex],
                name: itemName,
                category: itemCategory,
                brand: itemBrand,
                model: itemModel,
                sku: itemSku,
                quantity: itemQuantity,
                unit: itemUnit,
                price: itemPrice,
                description: itemDescription
            };
            console.log('Updated item:', inventory[existingItemIndex]);
        }
        // Clear the editing flag
        document.getElementById('add-item-form').removeAttribute('data-editing-id');
    } else {
        // Create new item
        const newItem = {
            id: Date.now(),
            name: itemName,
            category: itemCategory,
            brand: itemBrand,
            model: itemModel,
            sku: itemSku,
            quantity: itemQuantity,
            unit: itemUnit,
            price: itemPrice,
            description: itemDescription
        };
        inventory.push(newItem);
    }

    saveData();
    closeModal('add-item-modal');
    updateDashboard();
    renderInventory();
}

function handleAddVendor(e) {
    e.preventDefault();
    
    const vendorName = document.getElementById('vendor-name').value;
    const vendorEmail = document.getElementById('vendor-email').value;
    const vendorPhone = document.getElementById('vendor-phone').value;
    const vendorAddress = document.getElementById('vendor-address').value;
    
    // Check if we're editing an existing vendor
    const editingVendorId = document.getElementById('add-vendor-form').getAttribute('data-editing-id');
    
    if (editingVendorId) {
        // Update existing vendor
        const existingVendorIndex = vendors.findIndex(vendor => vendor.id === parseInt(editingVendorId));
        if (existingVendorIndex !== -1) {
            vendors[existingVendorIndex] = {
                ...vendors[existingVendorIndex],
                name: vendorName,
                email: vendorEmail,
                phone: vendorPhone,
                address: vendorAddress
            };
        }
        // Clear the editing flag
        document.getElementById('add-vendor-form').removeAttribute('data-editing-id');
    } else {
        // Create new vendor
        const newVendor = {
            id: Date.now(),
            name: vendorName,
            email: vendorEmail,
            phone: vendorPhone,
            address: vendorAddress
        };
        vendors.push(newVendor);
    }

    saveData();
    closeModal('add-vendor-modal');
    renderVendors();
}

function handleAddCustomer(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const customerAddress = document.getElementById('customer-address').value;
    const customerPreferredDevice = document.getElementById('customer-preferred-device').value;
    const customerStatus = document.getElementById('customer-status').value;
    const customerNotes = document.getElementById('customer-notes').value;
    
    // Check if we're editing an existing customer
    const editingCustomerId = document.getElementById('add-customer-form').getAttribute('data-editing-id');
    
    if (editingCustomerId) {
        // Update existing customer
        const existingCustomerIndex = customers.findIndex(customer => customer.id === parseInt(editingCustomerId));
        if (existingCustomerIndex !== -1) {
            customers[existingCustomerIndex] = {
                ...customers[existingCustomerIndex],
                name: customerName,
                phone: customerPhone,
                email: customerEmail,
                address: customerAddress,
                preferredDevice: customerPreferredDevice,
                status: customerStatus,
                notes: customerNotes
            };
        }
        // Clear the editing flag
        document.getElementById('add-customer-form').removeAttribute('data-editing-id');
    } else {
        // Create new customer
        const newCustomer = {
            id: Date.now(),
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress,
            preferredDevice: customerPreferredDevice,
            status: customerStatus,
            notes: customerNotes,
            totalRepairs: 0,
            lastVisit: new Date().toISOString().split('T')[0]
        };
        customers.push(newCustomer);
    }

    saveData();
    closeModal('add-customer-modal');
    renderCustomers();
}

function handleAddPurchase(e) {
    e.preventDefault();
    
    const vendorId = parseInt(document.getElementById('purchase-vendor').value);
    const vendor = vendors.find(v => v.id === vendorId);
    const purchaseDate = document.getElementById('purchase-date').value;
    
    const purchaseItems = [];
    let totalAmount = 0;
    
    document.querySelectorAll('.purchase-item').forEach(itemDiv => {
        const itemId = parseInt(itemDiv.querySelector('.purchase-item-select').value);
        const quantity = parseInt(itemDiv.querySelector('.purchase-quantity').value);
        const price = parseFloat(itemDiv.querySelector('.purchase-price').value);
        
        if (itemId && quantity && price) {
            const item = inventory.find(i => i.id === itemId);
            purchaseItems.push({
                itemId,
                itemName: item.name,
                quantity,
                price,
                total: quantity * price
            });
            totalAmount += quantity * price;
        }
    });

    const newPurchase = {
        id: Date.now(),
        vendorId,
        vendorName: vendor.name,
        date: purchaseDate,
        items: purchaseItems,
        totalAmount,
        status: 'pending'
    };

    purchases.push(newPurchase);
    saveData();
    closeModal('add-purchase-modal');
    updateDashboard();
    renderPurchases();
}

function handleAddRepair(e) {
    e.preventDefault();
    
    const repairData = {
        customer: document.getElementById('repair-customer').value,
        deviceType: document.getElementById('repair-device').value,
        brand: document.getElementById('repair-brand').value,
        model: document.getElementById('repair-model').value,
        serial: document.getElementById('repair-serial').value,
        issue: document.getElementById('repair-issue').value,
        estimate: parseInt(document.getElementById('repair-estimate').value),
        status: 'pending',
        startDate: new Date().toISOString().split('T')[0],
        images: window.deviceImages?.repair || []
    };
    
    const newRepair = {
        id: repairs.length > 0 ? Math.max(...repairs.map(r => r.id)) + 1 : 1,
        ...repairData,
        createdAt: new Date().toISOString()
    };
    
    repairs.push(newRepair);
    saveData();
    renderRepairs();
    closeModal('add-repair-modal');
    e.target.reset();
    
    // Clear stored images
    if (window.deviceImages) window.deviceImages.repair = [];
    document.getElementById('repair-images-container').innerHTML = '';
}

function handleAddOutsource(e) {
    e.preventDefault();
    
    const vendorId = parseInt(document.getElementById('outsource-vendor').value);
    const vendor = vendors.find(v => v.id === vendorId);
    
    const newOutsource = {
        id: Date.now(),
        customer: document.getElementById('outsource-customer').value,
        deviceType: document.getElementById('outsource-device').value,
        issue: document.getElementById('outsource-issue').value,
        vendorId: vendorId,
        vendorName: vendor.name,
        cost: parseFloat(document.getElementById('outsource-cost').value),
        expectedReturn: document.getElementById('outsource-expected-return').value,
        sentDate: new Date().toISOString().split('T')[0],
        status: 'sent'
    };

    outsourceRepairs.push(newOutsource);
    saveData();
    closeModal('add-outsource-modal');
    updateDashboard();
    renderOutsource();
}

function handleAddInvoice(e) {
    e.preventDefault();
    
    const invoiceItems = [];
    let subtotal = 0;
    
    document.querySelectorAll('.invoice-item').forEach(itemDiv => {
        const name = itemDiv.querySelector('.invoice-item-name').value;
        const quantity = parseInt(itemDiv.querySelector('.invoice-quantity').value);
        const price = parseFloat(itemDiv.querySelector('.invoice-price').value);
        
        if (name && quantity && price) {
            const total = quantity * price;
            invoiceItems.push({
                name,
                quantity,
                price,
                total
            });
            subtotal += total;
        }
    });
    
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value);
    const discount = parseFloat(document.getElementById('invoice-discount').value) || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    
    // Check if this invoice is being created from a repair
    const repairId = document.getElementById('add-invoice-form').getAttribute('data-repair-id');
    
    const newInvoice = {
        id: Date.now(),
        invoiceNumber: generateInvoiceNumber(),
        customer: document.getElementById('invoice-customer').value,
        date: document.getElementById('invoice-date').value,
        dueDate: document.getElementById('invoice-due-date').value,
        items: invoiceItems,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        notes: document.getElementById('invoice-notes').value,
        status: 'draft',
        repairId: repairId ? parseInt(repairId) : null // Link to repair if created from repair
    };

    invoices.push(newInvoice);
    saveData();
    closeModal('add-invoice-modal');
    updateDashboard();
    renderInvoices();
}

function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = invoices.filter(inv => inv.date.startsWith(`${year}-${month}`)).length + 1;
    return `INV-${year}${month}-${String(count).padStart(3, '0')}`;
}

function handleAddQuotation(e) {
    e.preventDefault();
    
    const quotationItems = [];
    let subtotal = 0;
    
    document.querySelectorAll('.quotation-item').forEach(itemDiv => {
        const name = itemDiv.querySelector('.quotation-item-name').value;
        const quantity = parseInt(itemDiv.querySelector('.quotation-quantity').value);
        const price = parseFloat(itemDiv.querySelector('.quotation-price').value);
        
        if (name && quantity && price) {
            const total = quantity * price;
            quotationItems.push({
                name,
                quantity,
                price,
                total
            });
            subtotal += total;
        }
    });
    
    const taxRate = parseFloat(document.getElementById('quotation-tax-rate').value);
    const discount = parseFloat(document.getElementById('quotation-discount').value) || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    
    const newQuotation = {
        id: Date.now(),
        quotationNumber: generateQuotationNumber(),
        customer: document.getElementById('quotation-customer').value,
        deviceType: document.getElementById('quotation-device-type').value,
        deviceBrand: document.getElementById('quotation-device-brand').value,
        deviceModel: document.getElementById('quotation-device-model').value,
        issue: document.getElementById('quotation-issue').value,
        date: document.getElementById('quotation-date').value,
        validUntil: document.getElementById('quotation-valid-until').value,
        items: quotationItems,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        notes: document.getElementById('quotation-notes').value,
        status: 'draft'
    };

    quotations.push(newQuotation);
    console.log('Added new quotation:', newQuotation);
    console.log('All quotations after adding:', quotations);
    saveData();
    closeModal('add-quotation-modal');
    updateDashboard();
    renderQuotations();
}

function handleAddPickDrop(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('pickdrop-customer').value;
    
    // Find customer details from customers array
    const selectedCustomer = customers.find(c => c.name === customerName);
    
    const pickDropData = {
        customer: customerName,
        customerPhone: selectedCustomer ? selectedCustomer.phone : '',
        customerEmail: selectedCustomer ? selectedCustomer.email : '',
        customerAddress: selectedCustomer ? selectedCustomer.address : '',
        deviceType: document.getElementById('pickdrop-device-type').value,
        deviceBrand: document.getElementById('pickdrop-device-brand').value,
        deviceModel: document.getElementById('pickdrop-device-model').value,
        pickupAddress: document.getElementById('pickdrop-pickup-address').value,
        pickupDate: document.getElementById('pickdrop-pickup-date').value,
        pickupTime: document.getElementById('pickdrop-pickup-time').value,
        fee: parseFloat(document.getElementById('pickdrop-fee').value) || 0,
        status: document.getElementById('pickdrop-status').value,
        instructions: document.getElementById('pickdrop-instructions').value,
        notes: document.getElementById('pickdrop-notes').value,
        otpEnabled: document.getElementById('pickdrop-otp-enabled').checked,
        images: window.deviceImages?.pickdrop || []
    };
    
    const newPickDrop = {
        id: pickDrops.length > 0 ? Math.max(...pickDrops.map(p => p.id)) + 1 : 1,
        ...pickDropData,
        createdAt: new Date().toISOString()
    };
    
    pickDrops.push(newPickDrop);
    saveData();
    renderPickDrops();
    closeModal('add-pickdrop-modal');
    e.target.reset();
    
    // Clear stored images
    if (window.deviceImages) window.deviceImages.pickdrop = [];
    document.getElementById('pickdrop-images-container').innerHTML = '';
}

function handleAddUser(e) {
    e.preventDefault();
    
    // Get selected permissions
    const permissions = [];
    const permissionCheckboxes = document.querySelectorAll('.permissions-grid input[type="checkbox"]:checked');
    permissionCheckboxes.forEach(checkbox => {
        const permission = checkbox.id.replace('perm-', '');
        permissions.push(permission);
    });
    
    const userData = {
        username: document.getElementById('user-username').value,
        password: document.getElementById('user-password').value,
        fullName: document.getElementById('user-fullname').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        status: document.getElementById('user-status').value,
        permissions: permissions
    };
    
    // Check if username already exists
    const existingUser = users.find(u => u.username === userData.username);
    if (existingUser) {
        alert('Username already exists! Please choose a different username.');
        return;
    }
    
    createUser(userData);
    closeModal('add-user-modal');
    e.target.reset();
    
    // Reset all permission checkboxes
    document.querySelectorAll('.permissions-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

function handleAddPayment(e) {
    e.preventDefault();
    
    const paymentData = {
        invoiceId: document.getElementById('payment-invoice').value,
        customer: document.getElementById('payment-customer').value,
        amount: parseFloat(document.getElementById('payment-amount').value) || 0,
        method: document.getElementById('payment-method').value,
        date: document.getElementById('payment-date').value,
        reference: document.getElementById('payment-reference').value,
        notes: document.getElementById('payment-notes').value,
        status: 'completed'
    };
    
    const newPayment = {
        id: payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1,
        ...paymentData,
        createdAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    
    // Update invoice status if payment is for an invoice
    if (paymentData.invoiceId) {
        const invoice = invoices.find(inv => inv.id === parseInt(paymentData.invoiceId));
        if (invoice) {
            invoice.status = 'paid';
            invoice.paymentDate = paymentData.date;
        }
    }
    
    saveData();
    renderPayments();
    closeModal('add-payment-modal');
    e.target.reset();
    
    alert('Payment recorded successfully!');
}

function generateQuotationNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = quotations.filter(q => q.date.startsWith(`${year}-${month}`)).length + 1;
    return `QT-${year}${month}-${String(count).padStart(3, '0')}`;
}

// Dashboard update
function updateDashboard() {
    const totalItemsEl = document.getElementById('total-items');
    const lowStockEl = document.getElementById('low-stock');
    const pendingOrdersEl = document.getElementById('pending-orders');
    const activeRepairsEl = document.getElementById('active-repairs');
    
    if (totalItemsEl) totalItemsEl.textContent = inventory.length;
    if (lowStockEl) lowStockEl.textContent = inventory.filter(item => item.quantity < 5).length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = purchases.filter(p => p.status === 'pending').length;
    if (activeRepairsEl) activeRepairsEl.textContent = repairs.filter(r => r.status === 'in-progress').length;
    
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalInventoryValueEl = document.getElementById('total-inventory-value');
    const totalPurchasesEl = document.getElementById('total-purchases');
    const totalSpentEl = document.getElementById('total-spent');
    const activeRepairsCountEl = document.getElementById('active-repairs-count');
    
    if (totalInventoryValueEl) totalInventoryValueEl.textContent = `₹${totalValue.toFixed(2)}`;
    if (totalPurchasesEl) totalPurchasesEl.textContent = purchases.length;
    if (totalSpentEl) totalSpentEl.textContent = `₹${purchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}`;
    if (activeRepairsCountEl) activeRepairsCountEl.textContent = repairs.filter(r => r.status === 'in-progress').length;
    
    // Update charts
    updateRepairStatusChart();
    updateRevenueChart();
    updateQuotationValueChart();
}

// Chart variables
let repairStatusChart = null;
let revenueChart = null;
let quotationValueChart = null;

function updateRepairStatusChart() {
    const ctx = document.getElementById('repairStatusChart');
    if (!ctx) {
        console.log('Repair status chart canvas not found');
        return;
    }
    
    // Check if Chart is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded');
        return;
    }
    
    // Destroy existing chart if it exists
    if (repairStatusChart) {
        repairStatusChart.destroy();
    }
    
    // Calculate repair status distribution
    const statusCounts = {};
    repairs.forEach(repair => {
        statusCounts[repair.status] = (statusCounts[repair.status] || 0) + 1;
    });
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
    ];
    
    repairStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(label => label.replace('-', ' ').toUpperCase()),
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 5,
                        usePointStyle: true,
                        font: {
                            size: 10
                        }
                    }
                },
                title: {
                    display: false
                }
            },
            layout: {
                padding: {
                    top: 5,
                    bottom: 5
                }
            }
        }
    });
}

function updateRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) {
        console.log('Revenue chart canvas not found');
        return;
    }
    
    // Check if Chart is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded');
        return;
    }
    
    // Destroy existing chart if it exists
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // Calculate monthly revenue from invoices
    const monthlyRevenue = {};
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach((month, index) => {
        monthlyRevenue[index] = 0;
    });
    
    // Calculate revenue for each month
    invoices.forEach(invoice => {
        if (invoice.status === 'paid') {
            const invoiceDate = new Date(invoice.date);
            if (invoiceDate.getFullYear() === currentYear) {
                const month = invoiceDate.getMonth();
                monthlyRevenue[month] += invoice.total;
            }
        }
    });
    
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenue (₹)',
                data: Object.values(monthlyRevenue),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        },
                        font: {
                            size: 10
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            }
        }
    });
}

function updateQuotationValueChart() {
    const ctx = document.getElementById('quotationValueChart');
    if (!ctx) {
        console.log('Quotation value chart canvas not found');
        return;
    }
    
    // Check if Chart is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded');
        return;
    }
    
    // Destroy existing chart if it exists
    if (quotationValueChart) {
        quotationValueChart.destroy();
    }
    
    // Calculate quotation statistics
    const totalQuotations = quotations.length;
    const approvedQuotations = quotations.filter(q => q.status === 'approved').length;
    const convertedQuotations = quotations.filter(q => q.status === 'converted').length;
    const totalValue = quotations.reduce((sum, q) => sum + q.total, 0);
    const approvedValue = quotations
        .filter(q => q.status === 'approved')
        .reduce((sum, q) => sum + q.total, 0);
    
    const data = [
        { label: 'Total Quotations', value: totalQuotations, color: '#3B82F6' },
        { label: 'Approved', value: approvedQuotations, color: '#10B981' },
        { label: 'Converted to Repair', value: convertedQuotations, color: '#F59E0B' }
    ];
    
    const labels = data.map(item => item.label);
    const values = data.map(item => item.value);
    const colors = data.map(item => item.color);
    
    quotationValueChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 5,
                        usePointStyle: true,
                        font: {
                            size: 10
                        }
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = ((value / totalQuotations) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 5,
                    bottom: 5
                }
            }
        }
    });
}

// Rendering functions
function renderAll() {
    renderInventory();
    renderVendors();
    renderCustomers();
    renderPurchases();
    renderRepairs();
    renderOutsource();
    renderInvoices();
    renderQuotations();
    renderPickDrops();
    renderDeliveries();
    renderPayments();
    renderUsers();
}

function renderInventory() {
    renderInventoryWithDropdown();
}

function renderVendors() {
    const grid = document.getElementById('vendors-grid');
    grid.innerHTML = '';
    
    vendors.forEach(vendor => {
        const card = `
            <div class="vendor-card">
                <div class="vendor-header">
                    <div class="vendor-avatar">${vendor.name.charAt(0)}</div>
                    <div class="vendor-info">
                        <h3>${vendor.name}</h3>
                        <p>${vendor.email}</p>
                    </div>
                </div>
                <div class="vendor-details">
                    <p><i class="fas fa-phone"></i> ${vendor.phone}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${vendor.address || 'No address'}</p>
                </div>
                <div class="vendor-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editVendor(${vendor.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVendor(${vendor.id})">Delete</button>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

function renderCustomers() {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const statusClass = customer.status === 'active' ? 'status-in-stock' : 'status-out-of-stock';
        
        const row = `
            <tr>
                <td>C-${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.address || 'N/A'}</td>
                <td>${customer.totalRepairs}</td>
                <td>${customer.lastVisit}</td>
                <td><span class="status-badge ${statusClass}">${customer.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editCustomer(${customer.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">Delete</button>
                    <button class="btn btn-sm btn-primary" onclick="viewCustomerHistory(${customer.id})">History</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderPurchases() {
    const tbody = document.getElementById('purchases-tbody');
    tbody.innerHTML = '';
    
    purchases.forEach(purchase => {
        const row = `
            <tr>
                <td>PO-${purchase.id}</td>
                <td>${purchase.date}</td>
                <td>${purchase.vendorName}</td>
                <td>${purchase.items.length} items</td>
                <td>₹${purchase.totalAmount.toFixed(2)}</td>
                <td><span class="status-badge status-${purchase.status}">${purchase.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewPurchase(${purchase.id})">View</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePurchase(${purchase.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderRepairs() {
    const tbody = document.getElementById('repairs-tbody');
    tbody.innerHTML = '';
    
    console.log('Rendering repairs:', repairs);
    console.log('Repairs array length:', repairs.length);
    
    repairs.forEach((repair, index) => {
        console.log(`Processing repair ${index + 1}:`, repair);
        
        // Check if required fields exist
        if (!repair.startDate || !repair.estimate) {
            console.error('Repair missing required fields:', repair);
            return;
        }
        
        const estimatedDate = new Date(repair.startDate);
        estimatedDate.setDate(estimatedDate.getDate() + repair.estimate);
        
        const row = `
            <tr>
                <td>R-${repair.id}</td>
                <td>${repair.customer}</td>
                <td>${repair.deviceType}</td>
                <td>${repair.brand || 'N/A'}</td>
                <td>${repair.model || 'N/A'}</td>
                <td>${repair.serial || 'N/A'}</td>
                <td>${repair.issue.substring(0, 50)}${repair.issue.length > 50 ? '...' : ''}</td>
                <td><span class="status-badge status-${repair.status}">${repair.status}</span></td>
                <td>${repair.startDate}</td>
                <td>${estimatedDate.toISOString().split('T')[0]}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewJobCard(${repair.id})" title="View Job Card">
                        <i class="fas fa-clipboard-list"></i> Job Card
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="updateRepairStatus(${repair.id})">Update</button>
                    ${repair.status === 'completed' ? 
                        `<button class="btn btn-sm btn-success" onclick="createInvoiceFromRepair(${repair.id})" title="Create invoice for this completed repair">Invoice</button>` 
                        : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteRepair(${repair.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
        console.log(`Added repair row for ID: ${repair.id}`);
    });
    
    console.log('Finished rendering repairs. Total rows:', tbody.children.length);
}

function renderOutsource() {
    const tbody = document.getElementById('outsource-tbody');
    tbody.innerHTML = '';
    
    outsourceRepairs.forEach(outsource => {
        const statusClass = outsource.status === 'sent' ? 'status-pending' : 
                          outsource.status === 'in-progress' ? 'status-in-progress' :
                          outsource.status === 'completed' ? 'status-completed' : 'status-returned';
        
        const row = `
            <tr>
                <td>OS-${outsource.id}</td>
                <td>${outsource.customer}</td>
                <td>${outsource.deviceType}</td>
                <td>${outsource.issue.substring(0, 50)}${outsource.issue.length > 50 ? '...' : ''}</td>
                <td>${outsource.vendorName}</td>
                <td><span class="status-badge ${statusClass}">${outsource.status}</span></td>
                <td>${outsource.sentDate}</td>
                <td>${outsource.expectedReturn}</td>
                <td>₹${outsource.cost.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="updateOutsourceStatus(${outsource.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOutsource(${outsource.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderInvoices() {
    const tbody = document.getElementById('invoices-tbody');
    tbody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const row = `
            <tr>
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.customer}</td>
                <td>${invoice.date}</td>
                <td>${invoice.dueDate}</td>
                <td>${invoice.items.length} items</td>
                <td>₹${invoice.subtotal.toFixed(2)}</td>
                <td>₹${invoice.taxAmount.toFixed(2)}</td>
                <td>₹${invoice.total.toFixed(2)}</td>
                <td>
                    <select class="invoice-status-dropdown" onchange="updateInvoiceStatusFromList(${invoice.id}, this.value)">
                        <option value="draft" ${invoice.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="sent" ${invoice.status === 'sent' ? 'selected' : ''}>Sent</option>
                        <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                        <option value="cancelled" ${invoice.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${invoice.id})">View</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// CRUD operations
function editItem(id) {
    const item = inventory.find(i => i.id === id);
    if (item) {
        // Set the editing flag on the form
        document.getElementById('add-item-form').setAttribute('data-editing-id', item.id);
        
        // Populate the form fields
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-brand').value = item.brand || '';
        document.getElementById('item-model').value = item.model || '';
        document.getElementById('item-sku').value = item.sku;
        document.getElementById('item-quantity').value = item.quantity;
        document.getElementById('item-unit').value = item.unit || '';
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-description').value = item.description || '';
        
        // Update modal title to indicate editing
        document.querySelector('#add-item-modal .modal-header h3').textContent = 'Edit Item';
        
        showModal('add-item-modal');
    }
}

function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(i => i.id !== id);
        saveData();
        updateDashboard();
        renderInventory();
    }
}

function editVendor(id) {
    const vendor = vendors.find(v => v.id === id);
    if (vendor) {
        // Set the editing flag on the form
        document.getElementById('add-vendor-form').setAttribute('data-editing-id', vendor.id);
        
        // Populate the form fields
        document.getElementById('vendor-name').value = vendor.name;
        document.getElementById('vendor-email').value = vendor.email;
        document.getElementById('vendor-phone').value = vendor.phone;
        document.getElementById('vendor-address').value = vendor.address || '';
        
        // Update modal title to indicate editing
        document.querySelector('#add-vendor-modal .modal-header h3').textContent = 'Edit Vendor';
        
        showModal('add-vendor-modal');
    }
}

function deleteVendor(id) {
    if (confirm('Are you sure you want to delete this vendor?')) {
        vendors = vendors.filter(v => v.id !== id);
        saveData();
        renderVendors();
    }
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        // Set the editing flag on the form
        document.getElementById('add-customer-form').setAttribute('data-editing-id', customer.id);
        
        // Populate the form fields
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-phone').value = customer.phone;
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-address').value = customer.address || '';
        document.getElementById('customer-preferred-device').value = customer.preferredDevice || '';
        document.getElementById('customer-status').value = customer.status;
        document.getElementById('customer-notes').value = customer.notes || '';
        
        // Update modal title to indicate editing
        document.querySelector('#add-customer-modal .modal-header h3').textContent = 'Edit Customer';
        
        showModal('add-customer-modal');
    }
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers = customers.filter(c => c.id !== id);
        saveData();
        renderCustomers();
    }
}

function viewCustomerHistory(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        // Get all repairs for this customer
        const customerRepairs = repairs.filter(r => r.customer === customer.name);
        const customerOutsource = outsourceRepairs.filter(o => o.customer === customer.name);
        
        let historyText = `Customer History for ${customer.name}\n\n`;
        historyText += `Contact: ${customer.phone}\n`;
        historyText += `Email: ${customer.email || 'N/A'}\n`;
        historyText += `Address: ${customer.address || 'N/A'}\n`;
        historyText += `Preferred Device: ${customer.preferredDevice || 'N/A'}\n`;
        historyText += `Total Repairs: ${customer.totalRepairs}\n`;
        historyText += `Last Visit: ${customer.lastVisit}\n\n`;
        
        if (customerRepairs.length > 0) {
            historyText += `Repair History:\n`;
            customerRepairs.forEach(repair => {
                historyText += `- ${repair.deviceType} repair (${repair.startDate}): ${repair.issue.substring(0, 50)}...\n`;
            });
        }
        
        if (customerOutsource.length > 0) {
            historyText += `\nOutsource History:\n`;
            customerOutsource.forEach(outsource => {
                historyText += `- ${outsource.deviceType} outsourced to ${outsource.vendorName} (${outsource.sentDate}): ₹${outsource.cost}\n`;
            });
        }
        
        if (customerRepairs.length === 0 && customerOutsource.length === 0) {
            historyText += `No repair history found.`;
        }
        
        alert(historyText);
    }
}

function deletePurchase(id) {
    if (confirm('Are you sure you want to delete this purchase?')) {
        purchases = purchases.filter(p => p.id !== id);
        saveData();
        updateDashboard();
        renderPurchases();
    }
}

function deleteRepair(id) {
    if (confirm('Are you sure you want to delete this repair?')) {
        repairs = repairs.filter(r => r.id !== id);
        saveData();
        updateDashboard();
        renderRepairs();
    }
}

function updateRepairStatus(id) {
    const repair = repairs.find(r => r.id === id);
    if (repair) {
        repair.status = repair.status === 'in-progress' ? 'completed' : 'in-progress';
        saveData();
        renderRepairs();
        updateDashboard();
    }
}

function deleteOutsource(id) {
    if (confirm('Are you sure you want to delete this outsource repair?')) {
        outsourceRepairs = outsourceRepairs.filter(o => o.id !== id);
        saveData();
        updateDashboard();
        renderOutsource();
    }
}

function updateOutsourceStatus(id) {
    const outsource = outsourceRepairs.find(o => o.id === id);
    if (outsource) {
        const statuses = ['sent', 'in-progress', 'completed', 'returned'];
        const currentIndex = statuses.indexOf(outsource.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        outsource.status = statuses[nextIndex];
        saveData();
        renderOutsource();
        updateDashboard();
    }
}

function deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this invoice?')) {
        invoices = invoices.filter(i => i.id !== id);
        saveData();
        updateDashboard();
        renderInvoices();
    }
}

function updateInvoiceStatus(id) {
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
        const statuses = ['draft', 'sent', 'paid', 'cancelled'];
        const currentIndex = statuses.indexOf(invoice.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        invoice.status = statuses[nextIndex];
        saveData();
        renderInvoices();
        updateDashboard();
    }
}

function viewInvoice(id) {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    // Hide the table container and show the detail view
    const tableContainer = document.getElementById('invoices-table-container');
    const detailView = document.getElementById('invoice-detail-view');
    
    if (tableContainer && detailView) {
        tableContainer.style.display = 'none';
        detailView.style.display = 'block';
        console.log('Successfully switched to invoice detail view');
    } else {
        console.error('Could not find invoice table container or detail view');
        if (!tableContainer) console.error('invoices-table-container not found');
        if (!detailView) console.error('invoice-detail-view not found');
    }
    
    // Populate invoice details
    document.getElementById('invoice-number').textContent = invoice.invoiceNumber;
    document.getElementById('invoice-date').textContent = invoice.date;
    document.getElementById('invoice-due-date').textContent = invoice.dueDate;
    
    // Set the status dropdown to current status
    const statusSelect = document.getElementById('invoice-status-select');
    if (statusSelect) {
        statusSelect.value = invoice.status;
    }
    
    // Populate customer details
    document.getElementById('invoice-customer-name').textContent = invoice.customer;
    document.getElementById('invoice-customer-address').textContent = 'Customer Address'; // You can add address field to invoice
    document.getElementById('invoice-customer-phone').textContent = 'Customer Phone'; // You can add phone field to invoice
    
    // Populate invoice items
    const tbody = document.getElementById('invoice-items-detail-tbody');
    tbody.innerHTML = '';
    
    invoice.items.forEach(item => {
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    // Populate totals
    document.getElementById('invoice-subtotal').textContent = `₹${invoice.subtotal.toFixed(2)}`;
    document.getElementById('invoice-tax').textContent = `₹${invoice.taxAmount.toFixed(2)}`;
    document.getElementById('invoice-discount').textContent = `₹${invoice.discount.toFixed(2)}`;
    document.getElementById('invoice-total-amount').textContent = `₹${invoice.total.toFixed(2)}`;
    
    // Store current invoice ID for actions
    document.getElementById('invoice-detail-view').setAttribute('data-invoice-id', id);
    
    // Update button states based on invoice status
    updateInvoiceActionButtons(invoice.status);
    
    // Setup back button event listener as fallback
    setupInvoiceBackButton();
    
    // Test if the back button function is accessible
    console.log('backToInvoiceList function available:', typeof window.backToInvoiceList);
}

function updateInvoiceStatusFromDetail() {
    const invoiceId = document.getElementById('invoice-detail-view').getAttribute('data-invoice-id');
    const statusSelect = document.getElementById('invoice-status-select');
    
    if (!invoiceId || !statusSelect) {
        console.error('Invoice ID or status select not found');
        return;
    }
    
    const invoice = invoices.find(i => i.id === parseInt(invoiceId));
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    const newStatus = statusSelect.value;
    const oldStatus = invoice.status;
    
    // Update the invoice status
    invoice.status = newStatus;
    saveData();
    
    // Update button states based on new status
    updateInvoiceActionButtons(newStatus);
    
    // Show success message
    alert(`Invoice status updated from "${oldStatus}" to "${newStatus}" successfully!`);
    
    // Update the invoice list to reflect the change
    renderInvoices();
}

function updateInvoiceActionButtons(status) {
    const markAsPaidBtn = document.querySelector('#invoice-detail-view .btn-success');
    const editBtn = document.querySelector('#invoice-detail-view .edit-invoice-btn');
    
    if (status === 'paid') {
        // Disable "Mark as Paid" button
        if (markAsPaidBtn) {
            markAsPaidBtn.disabled = true;
            markAsPaidBtn.style.opacity = '0.5';
            markAsPaidBtn.style.cursor = 'not-allowed';
            markAsPaidBtn.title = 'Invoice is already paid';
        }
        
        // Disable edit button for paid invoices
        if (editBtn) {
            editBtn.disabled = true;
            editBtn.style.opacity = '0.5';
            editBtn.style.cursor = 'not-allowed';
            editBtn.title = 'Cannot edit paid invoices';
        }
    } else {
        // Enable buttons for non-paid invoices
        if (markAsPaidBtn) {
            markAsPaidBtn.disabled = false;
            markAsPaidBtn.style.opacity = '1';
            markAsPaidBtn.style.cursor = 'pointer';
            markAsPaidBtn.title = 'Mark invoice as paid';
        }
        
        if (editBtn) {
            editBtn.disabled = false;
            editBtn.style.opacity = '1';
            editBtn.style.cursor = 'pointer';
            editBtn.title = 'Edit invoice';
        }
    }
}

function backToInvoiceList() {
    console.log('backToInvoiceList function called');
    
    const detailView = document.getElementById('invoice-detail-view');
    const tableContainer = document.getElementById('invoices-table-container');
    
    if (detailView && tableContainer) {
        detailView.style.display = 'none';
        tableContainer.style.display = 'block';
        console.log('Successfully switched back to invoice list');
    } else {
        console.error('Could not find invoice detail view or table container');
        if (!detailView) console.error('invoice-detail-view not found');
        if (!tableContainer) console.error('invoices-table-container not found');
    }
}

// Alternative method using event listener
function setupInvoiceBackButton() {
    const backButton = document.querySelector('#invoice-detail-view .back-to-invoices-btn');
    if (backButton) {
        backButton.addEventListener('click', function() {
            console.log('Back button clicked via event listener');
            backToInvoiceList();
        });
    }
}

function printInvoice() {
    const invoiceId = document.getElementById('invoice-detail-view').getAttribute('data-invoice-id');
    const invoice = invoices.find(i => i.id === parseInt(invoiceId));
    
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .invoice-info { margin-bottom: 20px; }
                .customer-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals { text-align: right; margin-top: 20px; }
                .total { font-weight: bold; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>REPAIR MANIAC</h1>
                <p>123 Main Street, City, State 12345</p>
                <p>Phone: (555) 123-4567</p>
            </div>
            
            <div class="invoice-info">
                <h2>Invoice: ${invoice.invoiceNumber}</h2>
                <p><strong>Date:</strong> ${invoice.date}</p>
                <p><strong>Due Date:</strong> ${invoice.dueDate}</p>
                <p><strong>Status:</strong> ${invoice.status}</p>
            </div>
            
            <div class="customer-info">
                <h3>Bill To:</h3>
                <p>${invoice.customer}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item/Service</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>₹${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals">
                <p><strong>Subtotal:</strong> ₹${invoice.subtotal.toFixed(2)}</p>
                <p><strong>Tax:</strong> ₹${invoice.taxAmount.toFixed(2)}</p>
                <p><strong>Discount:</strong> ₹${invoice.discount.toFixed(2)}</p>
                <p class="total"><strong>Total:</strong> ₹${invoice.total.toFixed(2)}</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function markInvoiceAsPaid() {
    const invoiceId = document.getElementById('invoice-detail-view').getAttribute('data-invoice-id');
    const invoice = invoices.find(i => i.id === parseInt(invoiceId));
    
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    if (invoice.status === 'paid') {
        alert('Invoice is already marked as paid!');
        return;
    }
    
    invoice.status = 'paid';
    saveData();
    
    // Update the status dropdown
    const statusSelect = document.getElementById('invoice-status-select');
    if (statusSelect) {
        statusSelect.value = 'paid';
    }
    
    // Update button states after marking as paid
    updateInvoiceActionButtons('paid');
    
    alert('Invoice marked as paid successfully!');
}

function editInvoice() {
    const invoiceId = document.getElementById('invoice-detail-view').getAttribute('data-invoice-id');
    const invoice = invoices.find(i => i.id === parseInt(invoiceId));
    
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    // For now, just show an alert. You can implement full edit functionality later
    alert('Edit functionality will be implemented in the next update.');
}

function searchCustomersForInvoice() {
    const searchTerm = document.getElementById('invoice-customer').value.toLowerCase();
    const suggestionsContainer = document.getElementById('invoice-customer-suggestions');
    
    if (searchTerm.length < 2) {
        hideInvoiceCustomerSuggestions();
        return;
    }
    
    const matchingCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );
    
    if (matchingCustomers.length > 0) {
        showInvoiceCustomerSuggestions(matchingCustomers);
    } else {
        hideInvoiceCustomerSuggestions();
    }
}

function showInvoiceCustomerSuggestions(customers) {
    const suggestionsContainer = document.getElementById('invoice-customer-suggestions');
    suggestionsContainer.innerHTML = '';
    
    customers.forEach(customer => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'customer-suggestion-item';
        suggestionItem.innerHTML = `
            <div class="customer-suggestion-name">${customer.name}</div>
            <div class="customer-suggestion-details">${customer.phone} • ${customer.preferredDevice || 'No preference'}</div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            selectCustomerForInvoice(customer);
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = 'block';
}

function hideInvoiceCustomerSuggestions() {
    const suggestionsContainer = document.getElementById('invoice-customer-suggestions');
    suggestionsContainer.style.display = 'none';
}

function selectCustomerForInvoice(customer) {
    document.getElementById('invoice-customer').value = customer.name;
    hideInvoiceCustomerSuggestions();
}

function addInvoiceItem() {
    const container = document.getElementById('invoice-items-list');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.innerHTML = `
        <div class="item-search-container">
            <input type="text" class="invoice-item-name" placeholder="Type to search items..." required>
            <div class="item-suggestions"></div>
        </div>
        <input type="number" class="invoice-quantity" placeholder="Qty" min="1" value="1" required>
        <input type="number" class="invoice-price" placeholder="Price" min="0" step="0.01" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeInvoiceItem(this)">Remove</button>
    `;
    container.appendChild(newItem);
}

function addInvoiceItemWithData(itemData) {
    const container = document.getElementById('invoice-items-list');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.innerHTML = `
        <div class="item-search-container">
            <input type="text" class="invoice-item-name" placeholder="Type to search items..." value="${itemData.name}" required>
            <div class="item-suggestions"></div>
        </div>
        <input type="number" class="invoice-quantity" placeholder="Qty" min="1" value="${itemData.quantity}" required>
        <input type="number" class="invoice-price" placeholder="Price" min="0" step="0.01" value="${itemData.price}" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeInvoiceItem(this)">Remove</button>
    `;
    container.appendChild(newItem);
    
    // Trigger calculation after adding
    calculateInvoiceTotals();
}

function removeInvoiceItem(button) {
    button.parentElement.remove();
    calculateInvoiceTotals();
}

function calculateInvoiceTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.invoice-item').forEach(itemDiv => {
        const quantity = parseInt(itemDiv.querySelector('.invoice-quantity').value) || 0;
        const price = parseFloat(itemDiv.querySelector('.invoice-price').value) || 0;
        subtotal += quantity * price;
    });
    
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 0;
    const discount = parseFloat(document.getElementById('invoice-discount').value) || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    
    document.getElementById('invoice-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('invoice-tax-amount').textContent = taxAmount.toFixed(2);
    document.getElementById('invoice-discount-amount').textContent = discount.toFixed(2);
    document.getElementById('invoice-total').textContent = total.toFixed(2);
}

function filterInvoices() {
    const searchTerm = document.getElementById('search-invoices').value.toLowerCase();
    const statusFilter = document.getElementById('invoice-status-filter').value;
    const customerFilter = document.getElementById('invoice-customer-filter').value;
    
    const filtered = invoices.filter(invoice => {
        const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm) || 
                           invoice.customer.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || invoice.status === statusFilter;
        const matchesCustomer = !customerFilter || invoice.customer === customers.find(c => c.id === parseInt(customerFilter))?.name;
        
        return matchesSearch && matchesStatus && matchesCustomer;
    });
    
    renderFilteredInvoices(filtered);
}

function renderFilteredInvoices(filteredItems) {
    const tbody = document.getElementById('invoices-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(invoice => {
        const statusClass = `status-${invoice.status}`;
        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';
        const displayStatus = isOverdue ? 'overdue' : invoice.status;
        const displayStatusClass = isOverdue ? 'status-overdue' : statusClass;
        
        const row = `
            <tr>
                <td>${invoice.invoiceNumber}</td>
                <td>${invoice.customer}</td>
                <td>${invoice.date}</td>
                <td>${invoice.dueDate}</td>
                <td>${invoice.items.length} items</td>
                <td>₹${invoice.subtotal.toFixed(2)}</td>
                <td>₹${invoice.taxAmount.toFixed(2)}</td>
                <td>₹${invoice.total.toFixed(2)}</td>
                <td><span class="status-badge ${displayStatusClass}">${displayStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${invoice.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updateInvoiceStatus(${invoice.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${invoice.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function searchInventoryForInvoice(inputElement) {
    const searchTerm = inputElement.value.toLowerCase();
    const suggestionsContainer = inputElement.parentElement.querySelector('.item-suggestions');
    
    if (searchTerm.length < 2) {
        hideItemSuggestions(suggestionsContainer);
        return;
    }
    
    const matchingItems = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        (item.model && item.model.toLowerCase().includes(searchTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm))
    );
    
    if (matchingItems.length > 0) {
        showItemSuggestions(matchingItems, suggestionsContainer);
    } else {
        hideItemSuggestions(suggestionsContainer);
    }
}

function showItemSuggestions(items, container) {
    container.innerHTML = '';
    
    items.forEach(item => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'item-suggestion-item';
        suggestionItem.innerHTML = `
            <div class="item-suggestion-name">${item.name}</div>
            <div class="item-suggestion-details">
                ${item.brand || 'N/A'} • ${item.model || 'N/A'} • SKU: ${item.sku}
            </div>
            <div class="item-suggestion-price">₹${item.price.toFixed(2)}</div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            selectItemForInvoice(item, container.parentElement.querySelector('.invoice-item-name'));
        });
        
        container.appendChild(suggestionItem);
    });
    
    container.style.display = 'block';
}

function hideItemSuggestions(container) {
    container.style.display = 'none';
}

function hideAllItemSuggestions() {
    document.querySelectorAll('.item-suggestions').forEach(container => {
        container.style.display = 'none';
    });
}

function selectItemForInvoice(item, inputElement) {
    inputElement.value = item.name;
    inputElement.parentElement.querySelector('.item-suggestions').style.display = 'none';
    
    // Auto-fill the price field
    const priceInput = inputElement.closest('.invoice-item').querySelector('.invoice-price');
    priceInput.value = item.price;
    
    // Trigger calculation update
    calculateInvoiceTotals();
}

function renderQuotations() {
    const tbody = document.getElementById('quotations-tbody');
    tbody.innerHTML = '';
    
    console.log('Rendering quotations:', quotations);
    console.log('Quotations tbody element:', tbody);
    
    quotations.forEach(quotation => {
        const statusClass = `status-${quotation.status}`;
        const isExpired = new Date(quotation.validUntil) < new Date() && quotation.status !== 'converted';
        const displayStatus = isExpired ? 'expired' : quotation.status;
        const displayStatusClass = isExpired ? 'status-expired' : statusClass;
        
        const row = `
            <tr>
                <td>${quotation.quotationNumber}</td>
                <td>${quotation.customer}</td>
                <td>${quotation.deviceType} ${quotation.deviceBrand} ${quotation.deviceModel}</td>
                <td>${quotation.issue.substring(0, 50)}${quotation.issue.length > 50 ? '...' : ''}</td>
                <td>${quotation.date}</td>
                <td>${quotation.validUntil}</td>
                <td>₹${quotation.subtotal.toFixed(2)}</td>
                <td>₹${quotation.total.toFixed(2)}</td>
                <td><span class="status-badge ${displayStatusClass}">${displayStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewQuotation(${quotation.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updateQuotationStatus(${quotation.id})">Update</button>
                    <button class="btn btn-sm ${quotation.status === 'approved' ? 'btn-success' : 'btn-secondary'}" 
                            onclick="convertToRepair(${quotation.id})" 
                            ${quotation.status !== 'approved' ? 'disabled' : ''}
                            title="${quotation.status !== 'approved' ? 'Only approved quotations can be converted' : 'Convert to repair job'}">
                        Convert
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuotation(${quotation.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderPickDrops() {
    const tbody = document.getElementById('pickdrop-tbody');
    tbody.innerHTML = '';
    
    console.log('Rendering pick & drops:', pickDrops);
    
    pickDrops.forEach(pickDrop => {
        const statusClass = `status-${pickDrop.status}`;
        
        const row = `
            <tr>
                <td>PD-${pickDrop.id}</td>
                <td>${pickDrop.customer}</td>
                <td>${pickDrop.deviceType} ${pickDrop.deviceBrand} ${pickDrop.deviceModel}</td>
                <td>${pickDrop.pickupAddress.substring(0, 50)}${pickDrop.pickupAddress.length > 50 ? '...' : ''}</td>
                <td>${pickDrop.pickupDate} ${pickDrop.pickupTime}</td>
                <td><span class="status-badge ${statusClass}">${pickDrop.status}</span></td>
                <td>₹${pickDrop.fee.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewPickDrop(${pickDrop.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updatePickDropStatus(${pickDrop.id})">Update</button>
                    ${getOTPButtons(pickDrop)}
                    <button class="btn btn-sm btn-danger" onclick="deletePickDrop(${pickDrop.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function deleteQuotation(id) {
    if (confirm('Are you sure you want to delete this quotation?')) {
        quotations = quotations.filter(q => q.id !== id);
        saveData();
        updateDashboard();
        renderQuotations();
    }
}

function deletePickDrop(id) {
    if (confirm('Are you sure you want to delete this pick & drop?')) {
        pickDrops = pickDrops.filter(pd => pd.id !== id);
        saveData();
        updateDashboard();
        renderPickDrops();
    }
}

function updateQuotationStatus(id) {
    const quotation = quotations.find(q => q.id === id);
    if (quotation) {
        const statuses = ['draft', 'sent', 'approved', 'rejected'];
        const currentIndex = statuses.indexOf(quotation.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        quotation.status = statuses[nextIndex];
        saveData();
        renderQuotations();
        updateDashboard();
    }
}

function updatePickDropStatus(id) {
    const pickDrop = pickDrops.find(pd => pd.id === id);
    if (pickDrop) {
        const statuses = ['scheduled', 'pickup-pending', 'picked-up', 'in-repair', 'completed', 'cancelled'];
        const currentIndex = statuses.indexOf(pickDrop.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        pickDrop.status = statuses[nextIndex];
        saveData();
        renderPickDrops();
        updateDashboard();
    }
}

function convertToRepair(id) {
    console.log('convertToRepair called with id:', id);
    const quotation = quotations.find(q => q.id === id);
    console.log('Found quotation:', quotation);
    
    if (quotation) {
        console.log('Quotation status:', quotation.status);
        if (quotation.status === 'approved') {
            if (confirm('Convert this quotation to a repair job?')) {
                // Create new repair from quotation
                const newRepair = {
                    id: Date.now(),
                    customer: quotation.customer,
                    deviceType: quotation.deviceType,
                    issue: quotation.issue,
                    estimate: 7, // Default 7 days estimate
                    startDate: new Date().toISOString().split('T')[0],
                    status: 'in-progress', // Match the status used in handleAddRepair
                    quotationId: quotation.id // Link to original quotation
                };
                
                console.log('Creating new repair:', newRepair);
                repairs.push(newRepair);
                quotation.status = 'converted';
                
                console.log('Repairs array after adding:', repairs);
                console.log('Repairs array length:', repairs.length);
                
                saveData();
                renderRepairs();
                renderQuotations();
                updateDashboard();
                alert('Quotation converted to repair job successfully!');
            }
        } else {
            alert('Only approved quotations can be converted to repair jobs. Current status: ' + quotation.status);
        }
    } else {
        alert('Quotation not found!');
    }
}

function createInvoiceFromRepair(repairId) {
    console.log('createInvoiceFromRepair called with repairId:', repairId);
    const repair = repairs.find(r => r.id === repairId);
    
    if (!repair) {
        alert('Repair not found!');
        return;
    }
    
    if (repair.status !== 'completed') {
        alert('Only completed repairs can be invoiced!');
        return;
    }
    
    // Check if invoice already exists for this repair
    const existingInvoice = invoices.find(inv => inv.repairId === repairId);
    if (existingInvoice) {
        alert('An invoice already exists for this repair job!');
        return;
    }
    
    // Pre-populate the invoice modal with repair details
    populateInvoiceFromRepair(repair);
    
    // Show the invoice modal
    showModal('add-invoice-modal');
}

function viewQuotation(id) {
    const quotation = quotations.find(q => q.id === id);
    if (quotation) {
        // Hide table and show detail view
        document.getElementById('quotations-table-container').style.display = 'none';
        document.getElementById('quotation-detail-view').style.display = 'block';
        
        // Populate quotation details
        document.getElementById('quotation-number').textContent = quotation.quotationNumber;
        document.getElementById('quotation-date').textContent = quotation.date;
        document.getElementById('quotation-valid-until').textContent = quotation.validUntil;
        document.getElementById('quotation-status-select').value = quotation.status;
        
        // Populate customer details
        document.getElementById('quotation-customer-name').textContent = quotation.customer;
        document.getElementById('quotation-customer-address').textContent = 'Customer Address'; // You can extend this
        document.getElementById('quotation-customer-phone').textContent = 'Customer Phone'; // You can extend this
        
        // Populate device details
        document.getElementById('quotation-device-type').textContent = quotation.deviceType;
        document.getElementById('quotation-device-brand').textContent = quotation.deviceBrand;
        document.getElementById('quotation-device-model').textContent = quotation.deviceModel;
        document.getElementById('quotation-issue').textContent = quotation.issue;
        
        // Populate items table
        const tbody = document.getElementById('quotation-items-detail-tbody');
        tbody.innerHTML = '';
        quotation.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${item.total.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Populate totals
        document.getElementById('quotation-subtotal').textContent = `₹${quotation.subtotal.toFixed(2)}`;
        document.getElementById('quotation-tax').textContent = `₹${quotation.taxAmount.toFixed(2)}`;
        document.getElementById('quotation-discount').textContent = `₹${quotation.discount.toFixed(2)}`;
        document.getElementById('quotation-total-amount').textContent = `₹${quotation.total.toFixed(2)}`;
        
        // Populate notes
        document.getElementById('quotation-notes-text').textContent = quotation.notes || 'No additional notes';
        
        // Update action buttons based on status
        updateQuotationActionButtons(quotation.status);
        
        // Store current quotation ID for actions
        window.currentQuotationId = id;
    }
}

function backToQuotationList() {
    document.getElementById('quotation-detail-view').style.display = 'none';
    document.getElementById('quotations-table-container').style.display = 'block';
    window.currentQuotationId = null;
}

function updateQuotationStatusFromDetail() {
    if (window.currentQuotationId) {
        const newStatus = document.getElementById('quotation-status-select').value;
        updateQuotationStatus(window.currentQuotationId, newStatus);
    }
}

function updateQuotationActionButtons(status) {
    const approveBtn = document.querySelector('.quotation-actions .btn-success');
    const rejectBtn = document.querySelector('.quotation-actions .btn-warning');
    const convertBtn = document.querySelector('.quotation-actions .btn-info');
    const editBtn = document.querySelector('.quotation-actions .btn-secondary');
    
    // Reset all buttons
    if (approveBtn) approveBtn.style.display = 'inline-block';
    if (rejectBtn) rejectBtn.style.display = 'inline-block';
    if (convertBtn) convertBtn.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'inline-block';
    
    // Hide buttons based on status
    switch (status) {
        case 'approved':
            if (approveBtn) approveBtn.style.display = 'none';
            if (rejectBtn) rejectBtn.style.display = 'none';
            break;
        case 'rejected':
            if (approveBtn) approveBtn.style.display = 'none';
            if (rejectBtn) rejectBtn.style.display = 'none';
            break;
        case 'converted':
            if (approveBtn) approveBtn.style.display = 'none';
            if (rejectBtn) rejectBtn.style.display = 'none';
            if (convertBtn) convertBtn.style.display = 'none';
            break;
        case 'expired':
            if (approveBtn) approveBtn.style.display = 'none';
            if (rejectBtn) rejectBtn.style.display = 'none';
            if (convertBtn) convertBtn.style.display = 'none';
            break;
    }
}

function printQuotation() {
    const printWindow = window.open('', '_blank');
    const quotation = quotations.find(q => q.id === window.currentQuotationId);
    
    if (quotation) {
        printWindow.document.write(`
            <html>
            <head>
                <title>Quotation - ${quotation.quotationNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .company-info { margin-bottom: 20px; }
                    .quotation-details { margin-bottom: 20px; }
                    .customer-info { margin-bottom: 20px; }
                    .device-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .totals { text-align: right; margin-top: 20px; }
                    .notes { margin-top: 20px; padding: 10px; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REPAIR MANIAC</h1>
                    <p>O-109, First Floor, The Shopping Mall</p>
                    <p>Arjun Marg, DLF City Phase-1, Gurugram, Haryana-122002</p>
                    <p>Phone: 9560455637</p>
                </div>
                
                <div class="quotation-details">
                    <h2>${quotation.quotationNumber}</h2>
                    <p><strong>Date:</strong> ${quotation.date}</p>
                    <p><strong>Valid Until:</strong> ${quotation.validUntil}</p>
                    <p><strong>Status:</strong> ${quotation.status}</p>
                </div>
                
                <div class="customer-info">
                    <h3>Customer Details:</h3>
                    <p><strong>Name:</strong> ${quotation.customer}</p>
                </div>
                
                <div class="device-info">
                    <h3>Device Information:</h3>
                    <p><strong>Device Type:</strong> ${quotation.deviceType}</p>
                    <p><strong>Brand:</strong> ${quotation.deviceBrand}</p>
                    <p><strong>Model:</strong> ${quotation.deviceModel}</p>
                    <p><strong>Issue:</strong> ${quotation.issue}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item/Service</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quotation.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>₹${item.price.toFixed(2)}</td>
                                <td>₹${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <p><strong>Subtotal:</strong> ₹${quotation.subtotal.toFixed(2)}</p>
                    <p><strong>Tax (18%):</strong> ₹${quotation.taxAmount.toFixed(2)}</p>
                    <p><strong>Discount:</strong> ₹${quotation.discount.toFixed(2)}</p>
                    <p><strong>Total:</strong> ₹${quotation.total.toFixed(2)}</p>
                </div>
                
                ${quotation.notes ? `
                    <div class="notes">
                        <h3>Additional Notes:</h3>
                        <p>${quotation.notes}</p>
                    </div>
                ` : ''}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function approveQuotation() {
    if (window.currentQuotationId) {
        updateQuotationStatus(window.currentQuotationId, 'approved');
        document.getElementById('quotation-status-select').value = 'approved';
        updateQuotationActionButtons('approved');
        alert('Quotation approved successfully!');
    }
}

function rejectQuotation() {
    if (window.currentQuotationId) {
        updateQuotationStatus(window.currentQuotationId, 'rejected');
        document.getElementById('quotation-status-select').value = 'rejected';
        updateQuotationActionButtons('rejected');
        alert('Quotation rejected successfully!');
    }
}

function convertToRepair() {
    if (window.currentQuotationId) {
        const quotation = quotations.find(q => q.id === window.currentQuotationId);
        if (quotation) {
            // Create a new repair from the quotation
            const newRepair = {
                id: repairs.length > 0 ? Math.max(...repairs.map(r => r.id)) + 1 : 1,
                customer: quotation.customer,
                deviceType: quotation.deviceType,
                issue: quotation.issue,
                status: 'in-progress',
                startDate: new Date().toISOString().split('T')[0],
                estimatedCompletion: 7,
                createdAt: new Date().toISOString()
            };
            
            repairs.push(newRepair);
            updateQuotationStatus(window.currentQuotationId, 'converted');
            document.getElementById('quotation-status-select').value = 'converted';
            updateQuotationActionButtons('converted');
            saveData();
            alert('Quotation converted to repair successfully!');
        }
    }
}

function editQuotation() {
    if (window.currentQuotationId) {
        // For now, just show an alert. You can implement a full edit modal later
        alert('Edit functionality will be implemented in the next update.');
    }
}

function searchCustomersForQuotation() {
    const searchTerm = document.getElementById('quotation-customer').value.toLowerCase();
    const suggestionsContainer = document.getElementById('quotation-customer-suggestions');
    
    if (searchTerm.length < 2) {
        hideQuotationCustomerSuggestions();
        return;
    }
    
    const matchingCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );
    
    if (matchingCustomers.length > 0) {
        showQuotationCustomerSuggestions(matchingCustomers);
    } else {
        hideQuotationCustomerSuggestions();
    }
}

function showQuotationCustomerSuggestions(customers) {
    const suggestionsContainer = document.getElementById('quotation-customer-suggestions');
    suggestionsContainer.innerHTML = '';
    
    customers.forEach(customer => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'customer-suggestion-item';
        suggestionItem.innerHTML = `
            <div class="customer-suggestion-name">${customer.name}</div>
            <div class="customer-suggestion-details">${customer.phone} • ${customer.preferredDevice || 'No preference'}</div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            selectCustomerForQuotation(customer);
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = 'block';
}

function hideQuotationCustomerSuggestions() {
    const suggestionsContainer = document.getElementById('quotation-customer-suggestions');
    suggestionsContainer.style.display = 'none';
}

function selectCustomerForQuotation(customer) {
    document.getElementById('quotation-customer').value = customer.name;
    hideQuotationCustomerSuggestions();
}

function addQuotationItem() {
    const container = document.getElementById('quotation-items-list');
    const newItem = document.createElement('div');
    newItem.className = 'quotation-item';
    newItem.innerHTML = `
        <div class="item-search-container">
            <input type="text" class="quotation-item-name" placeholder="Type to search items..." required>
            <div class="item-suggestions"></div>
        </div>
        <input type="number" class="quotation-quantity" placeholder="Qty" min="1" value="1" required>
        <input type="number" class="quotation-price" placeholder="Price" min="0" step="0.01" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeQuotationItem(this)">Remove</button>
    `;
    container.appendChild(newItem);
}

function removeQuotationItem(button) {
    button.parentElement.remove();
    calculateQuotationTotals();
}

function calculateQuotationTotals() {
    let subtotal = 0;
    
    document.querySelectorAll('.quotation-item').forEach(itemDiv => {
        const quantity = parseInt(itemDiv.querySelector('.quotation-quantity').value) || 0;
        const price = parseFloat(itemDiv.querySelector('.quotation-price').value) || 0;
        subtotal += quantity * price;
    });
    
    const taxRate = parseFloat(document.getElementById('quotation-tax-rate').value) || 0;
    const discount = parseFloat(document.getElementById('quotation-discount').value) || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    
    document.getElementById('quotation-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('quotation-tax-amount').textContent = taxAmount.toFixed(2);
    document.getElementById('quotation-discount-amount').textContent = discount.toFixed(2);
    document.getElementById('quotation-total').textContent = total.toFixed(2);
}

function searchInventoryForQuotation(inputElement) {
    const searchTerm = inputElement.value.toLowerCase();
    const suggestionsContainer = inputElement.parentElement.querySelector('.item-suggestions');
    
    if (searchTerm.length < 2) {
        hideItemSuggestions(suggestionsContainer);
        return;
    }
    
    const matchingItems = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.sku.toLowerCase().includes(searchTerm) ||
        (item.model && item.model.toLowerCase().includes(searchTerm)) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm))
    );
    
    if (matchingItems.length > 0) {
        showItemSuggestions(matchingItems, suggestionsContainer);
    } else {
        hideItemSuggestions(suggestionsContainer);
    }
}

function selectItemForQuotation(item, inputElement) {
    inputElement.value = item.name;
    inputElement.parentElement.querySelector('.item-suggestions').style.display = 'none';
    
    // Auto-fill the price field
    const priceInput = inputElement.closest('.quotation-item').querySelector('.quotation-price');
    priceInput.value = item.price;
    
    // Trigger calculation update
    calculateQuotationTotals();
}

function filterQuotations() {
    const searchTerm = document.getElementById('search-quotations').value.toLowerCase();
    const statusFilter = document.getElementById('quotation-status-filter').value;
    const customerFilter = document.getElementById('quotation-customer-filter').value;
    
    const filtered = quotations.filter(quotation => {
        const matchesSearch = quotation.quotationNumber.toLowerCase().includes(searchTerm) || 
                           quotation.customer.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || quotation.status === statusFilter;
        const matchesCustomer = !customerFilter || quotation.customer === customers.find(c => c.id === parseInt(customerFilter))?.name;
        
        return matchesSearch && matchesStatus && matchesCustomer;
    });
    
    renderFilteredQuotations(filtered);
}

function filterPickDrops() {
    const searchTerm = document.getElementById('search-pickdrop').value.toLowerCase();
    const statusFilter = document.getElementById('pickdrop-status-filter').value;
    const customerFilter = document.getElementById('pickdrop-customer-filter').value;
    
    let filteredItems = pickDrops.filter(item => {
        const matchesSearch = item.customer.toLowerCase().includes(searchTerm) ||
                             item.deviceType.toLowerCase().includes(searchTerm) ||
                             item.deviceBrand.toLowerCase().includes(searchTerm) ||
                             item.deviceModel.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesCustomer = !customerFilter || item.customer === customerFilter;
        
        return matchesSearch && matchesStatus && matchesCustomer;
    });
    
    renderFilteredPickDrops(filteredItems);
}

function filterUsers() {
    const searchTerm = document.getElementById('search-users').value.toLowerCase();
    const roleFilter = document.getElementById('user-role-filter').value;
    const statusFilter = document.getElementById('user-status-filter').value;
    
    let filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
                             user.fullName.toLowerCase().includes(searchTerm) ||
                             user.email.toLowerCase().includes(searchTerm);
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });
    
    renderFilteredUsers(filteredUsers);
}

function renderFilteredUsers(filteredUsers) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td><span class="user-role-badge role-${user.role}">${userRoles[user.role]?.name || user.role}</span></td>
            <td>
                <div class="user-permissions">
                    ${user.permissions.slice(0, 3).map(p => `<span class="permission-tag">${p}</span>`).join('')}
                    ${user.permissions.length > 3 ? `<span class="permission-tag">+${user.permissions.length - 3} more</span>` : ''}
                </div>
            </td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
            <td><span class="user-status-${user.status}">${user.status}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.id !== currentUser?.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderFilteredQuotations(filteredItems) {
    const tbody = document.getElementById('quotations-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(quotation => {
        const statusClass = `status-${quotation.status}`;
        const isExpired = new Date(quotation.validUntil) < new Date() && quotation.status !== 'converted';
        const displayStatus = isExpired ? 'expired' : quotation.status;
        const displayStatusClass = isExpired ? 'status-expired' : statusClass;
        
        const row = `
            <tr>
                <td>${quotation.quotationNumber}</td>
                <td>${quotation.customer}</td>
                <td>${quotation.deviceType} ${quotation.deviceBrand} ${quotation.deviceModel}</td>
                <td>${quotation.issue.substring(0, 50)}${quotation.issue.length > 50 ? '...' : ''}</td>
                <td>${quotation.date}</td>
                <td>${quotation.validUntil}</td>
                <td>₹${quotation.subtotal.toFixed(2)}</td>
                <td>₹${quotation.total.toFixed(2)}</td>
                <td><span class="status-badge ${displayStatusClass}">${displayStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewQuotation(${quotation.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updateQuotationStatus(${quotation.id})">Update</button>
                    <button class="btn btn-sm ${quotation.status === 'approved' ? 'btn-success' : 'btn-secondary'}" 
                            onclick="convertToRepair(${quotation.id})" 
                            ${quotation.status !== 'approved' ? 'disabled' : ''}
                            title="${quotation.status !== 'approved' ? 'Only approved quotations can be converted' : 'Convert to repair job'}">
                        Convert
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuotation(${quotation.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderFilteredPickDrops(filteredItems) {
    const tbody = document.getElementById('pickdrop-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(pickDrop => {
        const statusClass = `status-${pickDrop.status}`;
        
        const row = `
            <tr>
                <td>PD-${pickDrop.id}</td>
                <td>${pickDrop.customer}</td>
                <td>${pickDrop.deviceType} ${pickDrop.deviceBrand} ${pickDrop.deviceModel}</td>
                <td>${pickDrop.pickupAddress.substring(0, 50)}${pickDrop.pickupAddress.length > 50 ? '...' : ''}</td>
                <td>${pickDrop.deliveryAddress.substring(0, 50)}${pickDrop.deliveryAddress.length > 50 ? '...' : ''}</td>
                <td>${pickDrop.pickupDate} ${pickDrop.pickupTime}</td>
                <td>${pickDrop.deliveryDate} ${pickDrop.deliveryTime}</td>
                <td><span class="status-badge ${statusClass}">${pickDrop.status}</span></td>
                <td>₹${pickDrop.fee.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewPickDrop(${pickDrop.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updatePickDropStatus(${pickDrop.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePickDrop(${pickDrop.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function viewPurchase(id) {
    const purchase = purchases.find(p => p.id === id);
    if (purchase) {
        let itemsList = '';
        purchase.items.forEach(item => {
            itemsList += `${item.itemName} - Qty: ${item.quantity} - Price: ₹${item.price.toFixed(2)} - Total: ₹${item.total.toFixed(2)}\n`;
        });
        
        alert(`Purchase Details:\n\nVendor: ${purchase.vendorName}\nDate: ${purchase.date}\nTotal: ₹${purchase.totalAmount.toFixed(2)}\n\nItems:\n${itemsList}`);
    }
}

// Purchase item management
function addPurchaseItem() {
    const container = document.getElementById('purchase-items-list');
    const newItem = document.createElement('div');
    newItem.className = 'purchase-item';
    newItem.innerHTML = `
        <select class="purchase-item-select" required>
            <option value="">Select Item</option>
            ${inventory.map(item => `<option value="${item.id}">${item.name} (${item.sku})</option>`).join('')}
        </select>
        <input type="number" class="purchase-quantity" placeholder="Qty" min="1" required>
        <input type="number" class="purchase-price" placeholder="Price" min="0" step="0.01" required>
        <button type="button" class="btn btn-danger btn-sm" onclick="removePurchaseItem(this)">Remove</button>
    `;
    container.appendChild(newItem);
}

function removePurchaseItem(button) {
    button.parentElement.remove();
}

// Search and filter functionality
function filterInventory() {
    const searchTerm = document.getElementById('search-inventory').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const brandFilter = document.getElementById('brand-filter').value;
    const stockFilter = document.getElementById('stock-filter').value;
    
    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                           item.sku.toLowerCase().includes(searchTerm) ||
                           (item.model && item.model.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        const matchesBrand = !brandFilter || item.brand === brandFilter;
        const matchesStock = !stockFilter || 
                           (stockFilter === 'in-stock' && item.quantity >= 5) ||
                           (stockFilter === 'low-stock' && item.quantity < 5 && item.quantity > 0) ||
                           (stockFilter === 'out-of-stock' && item.quantity === 0);
        
        return matchesSearch && matchesCategory && matchesBrand && matchesStock;
    });
    
    renderFilteredInventory(filtered);
}

function renderFilteredInventory(filteredItems) {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(item => {
        const totalValue = item.quantity * item.price;
        const autoStatus = item.quantity === 0 ? 'out-of-stock' : 
                     item.quantity < 5 ? 'low-stock' : 'in-stock';
        const status = item.customStatus || autoStatus;
        
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.category.replace('-', ' ')}</td>
                <td>${item.brand || 'N/A'}</td>
                <td>${item.model || 'N/A'}</td>
                <td>${item.sku}</td>
                <td>${item.quantity}</td>
                <td>${item.unit || 'N/A'}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${totalValue.toFixed(2)}</td>
                <td>
                    <select class="inventory-status-dropdown" onchange="updateInventoryStatus(${item.id}, this.value)">
                        <option value="in-stock" ${status === 'in-stock' ? 'selected' : ''}>In Stock</option>
                        <option value="low-stock" ${status === 'low-stock' ? 'selected' : ''}>Low Stock</option>
                        <option value="out-of-stock" ${status === 'out-of-stock' ? 'selected' : ''}>Out of Stock</option>
                        <option value="discontinued" ${status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
                        <option value="on-order" ${status === 'on-order' ? 'selected' : ''}>On Order</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editItem(${item.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterOutsource() {
    const searchTerm = document.getElementById('search-outsource').value.toLowerCase();
    const statusFilter = document.getElementById('outsource-status-filter').value;
    const vendorFilter = document.getElementById('outsource-vendor-filter').value;
    
    const filtered = outsourceRepairs.filter(outsource => {
        const matchesSearch = outsource.customer.toLowerCase().includes(searchTerm) || 
                           outsource.deviceType.toLowerCase().includes(searchTerm) ||
                           outsource.issue.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || outsource.status === statusFilter;
        const matchesVendor = !vendorFilter || outsource.vendorId === parseInt(vendorFilter);
        
        return matchesSearch && matchesStatus && matchesVendor;
    });
    
    renderFilteredOutsource(filtered);
}

function renderFilteredOutsource(filteredItems) {
    const tbody = document.getElementById('outsource-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(outsource => {
        const statusClass = outsource.status === 'sent' ? 'status-pending' : 
                          outsource.status === 'in-progress' ? 'status-in-progress' :
                          outsource.status === 'completed' ? 'status-completed' : 'status-returned';
        
        const row = `
            <tr>
                <td>OS-${outsource.id}</td>
                <td>${outsource.customer}</td>
                <td>${outsource.deviceType}</td>
                <td>${outsource.issue.substring(0, 50)}${outsource.issue.length > 50 ? '...' : ''}</td>
                <td>${outsource.vendorName}</td>
                <td><span class="status-badge ${statusClass}">${outsource.status}</span></td>
                <td>${outsource.sentDate}</td>
                <td>${outsource.expectedReturn}</td>
                <td>₹${outsource.cost.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="updateOutsourceStatus(${outsource.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOutsource(${outsource.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterCustomers() {
    const searchTerm = document.getElementById('search-customers').value.toLowerCase();
    const statusFilter = document.getElementById('customer-status-filter').value;
    
    const filtered = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm) || 
                           customer.phone.toLowerCase().includes(searchTerm) ||
                           (customer.email && customer.email.toLowerCase().includes(searchTerm));
        const matchesStatus = !statusFilter || customer.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderFilteredCustomers(filtered);
}

function renderFilteredCustomers(filteredItems) {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(customer => {
        const statusClass = customer.status === 'active' ? 'status-in-stock' : 'status-out-of-stock';
        
        const row = `
            <tr>
                <td>C-${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${customer.address || 'N/A'}</td>
                <td>${customer.totalRepairs}</td>
                <td>${customer.lastVisit}</td>
                <td><span class="status-badge ${statusClass}">${customer.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editCustomer(${customer.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">Delete</button>
                    <button class="btn btn-sm btn-primary" onclick="viewCustomerHistory(${customer.id})">History</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function searchCustomersForOutsource() {
    const searchTerm = document.getElementById('outsource-customer').value.toLowerCase();
    const suggestionsContainer = document.getElementById('customer-suggestions');
    
    if (searchTerm.length < 2) {
        hideCustomerSuggestions();
        return;
    }
    
    const matchingCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );
    
    if (matchingCustomers.length > 0) {
        showCustomerSuggestions(matchingCustomers);
    } else {
        hideCustomerSuggestions();
    }
}

function showCustomerSuggestions(customers) {
    const suggestionsContainer = document.getElementById('customer-suggestions');
    suggestionsContainer.innerHTML = '';
    
    customers.forEach(customer => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'customer-suggestion-item';
        suggestionItem.innerHTML = `
            <div class="customer-suggestion-name">${customer.name}</div>
            <div class="customer-suggestion-details">${customer.phone} • ${customer.preferredDevice || 'No preference'}</div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            selectCustomerForOutsource(customer);
        });
        
        suggestionsContainer.appendChild(suggestionItem);
    });
    
    suggestionsContainer.style.display = 'block';
}

function hideCustomerSuggestions() {
    const suggestionsContainer = document.getElementById('customer-suggestions');
    suggestionsContainer.style.display = 'none';
}

function selectCustomerForOutsource(customer) {
    document.getElementById('outsource-customer').value = customer.name;
    hideCustomerSuggestions();
}

// Global functions
window.showModal = showModal;
window.closeModal = closeModal;
window.addPurchaseItem = addPurchaseItem;
window.removePurchaseItem = removePurchaseItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.editVendor = editVendor;
window.deleteVendor = deleteVendor;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.viewCustomerHistory = viewCustomerHistory;
window.searchCustomersForOutsource = searchCustomersForOutsource;
window.showCustomerSuggestions = showCustomerSuggestions;
window.hideCustomerSuggestions = hideCustomerSuggestions;
window.selectCustomerForOutsource = selectCustomerForOutsource;
window.deletePurchase = deletePurchase;
window.deleteRepair = deleteRepair;
window.updateRepairStatus = updateRepairStatus;
window.deleteOutsource = deleteOutsource;
window.updateOutsourceStatus = updateOutsourceStatus;
window.viewPurchase = viewPurchase;
window.addInvoiceItem = addInvoiceItem;
window.removeInvoiceItem = removeInvoiceItem;
window.viewInvoice = viewInvoice;
window.updateInvoiceStatus = updateInvoiceStatus;
window.deleteInvoice = deleteInvoice;
window.searchCustomersForInvoice = searchCustomersForInvoice;
window.showInvoiceCustomerSuggestions = showInvoiceCustomerSuggestions;
window.hideInvoiceCustomerSuggestions = hideInvoiceCustomerSuggestions;
window.selectCustomerForInvoice = selectCustomerForInvoice;
window.searchInventoryForInvoice = searchInventoryForInvoice;
window.showItemSuggestions = showItemSuggestions;
window.hideItemSuggestions = hideItemSuggestions;
window.hideAllItemSuggestions = hideAllItemSuggestions;
window.selectItemForInvoice = selectItemForInvoice;
window.renderQuotations = renderQuotations;
window.deleteQuotation = deleteQuotation;
window.updateQuotationStatus = updateQuotationStatus;
window.convertToRepair = convertToRepair;
window.createInvoiceFromRepair = createInvoiceFromRepair;
window.viewQuotation = viewQuotation;
window.searchCustomersForQuotation = searchCustomersForQuotation;
window.showQuotationCustomerSuggestions = showQuotationCustomerSuggestions;
window.hideQuotationCustomerSuggestions = hideQuotationCustomerSuggestions;
window.selectCustomerForQuotation = selectCustomerForQuotation;
window.addQuotationItem = addQuotationItem;
window.removeQuotationItem = removeQuotationItem;
window.calculateQuotationTotals = calculateQuotationTotals;
window.searchInventoryForQuotation = searchInventoryForQuotation;
window.selectItemForQuotation = selectItemForQuotation;
window.filterQuotations = filterQuotations;
window.renderFilteredQuotations = renderFilteredQuotations;
window.handleAddPickDrop = handleAddPickDrop;
window.deletePickDrop = deletePickDrop;
window.updatePickDropStatus = updatePickDropStatus;
window.viewPickDrop = viewPickDrop;
window.filterPickDrops = filterPickDrops;
window.renderFilteredPickDrops = renderFilteredPickDrops;
window.backToInvoiceList = backToInvoiceList;
window.printInvoice = printInvoice;
window.markInvoiceAsPaid = markInvoiceAsPaid;
window.editInvoice = editInvoice;
window.updateInvoiceActionButtons = updateInvoiceActionButtons;
window.setupInvoiceBackButton = setupInvoiceBackButton;
window.updateInvoiceStatusFromDetail = updateInvoiceStatusFromDetail;
window.updateInvoiceStatusFromList = updateInvoiceStatusFromList;

// Inventory status update function
function updateInventoryStatus(itemId, newStatus) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) { 
        alert('Item not found!'); 
        return; 
    }
    
    const oldStatus = item.quantity === 0 ? 'out-of-stock' : 
                     item.quantity < 5 ? 'low-stock' : 'in-stock';
    
    // Update the item's status (we'll store it as a custom status)
    item.customStatus = newStatus;
    saveData();
    
    alert(`Item status updated from "${oldStatus.replace('-', ' ')}" to "${newStatus.replace('-', ' ')}" successfully!`);
    updateDashboard();
}

window.updateInventoryStatus = updateInventoryStatus;

// Update renderInventory function to use dropdown
function renderInventoryWithDropdown() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';
    
    inventory.forEach(item => {
        const totalValue = item.quantity * item.price;
        const autoStatus = item.quantity === 0 ? 'out-of-stock' : 
                     item.quantity < 5 ? 'low-stock' : 'in-stock';
        const status = item.customStatus || autoStatus;
        console.log('Rendering item:', item.name, 'with unit:', item.unit, 'status:', status);
        
        const row = `
            <tr>
                <td>${item.name}</td>
                <td>${item.category.replace('-', ' ')}</td>
                <td>${item.brand || 'N/A'}</td>
                <td>${item.model || 'N/A'}</td>
                <td>${item.sku}</td>
                <td>${item.quantity}</td>
                <td>${item.unit || 'N/A'}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${totalValue.toFixed(2)}</td>
                <td>
                    <select class="inventory-status-dropdown" onchange="updateInventoryStatus(${item.id}, this.value)">
                        <option value="in-stock" ${status === 'in-stock' ? 'selected' : ''}>In Stock</option>
                        <option value="low-stock" ${status === 'low-stock' ? 'selected' : ''}>Low Stock</option>
                        <option value="out-of-stock" ${status === 'out-of-stock' ? 'selected' : ''}>Out of Stock</option>
                        <option value="discontinued" ${status === 'discontinued' ? 'selected' : ''}>Discontinued</option>
                        <option value="on-order" ${status === 'on-order' ? 'selected' : ''}>On Order</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editItem(${item.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

window.renderInventoryWithDropdown = renderInventoryWithDropdown;

// OTP Generation and Verification Functions
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendPickupOTP(pickDropId) {
    const pickDrop = pickDrops.find(pd => pd.id === pickDropId);
    if (!pickDrop) {
        alert('Pick & Drop not found!');
        return;
    }
    
    if (!pickDrop.otpEnabled) {
        alert('OTP verification is not enabled for this pick & drop!');
        return;
    }
    
    const otp = generateOTP();
    pickDrop.pickupOtp = otp;
    pickDrop.pickupOtpSent = true;
    pickDrop.pickupOtpVerified = false;
    saveData();
    
    // In a real application, this would send via SMS/Email
    alert(`Pickup OTP sent to customer: ${otp}\n\nIn a real application, this would be sent via SMS or email.`);
    
    renderPickDrops();
}



function verifyPickupOTP(pickDropId, enteredOtp) {
    const pickDrop = pickDrops.find(pd => pd.id === pickDropId);
    if (!pickDrop) {
        alert('Pick & Drop not found!');
        return false;
    }
    
    if (!pickDrop.pickupOtpSent) {
        alert('Please send pickup OTP first!');
        return false;
    }
    
    if (enteredOtp === pickDrop.pickupOtp) {
        pickDrop.pickupOtpVerified = true;
        pickDrop.status = 'picked-up';
        saveData();
        alert('Pickup OTP verified successfully! Status updated to "Picked Up".');
        renderPickDrops();
        return true;
    } else {
        alert('Invalid pickup OTP! Please try again.');
        return false;
    }
}



function showOTPVerificationModal(pickDropId, type) {
    const pickDrop = pickDrops.find(pd => pd.id === pickDropId);
    if (!pickDrop) {
        alert('Pick & Drop not found!');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>${type === 'pickup' ? 'Pickup' : 'Delivery'} OTP Verification</h3>
                <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
            </div>
            <div class="otp-verification">
                <h4>Customer: ${pickDrop.customer}</h4>
                <p><strong>Device:</strong> ${pickDrop.deviceType} ${pickDrop.deviceBrand} ${pickDrop.deviceModel}</p>
                <p><strong>Status:</strong> ${pickDrop.status}</p>
                
                <div class="otp-input-group">
                    <label>Enter OTP:</label>
                    <input type="text" class="otp-input" id="otp-input-${pickDropId}" maxlength="6" placeholder="000000">
                </div>
                
                <div class="otp-status ${type === 'pickup' ? (pickDrop.pickupOtpVerified ? 'verified' : 'pending') : (pickDrop.deliveryOtpVerified ? 'verified' : 'pending')}">
                    ${type === 'pickup' ? (pickDrop.pickupOtpVerified ? 'Pickup Verified' : 'Pickup Pending') : (pickDrop.deliveryOtpVerified ? 'Delivery Verified' : 'Delivery Pending')}
                </div>
                
                <div class="otp-actions">
                    <button class="btn btn-primary" onclick="send${type === 'pickup' ? 'Pickup' : 'Delivery'}OTP(${pickDropId})">Send OTP</button>
                    <button class="btn btn-success" onclick="verify${type === 'pickup' ? 'Pickup' : 'Delivery'}OTP(${pickDropId}, document.getElementById('otp-input-${pickDropId}').value)">Verify OTP</button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.generateOTP = generateOTP;
window.sendPickupOTP = sendPickupOTP;
window.sendDeliveryOTP = sendDeliveryOTP;
window.verifyPickupOTP = verifyPickupOTP;
window.verifyDeliveryOTP = verifyDeliveryOTP;
window.showOTPVerificationModal = showOTPVerificationModal;

// Helper function to generate OTP action buttons
function getOTPButtons(pickDrop) {
    if (!pickDrop.otpEnabled) return '';
    
    const pickupStatus = pickDrop.pickupOtpVerified ? '✅' : pickDrop.pickupOtpSent ? '📤' : '📱';
    
    return `
        <button class="btn btn-sm btn-info" onclick="showOTPVerificationModal(${pickDrop.id}, 'pickup')" title="Pickup OTP">${pickupStatus} Pickup</button>
    `;
}

window.getOTPButtons = getOTPButtons;

function updateInvoiceStatusFromList(invoiceId, newStatus) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) {
        alert('Invoice not found!');
        return;
    }
    
    const oldStatus = invoice.status;
    
    // Update the invoice status
    invoice.status = newStatus;
    saveData();
    
    // Show success message
    alert(`Invoice status updated from "${oldStatus}" to "${newStatus}" successfully!`);
    
    // Update the dashboard charts
    updateDashboard();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    loadData();
    setupEventListeners();
    renderAll();
    updateDashboard();
    
    // Debug user data on page load
    console.log('=== PAGE LOAD DEBUG ===');
    console.log('Users loaded:', users);
    console.log('localStorage users:', localStorage.getItem('users'));
    console.log('Admin user exists:', users.find(u => u.username === 'admin'));
    
    // Restore the last active section
    const lastSection = localStorage.getItem('lastActiveSection') || 'dashboard';
    console.log('Attempting to restore section:', lastSection);
    
    // Add a small delay to ensure DOM is fully ready
    setTimeout(() => {
        showSection(lastSection);
        console.log('Section restoration completed');
    }, 100);
    
    console.log('Application initialized successfully');
    console.log('Loaded quotations:', quotations);
    console.log('Restored section:', lastSection);
}); 

function viewPickDrop(id) {
    const pickDrop = pickDrops.find(pd => pd.id === id);
    if (pickDrop) {
        // Hide table and show pick & drop detail view
        document.getElementById('pickdrops-table-container').style.display = 'none';
        document.getElementById('pickdrop-detail-view').style.display = 'block';
        
        // Populate pick & drop details
        document.getElementById('pickdrop-service-id').textContent = `PD-${pickDrop.id.toString().padStart(4, '0')}`;
        document.getElementById('pickdrop-date').textContent = pickDrop.date || new Date().toISOString().split('T')[0];
        document.getElementById('pickdrop-status-select').value = pickDrop.status;
        
        // Populate customer details
        document.getElementById('pickdrop-customer-name').textContent = pickDrop.customer || 'Customer Name';
        document.getElementById('pickdrop-customer-phone').textContent = pickDrop.customerPhone || 'Customer Phone';
        document.getElementById('pickdrop-customer-email').textContent = pickDrop.customerEmail || 'customer@email.com';
        document.getElementById('pickdrop-customer-address').textContent = pickDrop.customerAddress || 'Customer Address';
        
        // Populate device details
        document.getElementById('pickdrop-device-type').textContent = pickDrop.deviceType;
        document.getElementById('pickdrop-device-brand').textContent = pickDrop.brand || 'N/A';
        document.getElementById('pickdrop-device-model').textContent = pickDrop.model || 'N/A';
        document.getElementById('pickdrop-device-serial').textContent = pickDrop.serial || `SN${pickDrop.id.toString().padStart(9, '0')}`;
        document.getElementById('pickdrop-device-issue').textContent = pickDrop.issue;
        
        // Populate service details
        document.getElementById('pickdrop-service-type').textContent = 'Pick & Drop';
        document.getElementById('pickdrop-pickup-address').textContent = pickDrop.pickupAddress || pickDrop.customerAddress || 'Customer Address';
        document.getElementById('pickdrop-pickup-time').textContent = pickDrop.pickupTime || '10:00 AM - 12:00 PM';
        
        // Populate OTP status
        document.getElementById('pickdrop-pickup-otp').textContent = pickDrop.pickupOTP || 'Not sent';
        
        // Display device images
        displayPickDropImages(pickDrop.images || []);
        
        // Store current pick & drop ID for actions
        window.currentPickDropId = id;
    }
}

function editQuotation() {
    if (window.currentQuotationId) {
        // For now, just show an alert. You can implement a full edit modal later
        alert('Edit functionality will be implemented in the next update.');
    }
}

function viewJobCard(id) {
    const repair = repairs.find(r => r.id === id);
    if (repair) {
        // Set the current editing job card ID
        currentEditingJobCardId = id;
        
        // Hide table and show job card detail view
        document.getElementById('repairs-table-container').style.display = 'none';
        document.getElementById('job-card-detail-view').style.display = 'block';
        
        // Populate job card details
        document.getElementById('job-card-number').textContent = `JC-${repair.id.toString().padStart(4, '0')}`;
        document.getElementById('job-card-date').textContent = repair.startDate;
        document.getElementById('job-card-status-select').value = repair.status;
        document.getElementById('job-card-technician').textContent = currentUser?.fullName || 'Technician';
        
        // Populate customer details
        document.getElementById('job-card-customer-name').textContent = repair.customer;
        document.getElementById('job-card-customer-phone').textContent = 'Customer Phone'; // You can extend this
        document.getElementById('job-card-customer-email').textContent = 'customer@email.com'; // You can extend this
        document.getElementById('job-card-customer-address').textContent = 'Customer Address'; // You can extend this
        
        // Populate device details
        document.getElementById('job-card-device-type').textContent = repair.deviceType;
        document.getElementById('job-card-device-brand').textContent = repair.brand || 'N/A';
        document.getElementById('job-card-device-model').textContent = repair.model || 'N/A';
        document.getElementById('job-card-serial').textContent = repair.serial || `SN${repair.id.toString().padStart(9, '0')}`;
        document.getElementById('job-card-issue').textContent = repair.issue;
        
        // Populate diagnosis (you can extend this with actual diagnosis data)
        document.getElementById('job-card-diagnosis-text').textContent = 'Initial assessment completed. Device requires repair work.';
        document.getElementById('job-card-estimated-cost').textContent = '₹' + (Math.random() * 10000 + 5000).toFixed(0);
        document.getElementById('job-card-estimated-time').textContent = `${repair.estimate || 7} days`;
        
        // Display device images
        displayJobCardImages(repair.images || []);
        
        // Update progress timeline based on status
        updateJobCardProgress(repair.status);
        
        // Update action buttons based on status
        updateJobCardActionButtons(repair.status);
        
        // Store current repair ID for actions
        window.currentJobCardId = id;
    }
}

function backToRepairList() {
    document.getElementById('job-card-detail-view').style.display = 'none';
    document.getElementById('repairs-table-container').style.display = 'block';
    window.currentJobCardId = null;
}

function updateJobCardStatusFromDetail() {
    if (window.currentJobCardId) {
        const newStatus = document.getElementById('job-card-status-select').value;
        updateRepairStatus(window.currentJobCardId, newStatus);
    }
}

function updateJobCardProgress(status) {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Reset all steps
    progressSteps.forEach(step => {
        step.classList.remove('completed', 'active');
    });
    
    // Update steps based on status
    switch (status) {
        case 'pending':
            progressSteps[0].classList.add('completed');
            break;
        case 'in-progress':
            progressSteps[0].classList.add('completed');
            progressSteps[1].classList.add('active');
            break;
        case 'completed':
            progressSteps[0].classList.add('completed');
            progressSteps[1].classList.add('completed');
            progressSteps[2].classList.add('active');
            break;
        case 'delivered':
            progressSteps.forEach(step => step.classList.add('completed'));
            break;
    }
}

function updateJobCardActionButtons(status) {
    const completeBtn = document.querySelector('.job-card-actions .btn-success');
    const deliverBtn = document.querySelector('.job-card-actions .btn-info');
    const editBtn = document.querySelector('.job-card-actions .btn-secondary');
    
    // Reset all buttons
    if (completeBtn) completeBtn.style.display = 'inline-block';
    if (deliverBtn) deliverBtn.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'inline-block';
    
    // Hide buttons based on status
    switch (status) {
        case 'completed':
            if (completeBtn) completeBtn.style.display = 'none';
            break;
        case 'delivered':
            if (completeBtn) completeBtn.style.display = 'none';
            if (deliverBtn) deliverBtn.style.display = 'none';
            break;
        case 'cancelled':
            if (completeBtn) completeBtn.style.display = 'none';
            if (deliverBtn) deliverBtn.style.display = 'none';
            break;
    }
}

function printJobCard() {
    if (!window.currentJobCardId) {
        alert('No job card selected for printing');
        return;
    }
    
    const repair = repairs.find(r => r.id === window.currentJobCardId);
    if (!repair) {
        alert('Job card not found');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Job Card - ${repair.customer}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 10px;
                    background: white;
                    font-size: 12px;
                }
                .job-card {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid #333;
                    padding: 15px;
                    background: white;
                    page-break-inside: avoid;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                .company-info {
                    margin-bottom: 15px;
                }
                .logo-section {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                }
                .logo {
                    font-size: 32px;
                    margin-right: 10px;
                }
                .company-info h1 {
                    color: #333;
                    margin: 0;
                    font-size: 20px;
                }
                .company-info p {
                    margin: 3px 0;
                    color: #666;
                    font-size: 11px;
                }
                .job-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .section {
                    border: 1px solid #ddd;
                    padding: 10px;
                    border-radius: 5px;
                }
                .section h3 {
                    margin: 0 0 8px 0;
                    color: #333;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 3px;
                    font-size: 14px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 11px;
                }
                .info-label {
                    font-weight: bold;
                    color: #555;
                }
                .info-value {
                    color: #333;
                }
                .device-info {
                    grid-column: 1 / -1;
                }
                .progress-section {
                    grid-column: 1 / -1;
                    margin-top: 15px;
                }
                .progress-timeline {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 10px;
                }
                .progress-step {
                    text-align: center;
                    flex: 1;
                }
                .step-icon {
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    background: #ddd;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 8px;
                    font-size: 10px;
                }
                .progress-step.completed .step-icon {
                    background: #28a745;
                    color: white;
                }
                .progress-step.active .step-icon {
                    background: #007bff;
                    color: white;
                }
                .step-title {
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .step-status {
                    font-size: 9px;
                    color: #666;
                }
                .diagnosis-section {
                    grid-column: 1 / -1;
                    margin-top: 15px;
                }
                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                }
                .signature-box {
                    width: 45%;
                    text-align: center;
                }
                .signature-line {
                    border-top: 1px solid #000;
                    margin-top: 30px;
                    margin-bottom: 5px;
                }
                .signature-box p {
                    margin: 5px 0;
                    font-weight: bold;
                    font-size: 11px;
                }
                .signature-box small {
                    color: #666;
                    font-size: 9px;
                }
                .footer {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 10px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                .footer p {
                    margin: 3px 0;
                }
                @media print {
                    body { margin: 0; }
                    .job-card { border: none; }
                    @page { size: A4; margin: 10mm; }
                }
            </style>
        </head>
        <body>
            <div class="job-card">
                <div class="header">
                    <div class="company-info">
                        <div class="logo-section">
                            <div class="logo">🔧</div>
                            <h1>RepairManiac</h1>
                        </div>
                        <p>O-109, First Floor, The Shopping Mall, Arjun Marg, DLF CIty Phase-1, Gurugram, Haryana-122002</p>
                        <p>Phone: 9560455637 | Email: info@repairmaniac.com</p>
                        <p>Generated on: ${currentDate} at ${currentTime}</p>
                    </div>
                </div>
                
                <div class="job-details">
                    <div class="section">
                        <h3>Job Card Details</h3>
                        <div class="info-row">
                            <span class="info-label">Job Card No:</span>
                            <span class="info-value">JC-${repair.id.toString().padStart(4, '0')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date:</span>
                            <span class="info-value">${repair.startDate}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="info-value">${repair.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Technician:</span>
                            <span class="info-value">${currentUser?.fullName || 'Technician'}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Customer Information</h3>
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${repair.customer}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${repair.customerPhone || 'Customer Phone'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${formatEmailForDisplay(repair.customerEmail)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Address:</span>
                            <span class="info-value">${repair.customerAddress || 'Customer Address'}</span>
                        </div>
                    </div>
                    
                    <div class="section device-info">
                        <h3>Device Information</h3>
                        <div class="info-row">
                            <span class="info-label">Device Type:</span>
                            <span class="info-value">${repair.deviceType}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Brand:</span>
                            <span class="info-value">${repair.brand || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Model Number:</span>
                            <span class="info-value">${repair.model || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">IMEI/Serial Number:</span>
                            <span class="info-value">${repair.serial || `SN${repair.id.toString().padStart(9, '0')}`}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Issue Reported:</span>
                            <span class="info-value">${repair.issue}</span>
                        </div>
                    </div>
                    
                    <div class="section diagnosis-section">
                        <h3>Technical Diagnosis</h3>
                        <div class="info-row">
                            <span class="info-label">Initial Assessment:</span>
                            <span class="info-value">${repair.diagnosis || 'Device requires repair work'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Required Parts:</span>
                            <span class="info-value">${repair.parts || 'Replacement parts as needed'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Estimated Cost:</span>
                            <span class="info-value">₹${repair.estimatedCost || (Math.random() * 10000 + 5000).toFixed(0)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Estimated Time:</span>
                            <span class="info-value">${repair.estimatedTime || (repair.estimate || 7) + ' days'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="signature-section">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>Technician Signature</p>
                        <small>Date: ${currentDate}</small>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>Customer Signature</p>
                        <small>Date: ${currentDate}</small>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Thank you for choosing RepairManiac!</p>
                    <p>For any queries, please contact us at 9560455637</p>
                    <p>Email: info@repairmaniac.com</p>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function updateJobCardStatus(status) {
    if (window.currentJobCardId) {
        updateRepairStatus(window.currentJobCardId, status);
        document.getElementById('job-card-status-select').value = status;
        updateJobCardProgress(status);
        updateJobCardActionButtons(status);
        alert(`Job card status updated to ${status}!`);
    }
}

function addJobCardNote() {
    const note = prompt('Enter a note for the job card:');
    if (note) {
        // You can implement note storage and display here
        alert('Note added successfully!');
    }
}

function editJobCard() {
    if (window.currentJobCardId) {
        // For now, just show an alert. You can implement a full edit modal later
        alert('Edit functionality will be implemented in the next update.');
    }
}

// Image capture and upload functionality
let currentImageContext = null;
let mediaStream = null;

function captureDeviceImage(context) {
    currentImageContext = context;
    
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not available in this browser. Please use the upload option instead.');
        return;
    }
    
    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            mediaStream = stream;
            const video = document.getElementById('camera-video');
            video.srcObject = stream;
            
            // Show camera preview
            document.getElementById('camera-preview').style.display = 'flex';
        })
        .catch(err => {
            console.error('Camera access error:', err);
            alert('Unable to access camera. Please use the upload option instead.');
        });
}

function uploadDeviceImage(context) {
    currentImageContext = context;
    const inputId = context === 'pickdrop' ? 'pickdrop-image-input' : 'repair-image-input';
    document.getElementById(inputId).click();
}

function handleImageUpload(context, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            addImageToContainer(context, e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    }
    input.value = ''; // Reset input
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Add image to container
    addImageToContainer(currentImageContext, imageData, `captured_${Date.now()}.jpg`);
    
    // Close camera
    closeCamera();
}

function closeCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    document.getElementById('camera-preview').style.display = 'none';
    currentImageContext = null;
}

function addImageToContainer(context, imageData, fileName) {
    const containerId = context === 'pickdrop' ? 'pickdrop-images-container' : 'repair-images-container';
    const container = document.getElementById(containerId);
    
    const imageItem = document.createElement('div');
    imageItem.className = 'device-image-item';
    imageItem.innerHTML = `
        <img src="${imageData}" alt="Device Image" onclick="openImageModal('${imageData}')">
        <div class="image-overlay">
            <button class="btn" onclick="removeImage(this, '${context}')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `;
    
    container.appendChild(imageItem);
    
    // Store image data for form submission
    if (!window.deviceImages) window.deviceImages = {};
    if (!window.deviceImages[context]) window.deviceImages[context] = [];
    window.deviceImages[context].push({
        data: imageData,
        fileName: fileName
    });
}

function removeImage(button, context) {
    const imageItem = button.closest('.device-image-item');
    const imageSrc = imageItem.querySelector('img').src;
    
    // Remove from stored images
    if (window.deviceImages && window.deviceImages[context]) {
        window.deviceImages[context] = window.deviceImages[context].filter(img => img.data !== imageSrc);
    }
    
    imageItem.remove();
}

function openImageModal(imageSrc) {
    document.getElementById('modal-image').src = imageSrc;
    document.getElementById('image-modal').style.display = 'flex';
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
}

function displayJobCardImages(images) {
    const gallery = document.getElementById('job-card-images-gallery');
    gallery.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'gallery-image-item';
            imageItem.innerHTML = `
                <img src="${image.data}" alt="Device Image ${index + 1}" onclick="openImageModal('${image.data}')">
            `;
            gallery.appendChild(imageItem);
        });
    } else {
        gallery.innerHTML = '<p style="color: #64748b; text-align: center;">No device images available</p>';
    }
}

// Customer Autocomplete Functions
function setupCustomerAutocomplete() {
    const customerInputs = [
        'repair-customer',
        'pickdrop-customer',
        'edit-job-card-customer'
    ];
    
    customerInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                if (query.length >= 2) {
                    const filteredCustomers = customers.filter(customer => 
                        customer.name.toLowerCase().includes(query) ||
                        customer.phone.includes(query) ||
                        customer.email.toLowerCase().includes(query)
                    );
                    showCustomerSuggestions(filteredCustomers, inputId);
                } else {
                    hideCustomerSuggestions(inputId);
                }
            });
            
            input.addEventListener('blur', function() {
                setTimeout(() => hideCustomerSuggestions(inputId), 200);
            });
        }
    });
    
    // Setup autocomplete for dynamically created elements
    setupDynamicCustomerAutocomplete();
}

function setupDynamicCustomerAutocomplete() {
    // This function will be called when modals are opened to ensure autocomplete works
    const editCustomerInput = document.getElementById('edit-job-card-customer');
    if (editCustomerInput && !editCustomerInput.hasAttribute('data-autocomplete-setup')) {
        editCustomerInput.setAttribute('data-autocomplete-setup', 'true');
        editCustomerInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            if (query.length >= 2) {
                const filteredCustomers = customers.filter(customer => 
                    customer.name.toLowerCase().includes(query) ||
                    customer.phone.includes(query) ||
                    customer.email.toLowerCase().includes(query)
                );
                showCustomerSuggestions(filteredCustomers, 'edit-job-card-customer');
            } else {
                hideCustomerSuggestions('edit-job-card-customer');
            }
        });
        
        editCustomerInput.addEventListener('blur', function() {
            setTimeout(() => hideCustomerSuggestions('edit-job-card-customer'), 200);
        });
    }
}

function showCustomerSuggestions(filteredCustomers, inputId) {
    const suggestionsContainer = document.getElementById(inputId + '-suggestions');
    if (!suggestionsContainer) return;
    
    suggestionsContainer.innerHTML = '';
    
    if (filteredCustomers.length === 0) {
        suggestionsContainer.innerHTML = '<div class="customer-suggestion-item">No customers found</div>';
    } else {
        filteredCustomers.forEach(customer => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'customer-suggestion-item';
            suggestionItem.innerHTML = `
                <div class="customer-suggestion-name">${customer.name}</div>
                <div class="customer-suggestion-details">${customer.phone} • ${customer.email}</div>
            `;
            suggestionItem.addEventListener('click', () => {
                selectCustomerForInput(customer, inputId);
            });
            suggestionsContainer.appendChild(suggestionItem);
        });
    }
    
    suggestionsContainer.style.display = 'block';
}

function hideCustomerSuggestions(inputId) {
    const suggestionsContainer = document.getElementById(inputId + '-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectCustomerForInput(customer, inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = customer.name;
        
        // If this is the edit job card form, populate other fields
        if (inputId === 'edit-job-card-customer') {
            populateEditJobCardForm(customer);
        }
        
        // If it's the edit pick & drop form, populate other fields
        if (inputId === 'edit-pickdrop-customer') {
            populateEditPickDropForm(customer);
        }
        
        // If it's the add pick & drop form, populate pickup and delivery addresses
        if (inputId === 'pickdrop-customer') {
            populatePickDropForm(customer);
        }
        
        // If it's the add delivery form, populate delivery address
        if (inputId === 'delivery-customer') {
            populateDeliveryForm(customer);
        }
    }
    hideCustomerSuggestions(inputId);
}

function populateEditJobCardForm(customer) {
    document.getElementById('edit-job-card-phone').value = customer.phone || '';
    document.getElementById('edit-job-card-address').value = customer.address || '';
}

function populateEditPickDropForm(customer) {
    document.getElementById('edit-pickdrop-phone').value = customer.phone || '';
    document.getElementById('edit-pickdrop-email').value = customer.email || '';
    document.getElementById('edit-pickdrop-address').value = customer.address || '';
}

function populatePickDropForm(customer) {
    // Populate pickup and delivery addresses with customer address
    document.getElementById('pickdrop-pickup-address').value = customer.address || '';
    document.getElementById('pickdrop-delivery-address').value = customer.address || '';
}

// Edit Job Card Functions
let currentEditingJobCardId = null;

function editJobCard() {
    if (!currentEditingJobCardId) {
        alert('No job card selected for editing');
        return;
    }
    
    const repair = repairs.find(r => r.id === currentEditingJobCardId);
    if (!repair) {
        alert('Job card not found');
        return;
    }
    
    // Populate the edit form
    document.getElementById('edit-job-card-customer').value = repair.customer || '';
    document.getElementById('edit-job-card-phone').value = repair.customerPhone || '';
    document.getElementById('edit-job-card-address').value = repair.customerAddress || '';
    document.getElementById('edit-job-card-device').value = repair.deviceType || '';
    document.getElementById('edit-job-card-brand').value = repair.brand || '';
    document.getElementById('edit-job-card-model').value = repair.model || '';
    document.getElementById('edit-job-card-serial').value = repair.serial || '';
    document.getElementById('edit-job-card-issue').value = repair.issue || '';
    document.getElementById('edit-job-card-diagnosis').value = repair.diagnosis || '';
    document.getElementById('edit-job-card-parts').value = repair.parts || '';
    document.getElementById('edit-job-card-estimated-cost').value = repair.estimatedCost || '';
    document.getElementById('edit-job-card-estimated-time').value = repair.estimatedTime || '';
    document.getElementById('edit-job-card-status').value = repair.status || 'pending';
    
    // Initialize image container with existing images
    initializeEditJobCardImages(repair.images || []);
    
    // Setup dynamic autocomplete
    setupDynamicCustomerAutocomplete();
    
    // Show the modal
    showModal('edit-job-card-modal');
    
    // Setup form submission
    const form = document.getElementById('edit-job-card-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        updateJobCardData();
    };
}

function updateJobCardData() {
    if (!currentEditingJobCardId) return;
    
    const repairIndex = repairs.findIndex(r => r.id === currentEditingJobCardId);
    if (repairIndex === -1) return;
    
    // Get current images from the edit form
    const currentImages = window.deviceImages?.['edit-job-card'] || [];
    
    // Update repair data
    repairs[repairIndex] = {
        ...repairs[repairIndex],
        customer: document.getElementById('edit-job-card-customer').value || repairs[repairIndex].customer,
        customerPhone: document.getElementById('edit-job-card-phone').value || repairs[repairIndex].customerPhone,
        customerAddress: document.getElementById('edit-job-card-address').value || repairs[repairIndex].customerAddress,
        deviceType: document.getElementById('edit-job-card-device').value || repairs[repairIndex].deviceType,
        brand: document.getElementById('edit-job-card-brand').value || repairs[repairIndex].brand,
        model: document.getElementById('edit-job-card-model').value || repairs[repairIndex].model,
        serial: document.getElementById('edit-job-card-serial').value || repairs[repairIndex].serial,
        issue: document.getElementById('edit-job-card-issue').value || repairs[repairIndex].issue,
        diagnosis: document.getElementById('edit-job-card-diagnosis').value || repairs[repairIndex].diagnosis,
        parts: document.getElementById('edit-job-card-parts').value || repairs[repairIndex].parts,
        estimatedCost: document.getElementById('edit-job-card-estimated-cost').value || repairs[repairIndex].estimatedCost,
        estimatedTime: document.getElementById('edit-job-card-estimated-time').value || repairs[repairIndex].estimatedTime,
        status: document.getElementById('edit-job-card-status').value || repairs[repairIndex].status,
        images: currentImages
    };
    
    // Save data
    saveData();
    
    // Update the job card view if it's currently displayed
    if (document.getElementById('job-card-detail-view').style.display !== 'none') {
        viewJobCard(currentEditingJobCardId);
    }
    
    // Update the repairs table
    renderRepairs();
    
    // Close modal
    closeEditJobCardModal();
    
    alert('Job card updated successfully!');
}

function closeEditJobCardModal() {
    closeModal('edit-job-card-modal');
    currentEditingJobCardId = null;
}

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to format email for display
function formatEmailForDisplay(email) {
    if (!email) return 'customer@email.com';
    if (validateEmail(email)) {
        return email;
    } else {
        return 'Invalid Email Format';
    }
}

// Image management functions for job card
function addImageToJobCard() {
    if (!window.currentJobCardId) {
        alert('No job card selected');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                const fileName = file.name;
                addImageToJobCardContainer(imageData, fileName);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function addImageToJobCardContainer(imageData, fileName) {
    const repair = repairs.find(r => r.id === window.currentJobCardId);
    if (!repair) return;
    
    // Add image to repair data
    if (!repair.images) repair.images = [];
    repair.images.push({
        data: imageData,
        fileName: fileName,
        addedTime: new Date().toLocaleString()
    });
    
    // Save data
    saveData();
    
    // Update display
    displayJobCardImages(repair.images);
    
    alert('Image added successfully!');
}

function editJobCardImages() {
    if (!window.currentJobCardId) {
        alert('No job card selected');
        return;
    }
    
    const repair = repairs.find(r => r.id === window.currentJobCardId);
    if (!repair || !repair.images || repair.images.length === 0) {
        alert('No images to edit');
        return;
    }
    
    const imageList = repair.images.map((img, index) => 
        `${index + 1}. ${img.fileName} (${img.addedTime})`
    ).join('\n');
    
    const action = prompt(`Current images:\n${imageList}\n\nEnter image number to delete (or 'cancel' to cancel):`);
    
    if (action && action.toLowerCase() !== 'cancel') {
        const imageIndex = parseInt(action) - 1;
        if (imageIndex >= 0 && imageIndex < repair.images.length) {
            if (confirm(`Delete image: ${repair.images[imageIndex].fileName}?`)) {
                repair.images.splice(imageIndex, 1);
                saveData();
                displayJobCardImages(repair.images);
                alert('Image deleted successfully!');
            }
        } else {
            alert('Invalid image number');
        }
    }
}

// Function to update progress timeline with timestamps
function updateJobCardProgressTimeline(status, timestamp) {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Update the appropriate step based on status
    switch (status) {
        case 'completed':
            if (progressSteps[2]) { // Quality Testing step
                const stepContent = progressSteps[2].querySelector('.step-content');
                if (stepContent) {
                    const smallElement = stepContent.querySelector('small');
                    if (smallElement) {
                        smallElement.textContent = timestamp;
                    }
                }
            }
            break;
        case 'delivered':
            if (progressSteps[3]) { // Ready for Delivery step
                const stepContent = progressSteps[3].querySelector('.step-content');
                if (stepContent) {
                    const smallElement = stepContent.querySelector('small');
                    if (smallElement) {
                        smallElement.textContent = timestamp;
                    }
                }
            }
            break;
    }
}

function qualityCheck() {
    if (!window.currentJobCardId) {
        alert('No job card selected for quality check');
        return;
    }
    
    const repair = repairs.find(r => r.id === window.currentJobCardId);
    if (!repair) {
        alert('Job card not found');
        return;
    }
    
    const currentTime = new Date().toLocaleString();
    const qualityNote = prompt('Enter quality check notes:');
    
    if (qualityNote !== null) {
        // Update repair status to completed
        const repairIndex = repairs.findIndex(r => r.id === window.currentJobCardId);
        if (repairIndex !== -1) {
            repairs[repairIndex].status = 'completed';
            repairs[repairIndex].qualityCheckNote = qualityNote;
            repairs[repairIndex].qualityCheckTime = currentTime;
            
            // Save data
            saveData();
            
            // Update job card view
            updateJobCardProgress('completed');
            updateJobCardActionButtons('completed');
            
            // Update the progress timeline in the job card view
            updateJobCardProgressTimeline('completed', currentTime);
            
            // Update repairs table
            renderRepairs();
            
            alert('Quality check completed successfully!');
        }
    }
}

function readyForDelivery() {
    if (!window.currentJobCardId) {
        alert('No job card selected for delivery preparation');
        return;
    }
    
    const repair = repairs.find(r => r.id === window.currentJobCardId);
    if (!repair) {
        alert('Job card not found');
        return;
    }
    
    const currentTime = new Date().toLocaleString();
    const deliveryNote = prompt('Enter delivery preparation notes:');
    
    if (deliveryNote !== null) {
        // Update repair status to ready for delivery
        const repairIndex = repairs.findIndex(r => r.id === window.currentJobCardId);
        if (repairIndex !== -1) {
            repairs[repairIndex].status = 'ready-for-delivery';
            repairs[repairIndex].deliveryNote = deliveryNote;
            repairs[repairIndex].readyForDeliveryTime = currentTime;
            
            // Create delivery entry
            const customer = customers.find(c => c.name === repair.customer);
            const deliveryData = {
                customer: repair.customer,
                customerPhone: customer ? customer.phone : '',
                customerEmail: customer ? customer.email : '',
                customerAddress: customer ? customer.address : '',
                repairId: repair.id,
                deviceType: repair.deviceType,
                brand: repair.brand,
                model: repair.model,
                serial: repair.serial,
                deliveryAddress: customer ? customer.address : '',
                scheduledDate: new Date().toISOString().split('T')[0],
                scheduledTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
                deliveryAgent: '',
                deliveryAgentPhone: '',
                status: 'scheduled',
                fee: 0,
                instructions: deliveryNote,
                notes: `Auto-created from repair JC-${repair.id.toString().padStart(4, '0')}`,
                scheduledTime: new Date().toISOString(),
                outForDeliveryTime: null,
                deliveredTime: null,
                failedTime: null
            };
            
            const newDelivery = {
                id: deliveries.length > 0 ? Math.max(...deliveries.map(d => d.id)) + 1 : 1,
                ...deliveryData,
                createdAt: new Date().toISOString()
            };
            
            deliveries.push(newDelivery);
            saveDeliveryData();
            
            // Save repair data
            saveData();
            
            // Update job card view
            updateJobCardProgress('ready-for-delivery');
            updateJobCardActionButtons('ready-for-delivery');
            
            // Update the progress timeline in the job card view
            updateJobCardProgressTimeline('ready-for-delivery', currentTime);
            
            // Update repairs table
            renderRepairs();
            
            // Update deliveries table
            renderDeliveries();
            
            alert(`Device marked as ready for delivery! Delivery entry DL-${newDelivery.id.toString().padStart(4, '0')} has been created.`);
        }
    }
}

function initializeEditJobCardImages(images) {
    const container = document.getElementById('edit-job-card-images-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'device-image-item';
            imageItem.innerHTML = `
                <img src="${image.data}" alt="Device Image ${index + 1}" onclick="openImageModal('${image.data}')">
                <div class="image-overlay">
                    <button class="btn btn-sm btn-danger" onclick="removeImage(this, 'edit-job-card')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(imageItem);
        });
    }
    
    // Store images for the edit context
    if (!window.deviceImages) window.deviceImages = {};
    window.deviceImages['edit-job-card'] = images || [];
}

// Pick & Drop Detail View Functions
function backToPickDropList() {
    document.getElementById('pickdrop-detail-view').style.display = 'none';
    document.getElementById('pickdrops-table-container').style.display = 'block';
    window.currentPickDropId = null;
}

function updatePickDropStatusFromDetail() {
    if (window.currentPickDropId) {
        const newStatus = document.getElementById('pickdrop-status-select').value;
        updatePickDropStatus(window.currentPickDropId, newStatus);
    }
}

function displayPickDropImages(images) {
    const gallery = document.getElementById('pickdrop-images-gallery');
    gallery.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'gallery-image-item';
            imageItem.innerHTML = `
                <img src="${image.data}" alt="Device Image ${index + 1}" onclick="openImageModal('${image.data}')">
            `;
            gallery.appendChild(imageItem);
        });
    } else {
        gallery.innerHTML = '<p style="color: #64748b; text-align: center;">No device images available</p>';
    }
}

function sendPickupOTPFromDetail() {
    if (window.currentPickDropId) {
        sendPickupOTP(window.currentPickDropId);
    }
}



function addPickDropNote() {
    if (window.currentPickDropId) {
        const note = prompt('Enter note for this pick & drop service:');
        if (note !== null) {
            const pickDropIndex = pickDrops.findIndex(pd => pd.id === window.currentPickDropId);
            if (pickDropIndex !== -1) {
                pickDrops[pickDropIndex].notes = note;
                saveData();
                alert('Note added successfully!');
            }
        }
    }
}

function editPickDrop() {
    if (window.currentPickDropId) {
        const pickDrop = pickDrops.find(pd => pd.id === window.currentPickDropId);
        if (pickDrop) {
            // Populate the edit form with current data
            document.getElementById('edit-pickdrop-customer').value = pickDrop.customer || '';
            document.getElementById('edit-pickdrop-phone').value = pickDrop.customerPhone || '';
            document.getElementById('edit-pickdrop-email').value = pickDrop.customerEmail || '';
            document.getElementById('edit-pickdrop-address').value = pickDrop.customerAddress || '';
            document.getElementById('edit-pickdrop-device-type').value = pickDrop.deviceType || 'laptop';
            document.getElementById('edit-pickdrop-brand').value = pickDrop.brand || '';
            document.getElementById('edit-pickdrop-model').value = pickDrop.model || '';
            document.getElementById('edit-pickdrop-serial').value = pickDrop.serial || '';
            document.getElementById('edit-pickdrop-issue').value = pickDrop.issue || '';
            document.getElementById('edit-pickdrop-pickup-address').value = pickDrop.pickupAddress || '';
            document.getElementById('edit-pickdrop-delivery-address').value = pickDrop.deliveryAddress || '';
            document.getElementById('edit-pickdrop-pickup-date').value = pickDrop.pickupDate || '';
            document.getElementById('edit-pickdrop-pickup-time').value = pickDrop.pickupTime || '';
            document.getElementById('edit-pickdrop-delivery-date').value = pickDrop.deliveryDate || '';
            document.getElementById('edit-pickdrop-delivery-time').value = pickDrop.deliveryTime || '';
            document.getElementById('edit-pickdrop-status').value = pickDrop.status || 'scheduled';
            document.getElementById('edit-pickdrop-fee').value = pickDrop.fee || 0;
            document.getElementById('edit-pickdrop-instructions').value = pickDrop.instructions || '';
            document.getElementById('edit-pickdrop-notes').value = pickDrop.notes || '';
            
            // Initialize images
            initializeEditPickDropImages(pickDrop.images || []);
            
            // Setup customer autocomplete for edit form
            setupEditPickDropCustomerAutocomplete();
            
            // Show the modal
            showModal('edit-pickdrop-modal');
        }
    }
}

function printPickDrop() {
    if (window.currentPickDropId) {
        alert('Print functionality will be implemented in the next update.');
    }
}

// Edit Pick & Drop Functions
function updatePickDropData(event) {
    event.preventDefault();
    
    if (window.currentPickDropId) {
        const pickDropIndex = pickDrops.findIndex(pd => pd.id === window.currentPickDropId);
        if (pickDropIndex !== -1) {
            // Get form values
            const updatedPickDrop = {
                ...pickDrops[pickDropIndex], // Keep existing data
                customer: document.getElementById('edit-pickdrop-customer').value || pickDrops[pickDropIndex].customer,
                customerPhone: document.getElementById('edit-pickdrop-phone').value || pickDrops[pickDropIndex].customerPhone,
                customerEmail: document.getElementById('edit-pickdrop-email').value || pickDrops[pickDropIndex].customerEmail,
                customerAddress: document.getElementById('edit-pickdrop-address').value || pickDrops[pickDropIndex].customerAddress,
                deviceType: document.getElementById('edit-pickdrop-device-type').value || pickDrops[pickDropIndex].deviceType,
                brand: document.getElementById('edit-pickdrop-brand').value || pickDrops[pickDropIndex].brand,
                model: document.getElementById('edit-pickdrop-model').value || pickDrops[pickDropIndex].model,
                serial: document.getElementById('edit-pickdrop-serial').value || pickDrops[pickDropIndex].serial,
                issue: document.getElementById('edit-pickdrop-issue').value || pickDrops[pickDropIndex].issue,
                pickupAddress: document.getElementById('edit-pickdrop-pickup-address').value || pickDrops[pickDropIndex].pickupAddress,
                pickupDate: document.getElementById('edit-pickdrop-pickup-date').value || pickDrops[pickDropIndex].pickupDate,
                pickupTime: document.getElementById('edit-pickdrop-pickup-time').value || pickDrops[pickDropIndex].pickupTime,
                status: document.getElementById('edit-pickdrop-status').value || pickDrops[pickDropIndex].status,
                fee: parseFloat(document.getElementById('edit-pickdrop-fee').value) || pickDrops[pickDropIndex].fee,
                instructions: document.getElementById('edit-pickdrop-instructions').value || pickDrops[pickDropIndex].instructions,
                notes: document.getElementById('edit-pickdrop-notes').value || pickDrops[pickDropIndex].notes,
                images: window.deviceImages['edit-pickdrop'] || pickDrops[pickDropIndex].images || []
            };
            
            // Update the pick & drop
            pickDrops[pickDropIndex] = updatedPickDrop;
            saveData();
            
            // Update the detail view
            viewPickDrop(window.currentPickDropId);
            
            // Update the table
            renderPickDrops();
            
            // Close the modal
            closeEditPickDropModal();
            
            alert('Pick & Drop details updated successfully!');
        }
    }
}

function closeEditPickDropModal() {
    closeModal('edit-pickdrop-modal');
    window.currentPickDropId = null;
}

function initializeEditPickDropImages(images) {
    const container = document.getElementById('edit-pickdrop-images-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'device-image-item';
            imageItem.innerHTML = `
                <img src="${image.data}" alt="Device Image ${index + 1}" onclick="openImageModal('${image.data}')">
                <div class="image-overlay">
                    <button class="btn btn-sm btn-danger" onclick="removeImage(this, 'edit-pickdrop')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(imageItem);
        });
    }
    
    // Store images for the edit context
    if (!window.deviceImages) window.deviceImages = {};
    window.deviceImages['edit-pickdrop'] = images || [];
}

function setupEditPickDropCustomerAutocomplete() {
    const customerInput = document.getElementById('edit-pickdrop-customer');
    const suggestionsContainer = document.getElementById('edit-pickdrop-customer-suggestions');
    
    if (customerInput && suggestionsContainer) {
        customerInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredCustomers = customers.filter(customer => 
                customer.name.toLowerCase().includes(searchTerm)
            );
            showCustomerSuggestions(filteredCustomers, 'edit-pickdrop-customer');
        });
        
        customerInput.addEventListener('blur', function() {
            setTimeout(() => {
                hideCustomerSuggestions('edit-pickdrop-customer');
            }, 200);
        });
    }
}

// Delivery Management

// Load delivery data
function loadDeliveryData() {
    // This function is now handled in loadData()
}

// Save delivery data
function saveDeliveryData() {
    localStorage.setItem('deliveries', JSON.stringify(deliveries));
}

// Get default deliveries
function getDefaultDeliveries() {
    return [];
}

// Delivery functions
function handleAddDelivery(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('delivery-customer').value;
    const repairId = document.getElementById('delivery-repair-id').value;
    
    // Find customer details from customers array
    const selectedCustomer = customers.find(c => c.name === customerName);
    const selectedRepair = repairs.find(r => r.id === parseInt(repairId));
    
    const deliveryData = {
        customer: customerName,
        customerPhone: selectedCustomer ? selectedCustomer.phone : '',
        customerEmail: selectedCustomer ? selectedCustomer.email : '',
        customerAddress: selectedCustomer ? selectedCustomer.address : '',
        repairId: parseInt(repairId),
        deviceType: selectedRepair ? selectedRepair.deviceType : '',
        brand: selectedRepair ? selectedRepair.brand : '',
        model: selectedRepair ? selectedRepair.model : '',
        serial: selectedRepair ? selectedRepair.serial : '',
        deliveryAddress: document.getElementById('delivery-address').value,
        scheduledDate: document.getElementById('delivery-scheduled-date').value,
        scheduledTime: document.getElementById('delivery-scheduled-time').value,
        deliveryAgent: document.getElementById('delivery-agent').value,
        deliveryAgentPhone: document.getElementById('delivery-agent-phone').value,
        status: document.getElementById('delivery-status').value,
        fee: parseFloat(document.getElementById('delivery-fee').value) || 0,
        instructions: document.getElementById('delivery-instructions').value,
        notes: document.getElementById('delivery-notes').value,
        scheduledTime: new Date().toISOString(),
        outForDeliveryTime: null,
        deliveredTime: null,
        failedTime: null
    };
    
    const newDelivery = {
        id: deliveries.length > 0 ? Math.max(...deliveries.map(d => d.id)) + 1 : 1,
        ...deliveryData,
        createdAt: new Date().toISOString()
    };
    
    deliveries.push(newDelivery);
    saveDeliveryData();
    renderDeliveries();
    closeModal('add-delivery-modal');
    e.target.reset();
    
    alert('Delivery created successfully!');
}

function renderDeliveries() {
    const tbody = document.getElementById('delivery-tbody');
    tbody.innerHTML = '';
    
    deliveries.forEach(delivery => {
        const statusClass = `status-${delivery.status}`;
        const repair = repairs.find(r => r.id === delivery.repairId);
        
        const row = `
            <tr>
                <td>DL-${delivery.id.toString().padStart(4, '0')}</td>
                <td>${delivery.customer}</td>
                <td>${delivery.deviceType} ${delivery.brand} ${delivery.model}</td>
                <td>${repair ? `JC-${repair.id.toString().padStart(4, '0')}` : 'N/A'}</td>
                <td>${delivery.deliveryAddress.substring(0, 50)}${delivery.deliveryAddress.length > 50 ? '...' : ''}</td>
                <td>${delivery.scheduledDate} ${delivery.scheduledTime}</td>
                <td><span class="status-badge ${statusClass}">${delivery.status}</span></td>
                <td>${delivery.deliveryAgent}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewDelivery(${delivery.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updateDeliveryStatus(${delivery.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDelivery(${delivery.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function viewDelivery(id) {
    const delivery = deliveries.find(d => d.id === id);
    if (delivery) {
        // Hide table and show delivery detail view
        document.getElementById('delivery-table-container').style.display = 'none';
        document.getElementById('delivery-detail-view').style.display = 'block';
        
        // Populate delivery details
        document.getElementById('delivery-service-id').textContent = `DL-${delivery.id.toString().padStart(4, '0')}`;
        document.getElementById('delivery-date').textContent = delivery.scheduledDate;
        document.getElementById('delivery-status-select').value = delivery.status;
        
        // Populate customer details
        document.getElementById('delivery-customer-name').textContent = delivery.customer;
        document.getElementById('delivery-customer-phone').textContent = delivery.customerPhone || 'Customer Phone';
        document.getElementById('delivery-customer-email').textContent = delivery.customerEmail || 'customer@email.com';
        document.getElementById('delivery-customer-address').textContent = delivery.customerAddress || 'Customer Address';
        
        // Populate device details
        document.getElementById('delivery-device-type').textContent = delivery.deviceType;
        document.getElementById('delivery-device-brand').textContent = delivery.brand || 'N/A';
        document.getElementById('delivery-device-model').textContent = delivery.model || 'N/A';
        document.getElementById('delivery-device-serial').textContent = delivery.serial || 'N/A';
        
        const repair = repairs.find(r => r.id === delivery.repairId);
        document.getElementById('delivery-repair-id').textContent = repair ? `JC-${repair.id.toString().padStart(4, '0')}` : 'N/A';
        
        // Populate delivery details
        document.getElementById('delivery-address').textContent = delivery.deliveryAddress;
        document.getElementById('delivery-scheduled-date').textContent = delivery.scheduledDate;
        document.getElementById('delivery-scheduled-time').textContent = delivery.scheduledTime;
        document.getElementById('delivery-agent').textContent = delivery.deliveryAgent;
        document.getElementById('delivery-agent-phone').textContent = delivery.deliveryAgentPhone;
        
        // Update delivery timeline
        updateDeliveryTimeline(delivery);
        
        // Store current delivery ID for actions
        window.currentDeliveryId = id;
    }
}

function backToDeliveryList() {
    document.getElementById('delivery-detail-view').style.display = 'none';
    document.getElementById('delivery-table-container').style.display = 'block';
    window.currentDeliveryId = null;
}

function updateDeliveryStatusFromDetail() {
    if (window.currentDeliveryId) {
        const newStatus = document.getElementById('delivery-status-select').value;
        updateDeliveryStatus(window.currentDeliveryId, newStatus);
    }
}

function updateDeliveryStatus(id, newStatus) {
    const delivery = deliveries.find(d => d.id === id);
    if (delivery) {
        delivery.status = newStatus;
        
        // Update timestamps based on status
        const currentTime = new Date().toISOString();
        switch (newStatus) {
            case 'out-for-delivery':
                delivery.outForDeliveryTime = currentTime;
                break;
            case 'delivered':
                delivery.deliveredTime = currentTime;
                break;
            case 'failed':
                delivery.failedTime = currentTime;
                break;
        }
        
        saveDeliveryData();
        renderDeliveries();
        
        // Update detail view if currently viewing
        if (window.currentDeliveryId === id) {
            viewDelivery(id);
        }
    }
}

function updateDeliveryTimeline(delivery) {
    const timeline = document.getElementById('delivery-timeline');
    const steps = timeline.querySelectorAll('.delivery-step');
    
    // Reset all steps
    steps.forEach(step => {
        step.classList.remove('completed', 'active');
    });
    
    // Update steps based on status
    switch (delivery.status) {
        case 'scheduled':
            steps[0].classList.add('completed');
            break;
        case 'out-for-delivery':
            steps[0].classList.add('completed');
            steps[1].classList.add('active');
            break;
        case 'delivered':
            steps.forEach(step => step.classList.add('completed'));
            break;
    }
    
    // Update timestamps
    if (delivery.scheduledTime) {
        document.getElementById('delivery-scheduled-time').textContent = new Date(delivery.scheduledTime).toLocaleString();
    }
    if (delivery.outForDeliveryTime) {
        document.getElementById('delivery-out-time').textContent = new Date(delivery.outForDeliveryTime).toLocaleString();
    }
    if (delivery.deliveredTime) {
        document.getElementById('delivery-completed-time').textContent = new Date(delivery.deliveredTime).toLocaleString();
    }
}

function markOutForDelivery() {
    if (window.currentDeliveryId) {
        updateDeliveryStatus(window.currentDeliveryId, 'out-for-delivery');
        alert('Delivery marked as out for delivery!');
    }
}

function markDelivered() {
    if (window.currentDeliveryId) {
        updateDeliveryStatus(window.currentDeliveryId, 'delivered');
        alert('Delivery marked as completed!');
    }
}

function markFailed() {
    if (window.currentDeliveryId) {
        updateDeliveryStatus(window.currentDeliveryId, 'failed');
        alert('Delivery marked as failed!');
    }
}

function addDeliveryNote() {
    if (window.currentDeliveryId) {
        const note = prompt('Enter note for this delivery:');
        if (note !== null) {
            const deliveryIndex = deliveries.findIndex(d => d.id === window.currentDeliveryId);
            if (deliveryIndex !== -1) {
                deliveries[deliveryIndex].notes = note;
                saveDeliveryData();
                alert('Note added successfully!');
            }
        }
    }
}

function editDelivery() {
    if (window.currentDeliveryId) {
        alert('Edit functionality will be implemented in the next update.');
    }
}

function printDelivery() {
    if (window.currentDeliveryId) {
        alert('Print functionality will be implemented in the next update.');
    }
}

function deleteDelivery(id) {
    if (confirm('Are you sure you want to delete this delivery?')) {
        deliveries = deliveries.filter(d => d.id !== id);
        saveDeliveryData();
        renderDeliveries();
    }
}

function populateDeliveryRepairOptions() {
    const repairSelect = document.getElementById('delivery-repair-id');
    repairSelect.innerHTML = '<option value="">Select Repair</option>';
    
    // Only show completed repairs
    const completedRepairs = repairs.filter(r => r.status === 'completed' || r.status === 'delivered');
    
    completedRepairs.forEach(repair => {
        const option = document.createElement('option');
        option.value = repair.id;
        option.textContent = `JC-${repair.id.toString().padStart(4, '0')} - ${repair.customer} - ${repair.deviceType}`;
        repairSelect.appendChild(option);
    });
}

function populateDeliveryDeviceInfo() {
    const repairId = document.getElementById('delivery-repair-id').value;
    if (repairId) {
        const repair = repairs.find(r => r.id === parseInt(repairId));
        if (repair) {
            document.getElementById('delivery-device-type').value = repair.deviceType || '';
            document.getElementById('delivery-device-brand').value = repair.brand || '';
            document.getElementById('delivery-device-model').value = repair.model || '';
            document.getElementById('delivery-device-serial').value = repair.serial || '';
        }
    }
}

function populateDeliveryForm(customer) {
    document.getElementById('delivery-address').value = customer.address || '';
}

function filterDeliveries() {
    const searchTerm = document.getElementById('search-delivery').value.toLowerCase();
    const statusFilter = document.getElementById('delivery-status-filter').value;
    const customerFilter = document.getElementById('delivery-customer-filter').value;
    
    let filteredItems = deliveries.filter(item => {
        const matchesSearch = item.customer.toLowerCase().includes(searchTerm) ||
                            item.deviceType.toLowerCase().includes(searchTerm) ||
                            `DL-${item.id.toString().padStart(4, '0')}`.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const matchesCustomer = !customerFilter || item.customer === customerFilter;
        
        return matchesSearch && matchesStatus && matchesCustomer;
    });
    
    renderFilteredDeliveries(filteredItems);
}

function renderFilteredDeliveries(filteredItems) {
    const tbody = document.getElementById('delivery-tbody');
    tbody.innerHTML = '';
    
    filteredItems.forEach(delivery => {
        const statusClass = `status-${delivery.status}`;
        const repair = repairs.find(r => r.id === delivery.repairId);
        
        const row = `
            <tr>
                <td>DL-${delivery.id.toString().padStart(4, '0')}</td>
                <td>${delivery.customer}</td>
                <td>${delivery.deviceType} ${delivery.brand} ${delivery.model}</td>
                <td>${repair ? `JC-${repair.id.toString().padStart(4, '0')}` : 'N/A'}</td>
                <td>${delivery.deliveryAddress.substring(0, 50)}${delivery.deliveryAddress.length > 50 ? '...' : ''}</td>
                <td>${delivery.scheduledDate} ${delivery.scheduledTime}</td>
                <td><span class="status-badge ${statusClass}">${delivery.status}</span></td>
                <td>${delivery.deliveryAgent}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewDelivery(${delivery.id})">View</button>
                    <button class="btn btn-sm btn-primary" onclick="updateDeliveryStatus(${delivery.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDelivery(${delivery.id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ... existing code ...