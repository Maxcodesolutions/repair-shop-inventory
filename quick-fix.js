// Quick Navigation Fix
// This script provides a simple, direct way to handle navigation

console.log('Loading quick navigation fix...');

// Global function to handle navigation directly
window.navigateToSection = function(sectionName) {
    console.log('navigateToSection called with:', sectionName);
    
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
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    sectionElement.classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    navLink.classList.add('active');
    
    // Update page title
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
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Dashboard';
    }
    
    // Save the current section to localStorage
    localStorage.setItem('lastActiveSection', sectionName);
    console.log('Saved active section:', sectionName);
    
    // Re-render data for specific sections to ensure fresh data
    if (typeof renderQuotations === 'function' && sectionName === 'quotations') {
        console.log('Re-rendering quotations data...');
        renderQuotations();
    } else if (typeof renderInventory === 'function' && sectionName === 'inventory') {
        renderInventory();
    } else if (typeof renderCustomers === 'function' && sectionName === 'customers') {
        renderCustomers();
    } else if (typeof renderRepairs === 'function' && sectionName === 'repairs') {
        renderRepairs();
    } else if (typeof renderInvoices === 'function' && sectionName === 'invoices') {
        renderInvoices();
    } else if (typeof renderPickDrops === 'function' && sectionName === 'pickdrop') {
        renderPickDrops();
    } else if (typeof renderDeliveries === 'function' && sectionName === 'delivery') {
        renderDeliveries();
    } else if (typeof renderPayments === 'function' && sectionName === 'payments') {
        renderPayments();
    }
    
    console.log('Section display completed for:', sectionName);
};

// Function to setup navigation with direct onclick handlers
function setupDirectNavigation() {
    console.log('Setting up direct navigation...');
    
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('Found nav links:', navLinks.length);
    
    navLinks.forEach((link, index) => {
        const section = link.getAttribute('data-section');
        console.log(`Setting up nav link ${index + 1}: ${link.textContent.trim()} -> ${section}`);
        
        // Remove any existing event listeners by cloning
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        // Add direct onclick handler
        newLink.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const clickedSection = this.getAttribute('data-section');
            console.log('Nav link clicked:', clickedSection);
            
            if (clickedSection) {
                navigateToSection(clickedSection);
            } else {
                console.error('No data-section attribute found on nav link');
            }
        };
    });
    
    console.log('Direct navigation setup completed');
}

// Function to test navigation
function testNavigation(sectionName) {
    console.log('Testing navigation to:', sectionName);
    if (typeof navigateToSection === 'function') {
        navigateToSection(sectionName);
    } else {
        console.error('navigateToSection function not available');
    }
}

// Function to check navigation elements
function checkNavigationElements() {
    console.log('=== NAVIGATION ELEMENTS CHECK ===');
    
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('Navigation links found:', navLinks.length);
    
    navLinks.forEach((link, index) => {
        const section = link.getAttribute('data-section');
        const text = link.textContent.trim();
        console.log(`${index + 1}. "${text}" -> ${section || 'NO SECTION'}`);
    });
    
    const sections = document.querySelectorAll('.content-section');
    console.log('Content sections found:', sections.length);
    
    sections.forEach((section, index) => {
        console.log(`${index + 1}. Section ID: ${section.id}, Active: ${section.classList.contains('active')}`);
    });
    
    console.log('=== END NAVIGATION CHECK ===');
}

// Auto-setup when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDirectNavigation);
} else {
    setupDirectNavigation();
}

console.log('Quick navigation fix loaded successfully');



