# Repair Shop Inventory Management System

A comprehensive web-based inventory and business management system designed specifically for repair shops. This application helps manage inventory, customers, repairs, invoices, payments, and more.

## Features

### 🔧 Core Modules
- **Dashboard**: Overview with key metrics and charts
- **Inventory Management**: Track parts, tools, and supplies
- **Customer Management**: Store customer information and history
- **Repair Management**: Job cards, status tracking, and progress updates
- **Invoice Management**: Generate and manage invoices
- **Payment Management**: Track payments and integrate with invoices
- **Pick & Drop Service**: Manage pickup and delivery services
- **Delivery Management**: Track delivery status and timelines
- **Quotation Management**: Create and manage quotations
- **Vendor Management**: Track suppliers and purchases
- **User Management**: Role-based access control
- **Reports & Analytics**: Business insights and data visualization

### 🚀 Key Features
- **Real-time Data**: All data is stored locally and updates instantly
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **User Authentication**: Secure login with role-based permissions
- **Data Visualization**: Charts and graphs for business insights
- **Print Functionality**: Print invoices, job cards, and quotations
- **Image Capture**: Capture device images for repair tracking
- **OTP System**: Secure pickup and delivery verification

## Quick Start

### Local Development
1. Clone or download the project files
2. Open `index.html` in a web browser
3. Or run a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser

### Default Login
- **Username**: `admin`
- **Password**: `admin`

## Installation & Deployment

### Option 1: GitHub Pages (Recommended for Free Hosting)
1. Create a GitHub account at [github.com](https://github.com)
2. Create a new repository
3. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
4. Go to repository Settings → Pages
5. Select "Deploy from a branch" and choose "main"
6. Your site will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

### Option 2: Netlify (Free Hosting)
1. Go to [netlify.com](https://netlify.com)
2. Sign up and click "New site from Git"
3. Connect your GitHub repository
4. Deploy automatically

### Option 3: Vercel (Free Hosting)
1. Go to [vercel.com](https://vercel.com)
2. Sign up and import your GitHub repository
3. Deploy automatically

### Option 4: Traditional Web Hosting
1. Upload all files to your web hosting provider
2. Ensure the web server supports static files
3. Access via your domain name

## File Structure
```
repair-shop-inventory/
├── index.html          # Main application file
├── script.js           # JavaScript logic and functionality
├── styles.css          # CSS styling
└── README.md          # This file
```

## Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Data Storage
- All data is stored locally in the browser using `localStorage`
- No external database required
- Data persists between browser sessions
- Export/import functionality available

## Security Features
- User authentication and authorization
- Role-based access control
- Secure password storage
- Session management

## Support
For issues or questions:
1. Check the browser console for error messages
2. Ensure JavaScript is enabled
3. Try clearing browser cache and localStorage
4. Contact the development team

## License
This project is open source and available under the MIT License.

---
**Version**: 1.0.0  
**Last Updated**: August 2025 