# Repair Shop Inventory Management System

A comprehensive web-based inventory management system designed specifically for laptop and mobile repair shops. This system provides complete inventory tracking, purchase management, vendor management, and repair order tracking.

## Features

### 🏠 Dashboard
- **Real-time Statistics**: Total items, low stock alerts, pending orders, and active repairs
- **Quick Actions**: Easy access to add items, create purchases, add vendors, and new repairs
- **Activity Tracking**: Recent system activities and updates

### 📦 Inventory Management
- **Item Tracking**: Complete inventory with SKU, quantity, pricing, and categories
- **Stock Levels**: Automatic status tracking (In Stock, Low Stock, Out of Stock)
- **Categories**: Organized by laptop parts, mobile parts, tools, and accessories
- **Search & Filter**: Find items quickly by name, SKU, category, or stock level

### 🛒 Purchase Management
- **Purchase Orders**: Create and track purchase orders from vendors
- **Multi-item Orders**: Add multiple items to a single purchase order
- **Vendor Integration**: Link purchases to specific vendors
- **Status Tracking**: Track order status (pending, completed)

### 👥 Vendor Management
- **Vendor Profiles**: Complete vendor information with contact details
- **Card-based Layout**: Easy-to-scan vendor information
- **Contact Integration**: Direct access to vendor contact information

### 🔧 Repair Management
- **Repair Orders**: Create and track repair jobs
- **Customer Information**: Track customer details and device information
- **Status Updates**: Update repair status (in-progress, completed)
- **Time Estimates**: Track estimated completion times

### 📊 Reports & Analytics
- **Inventory Value**: Total inventory value and average item pricing
- **Purchase Summary**: Total purchases and spending analytics
- **Repair Summary**: Active repairs and completion statistics

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with Flexbox and Grid
- **Icons**: Font Awesome 6.0
- **Fonts**: Inter (Google Fonts)
- **Storage**: Local Storage for data persistence
- **Responsive**: Mobile-first responsive design

## File Structure

```
repair-shop-inventory/
├── index.html          # Main application file
├── styles.css          # Modern CSS styling
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Getting Started

1. **Download/Clone** the project files
2. **Open** `index.html` in any modern web browser
3. **Start Using** the system immediately

No installation or setup required - the system runs entirely in the browser!

## Usage Guide

### Adding Inventory Items
1. Navigate to **Inventory** section
2. Click **"Add Item"** button
3. Fill in item details (name, category, SKU, quantity, price)
4. Click **"Add Item"** to save

### Creating Purchase Orders
1. Navigate to **Purchases** section
2. Click **"New Purchase"** button
3. Select vendor and date
4. Add items with quantities and prices
5. Click **"Create Purchase"** to save

### Managing Vendors
1. Navigate to **Vendors** section
2. Click **"Add Vendor"** button
3. Fill in vendor details (name, email, phone, address)
4. Click **"Add Vendor"** to save

### Creating Repair Orders
1. Navigate to **Repairs** section
2. Click **"New Repair"** button
3. Enter customer and device information
4. Set estimated completion time
5. Click **"Create Repair"** to save

## Data Persistence

The system uses **localStorage** to save all data locally in your browser. This means:
- ✅ No server required
- ✅ Data persists between sessions
- ✅ Works offline
- ✅ Private to your device

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Features in Detail

### Inventory Categories
- **Laptop Parts**: Batteries, screens, keyboards, motherboards
- **Mobile Parts**: Phone screens, batteries, charging ports
- **Tools**: Screwdrivers, pry tools, soldering equipment
- **Accessories**: Chargers, cables, cases, screen protectors

### Stock Level Indicators
- **In Stock**: 5+ items available
- **Low Stock**: 1-4 items remaining
- **Out of Stock**: 0 items available

### Purchase Order Features
- Multiple items per order
- Individual item pricing
- Total order calculation
- Vendor selection
- Date tracking

### Repair Order Features
- Customer information
- Device type specification
- Issue description
- Estimated completion time
- Status tracking

## Customization

The system is designed to be easily customizable:

### Adding New Categories
Edit the category options in `index.html` and `script.js`

### Modifying Stock Thresholds
Change the low stock threshold in `script.js` (currently set to 5)

### Adding New Status Types
Add new status badges in `styles.css` and update the logic in `script.js`

## Security & Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- No personal information is collected
- Complete privacy and control over your data

## Support & Maintenance

### Regular Tasks
- **Backup Data**: Export data periodically (localStorage can be cleared)
- **Update Inventory**: Keep stock levels current
- **Review Reports**: Monitor spending and repair statistics

### Troubleshooting
- **Clear Browser Data**: If issues occur, clear localStorage
- **Check Browser Console**: For any JavaScript errors
- **Refresh Page**: If the interface becomes unresponsive

## Future Enhancements

Potential features for future versions:
- Export data to CSV/Excel
- Barcode scanning integration
- Customer database
- Invoice generation
- Email notifications
- Cloud backup options
- Multi-user support

## License

This project is open source and available for personal and commercial use.

---

**Built with ❤️ for repair shop owners and technicians**

*Simplify your inventory management and focus on what you do best - fixing devices!* 