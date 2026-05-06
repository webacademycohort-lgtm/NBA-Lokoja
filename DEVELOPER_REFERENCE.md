# NBA Lokoja - Developer Quick Reference

## Quick Start

### Development Server

```bash
# Simple HTTP server (Python)
python -m http.server 8000

# Or with Node.js
npx http-server
```

Then visit `http://localhost:8000`

## Project Structure

```
nba-lokoja/
├── index.html              # Homepage
├── css/
│   ├── style.css          # Main styles & animations
│   └── portal.css         # Portal-specific styles
├── js/
│   ├── main.js            # Core functionality & animations
│   ├── supabase.js        # Backend integration
│   ├── partials.js        # Header/footer injection
│   ├── admin-shared.js    # Admin utilities
│   └── portal-shared.js   # Portal utilities
├── pages/                 # Public pages
├── portal/                # Member portal
├── admin/                 # Admin dashboard
├── supabase/              # Database schema
├── assets/                # Images & logos
├── SUPABASE_SETUP_GUIDE.md  # Backend setup
└── DEPLOYMENT_GUIDE.md      # This project info
```

## CSS Architecture

### Color Variables

```css
:root {
  --navy: #0b5d3b; /* Primary */
  --navy-dark: #06442a; /* Dark */
  --navy-light: #127d51; /* Light */
  --gold: #c9a227; /* Accent */
  --white: #ffffff; /* Light */
  --charcoal: #2a2f3a; /* Dark text */
}
```

### Common Classes

```css
.btn-primary          /* Gold button */
.btn-secondary        /* Navy button */
.fade-in              /* Animation trigger */
.section              /* Content section */
.container            /* Max-width wrapper */
.grid-2/3/4           /* Responsive grid */
.text-center          /* Text alignment */
.mt-2/4, mb-2/4       /* Margin utilities */
```

## JavaScript Functions

### Authentication

```javascript
// Sign up
await NBAAuth.signUp({
  email: "user@example.com",
  password: "password",
  fullName: "Full Name",
  phone: "+234 800 000 0000",
  scn: "SCN/2025/00001",
});

// Sign in
await NBAAuth.signIn("user@example.com", "password");

// Sign out
await NBAAuth.signOut();

// Check session
const { data, error } = await NBAAuth.getSession();
```

### Database Queries

```javascript
// Get member profile
const { data: member } = await NBADB.getMember(userId);

// List all members
const { data: members } = await NBADB.listMembers({ status: "active" });

// Get events
const { data: events } = await NBADB.listEvents();

// Get news
const { data: news } = await NBADB.listNews();
```

### Storage

```javascript
// Upload file
const { data } = await NBAStorage.uploadDocument(
  file,
  "documents/bulletin.pdf",
);

// Get public URL
const {
  data: { publicUrl },
} = await NBAStorage.getPublicUrl("documents/bulletin.pdf");
```

## Common Tasks

### Add a New Page

1. Create `pages/new-page.html`
2. Include header: `<div data-include="header"></div>`
3. Include footer: `<div data-include="footer"></div>`
4. Add to navigation in `js/partials.js`
5. Include scripts at bottom:
   ```html
   <script src="../js/main.js"></script>
   <script src="../js/partials.js"></script>
   ```

### Add Animation

1. Add class `fade-in` to element
2. Or create custom animation in CSS:
   ```css
   @keyframes myAnimation {
     from {
       opacity: 0;
     }
     to {
       opacity: 1;
     }
   }
   .my-element {
     animation: myAnimation 0.6s ease;
   }
   ```

### Add a Button

```html
<a href="page.html" class="btn btn-primary btn-lg">
  Button Text
  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
</a>
```

### Add a Card

```html
<div class="card fade-in">
  <div class="card-icon">
    <i class="fa-solid fa-icon-name" aria-hidden="true"></i>
  </div>
  <h3>Card Title</h3>
  <p>Card content</p>
  <a href="#" class="card-link"
    >Read more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
  ></a>
</div>
```

### Add Form Validation

```html
<form data-validate>
  <input type="email" required />
  <input type="password" required />
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

## Supabase Integration

### Configuration

```javascript
// In js/supabase.js or env:
SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "your-public-anon-key",
};
```

### Check Connection

```javascript
// In browser console:
console.log(window.NBA_SUPABASE_READY); // true if connected

// Test API:
await NBAAuth.getSession();
```

## Front-end Icons (Font Awesome)

Common icons used:

```html
<!-- Navigation -->
<i class="fa-solid fa-arrow-right"></i>
<i class="fa-solid fa-chevron-down"></i>

<!-- Contact -->
<i class="fa-solid fa-phone"></i>
<i class="fa-solid fa-envelope"></i>
<i class="fa-solid fa-location-dot"></i>

<!-- Features -->
<i class="fa-solid fa-scale-balanced"></i>
<i class="fa-solid fa-graduation-cap"></i>
<i class="fa-solid fa-handshake"></i>

<!-- Actions -->
<i class="fa-solid fa-download"></i>
<i class="fa-solid fa-edit"></i>
<i class="fa-solid fa-trash"></i>

<!-- Status -->
<i class="fa-solid fa-check-circle"></i>
<i class="fa-solid fa-exclamation-circle"></i>
<i class="fa-solid fa-spinner"></i>
```

## Responsive Breakpoints

```css
/* Mobile: < 480px */
/* Tablet: 480px - 860px */
/* Desktop: > 860px */

/* Breakpoint in CSS: */
@media (max-width: 860px) {
  /* Mobile styles */
}
```

## Performance Tips

1. Use Font Awesome icons (CDN-hosted)
2. Optimize images before uploading
3. Avoid inline styles - use CSS classes
4. Lazy load off-screen images
5. Minimize blocking scripts
6. Use `will-change` for animated elements
7. Defer non-critical scripts

## Debugging

### Console Checks

```javascript
// Check if Supabase is ready
console.log("Supabase Ready:", window.NBA_SUPABASE_READY);

// Check current session
await NBAAuth.getSession().then((r) => console.log(r));

// Check if using mock data
console.log("Mock data:", mockData);
```

### Common Issues

| Issue                     | Solution                                     |
| ------------------------- | -------------------------------------------- |
| Supabase not initializing | Check credentials in supabase.js             |
| Links broken              | Verify relative paths from page location     |
| Icons not showing         | Ensure Font Awesome CDN is loaded            |
| Animations jerky          | Check browser performance, reduce complexity |
| Form not validating       | Verify `data-validate` attribute             |
| Mobile menu stuck         | Clear cache, check z-index conflicts         |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/animation-updates

# Make changes, then commit
git add .
git commit -m "feat: add animation enhancements"

# Push and create PR
git push origin feature/animation-updates
```

## Deployment Checklist

- [ ] All links working
- [ ] Supabase credentials set
- [ ] No console errors
- [ ] Forms validated
- [ ] Mobile responsive
- [ ] Performance tested
- [ ] Security reviewed
- [ ] Backup created

## Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Font Awesome Icons](https://fontawesome.com/icons)
- [CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## Environment Variables

```bash
# .env or .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

---

**Last Updated:** April 30, 2026
**Status:** Production Ready ✅
