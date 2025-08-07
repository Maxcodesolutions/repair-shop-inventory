# Alternative Backend Solutions for Server-Side Data Storage

If Firebase seems too complex, here are simpler alternatives for server-side data storage:

## 🚀 Option 1: JSON Server (Easiest)

### Setup:
```bash
npm install -g json-server
json-server --watch db.json --port 3000
```

### Create `db.json`:
```json
{
  "users": [],
  "inventory": [],
  "customers": [],
  "repairs": [],
  "invoices": [],
  "payments": []
}
```

### Update `script.js` to use REST API:
```javascript
// Replace localStorage with API calls
async function loadData() {
    try {
        const response = await fetch('http://localhost:3000/users');
        users = await response.json();
        // ... load other data
    } catch (error) {
        console.error('API error:', error);
        // Fallback to localStorage
    }
}

async function saveData() {
    try {
        await fetch('http://localhost:3000/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(users)
        });
    } catch (error) {
        console.error('Save error:', error);
    }
}
```

## 🌐 Option 2: Supabase (PostgreSQL Backend)

### Setup:
1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Get API keys

### Database Schema:
```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  category VARCHAR,
  quantity INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Repairs table
CREATE TABLE repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR NOT NULL,
  device_type VARCHAR,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔥 Option 3: PocketBase (Self-Hosted)

### Setup:
1. Download from [pocketbase.io](https://pocketbase.io)
2. Run: `./pocketbase serve`
3. Access admin at `http://127.0.0.1:8090/_/`

### Features:
- ✅ Built-in admin panel
- ✅ Real-time subscriptions
- ✅ File uploads
- ✅ User authentication
- ✅ REST API
- ✅ SQLite database

## 📊 Option 4: Airtable (No-Code)

### Setup:
1. Go to [airtable.com](https://airtable.com)
2. Create free account
3. Create base with tables:
   - Users
   - Inventory
   - Customers
   - Repairs
   - Invoices

### API Integration:
```javascript
const AIRTABLE_API_KEY = 'your_api_key';
const BASE_ID = 'your_base_id';

async function loadFromAirtable() {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Users`, {
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
    });
    const data = await response.json();
    return data.records;
}
```

## 🎯 Option 5: Google Sheets API

### Setup:
1. Create Google Sheet
2. Enable Google Sheets API
3. Get API credentials
4. Share sheet publicly

### Integration:
```javascript
const SHEET_ID = 'your_sheet_id';
const API_KEY = 'your_api_key';

async function loadFromSheets() {
    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Users!A:Z?key=${API_KEY}`
    );
    const data = await response.json();
    return data.values;
}
```

## 💰 Cost Comparison

| Service | Free Tier | Paid Plans | Ease of Setup |
|---------|-----------|------------|----------------|
| **Firebase** | $0/month | $25+/month | ⭐⭐⭐⭐⭐ |
| **Supabase** | $0/month | $25+/month | ⭐⭐⭐⭐ |
| **JSON Server** | $0/month | Self-hosted | ⭐⭐⭐⭐⭐ |
| **PocketBase** | $0/month | Self-hosted | ⭐⭐⭐ |
| **Airtable** | $0/month | $12+/month | ⭐⭐⭐⭐ |
| **Google Sheets** | $0/month | $6+/month | ⭐⭐⭐ |

## 🚀 Quick Start Recommendation

### For Beginners: JSON Server
```bash
# Install
npm install -g json-server

# Create database file
echo '{"users":[],"inventory":[],"customers":[],"repairs":[]}' > db.json

# Start server
json-server --watch db.json --port 3000

# Access API
curl http://localhost:3000/users
```

### For Production: Supabase
- Free PostgreSQL database
- Built-in authentication
- Real-time subscriptions
- Easy deployment

## 🔧 Migration Guide

### From localStorage to Server:

1. **Backup current data**:
```javascript
// Export current data
const exportData = {
    users: JSON.parse(localStorage.getItem('users')),
    inventory: JSON.parse(localStorage.getItem('inventory')),
    // ... other data
};
console.log(JSON.stringify(exportData));
```

2. **Import to server**:
```javascript
// Import to your chosen backend
fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exportData)
});
```

3. **Update app to use server**:
```javascript
// Replace localStorage calls with API calls
// localStorage.setItem() → fetch('/api/endpoint', {method: 'POST'})
// localStorage.getItem() → fetch('/api/endpoint')
```

## 📱 Mobile App Integration

All these solutions support mobile apps:

- **Firebase**: Native SDKs for iOS/Android
- **Supabase**: REST API + real-time
- **PocketBase**: REST API
- **Airtable**: REST API
- **Google Sheets**: REST API

## 🔒 Security Considerations

1. **API Keys**: Never expose in client-side code
2. **CORS**: Configure properly for web apps
3. **Authentication**: Implement user sessions
4. **Rate Limiting**: Prevent abuse
5. **Data Validation**: Sanitize inputs

---

**Choose based on your needs:**
- **Simple demo**: JSON Server
- **Production app**: Supabase or Firebase
- **Self-hosted**: PocketBase
- **No-code**: Airtable
- **Spreadsheet-based**: Google Sheets 