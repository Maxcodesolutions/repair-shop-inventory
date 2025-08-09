# 🌐 Custom Domain Setup Guide

## Quick Domain Setup for Your Repair Shop Inventory System

### Step 1: Purchase a Domain

**Recommended Domain Registrars:**
- [Namecheap](https://namecheap.com) - Good prices, free privacy
- [GoDaddy](https://godaddy.com) - Popular, good support
- [Google Domains](https://domains.google) - Clean interface
- [Cloudflare](https://cloudflare.com) - Free privacy, good security

**Suggested Domain Names:**
- `repairmaniac.com`
- `repairshop.in`
- `repairinventory.com`
- `repairmanager.com`
- `repairtracker.com`

### Step 2: Deploy Your Application

Choose one of these free hosting options:

#### Option A: Netlify (Recommended)
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your repository
5. Deploy settings:
   - Build command: (leave empty)
   - Publish directory: `.`
6. Your site will be live at `https://your-site-name.netlify.app`

#### Option B: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Your site will be live at `https://your-project-name.vercel.app`

### Step 3: Connect Your Domain

#### For Netlify:
1. In Netlify dashboard → Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `repairmaniac.com`)
4. Netlify will provide DNS records

#### For Vercel:
1. In Vercel dashboard → Project settings → Domains
2. Add your domain
3. Vercel will provide DNS records

### Step 4: Configure DNS Records

Go to your domain registrar's DNS settings and add:

#### For Netlify:
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site-name.netlify.app
```

#### For Vercel:
```
Type: A
Name: @
Value: 76.76.19.36

Type: CNAME
Name: www
Value: your-project-name.vercel.app
```

### Step 5: Wait for Propagation

DNS changes can take up to 48 hours to propagate globally, but usually work within 1-2 hours.

### Step 6: Test Your Site

1. Visit your domain (e.g., `https://repairmaniac.com`)
2. Test all functionality
3. Check mobile responsiveness
4. Verify SSL certificate is working

## 🔧 Advanced Configuration

### SSL Certificate
Most hosting platforms provide free SSL certificates automatically.

### Email Setup (Optional)
If you want email at your domain:
- [Google Workspace](https://workspace.google.com) - $6/month
- [Zoho Mail](https://zoho.com/mail) - Free tier available
- [ProtonMail](https://protonmail.com) - Privacy-focused

### Subdomain Setup
You can create subdomains like:
- `app.repairmaniac.com` - Main application
- `admin.repairmaniac.com` - Admin panel
- `api.repairmaniac.com` - API endpoints

## 📊 Analytics Setup

### Google Analytics
Add to your HTML head section:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain
3. Verify ownership
4. Submit sitemap

## 🚀 Performance Tips

### Enable Caching
Add to your hosting configuration:
```
Cache-Control: public, max-age=31536000
```

### Image Optimization
- Use WebP format
- Implement lazy loading
- Compress images

### CDN Setup
Consider using:
- Cloudflare (free)
- AWS CloudFront
- Netlify CDN (included)

## 🔒 Security Checklist

- [ ] SSL certificate enabled
- [ ] HTTPS redirect configured
- [ ] Security headers set
- [ ] Regular backups scheduled
- [ ] Monitoring configured
- [ ] Error tracking enabled

## 📞 Support

### Common Issues:
1. **DNS not working**: Wait 24-48 hours for propagation
2. **SSL errors**: Check hosting platform's SSL settings
3. **404 errors**: Verify routing configuration
4. **Performance issues**: Check image optimization and caching

### Getting Help:
- Hosting platform documentation
- Domain registrar support
- Browser developer tools for debugging

---

**Your repair shop inventory system will be live at your custom domain! 🎉**



