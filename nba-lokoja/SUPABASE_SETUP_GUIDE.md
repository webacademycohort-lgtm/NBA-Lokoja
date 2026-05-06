# NBA Lokoja - Supabase Backend Setup Guide

## Overview

This document provides step-by-step instructions for setting up the Supabase backend for the NBA Lokoja branch website.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Basic knowledge of SQL and database management
- Access to the project repository

## Setup Steps

### 1. Create a Supabase Project

1. Visit https://supabase.com and sign up or log in
2. Click "New Project" and fill in the form:
   - **Name**: NBA Lokoja
   - **Database Password**: Use a strong password
   - **Region**: Select the region closest to Nigeria (EU West - Ireland)
3. Wait for the project to initialize (5-10 minutes)

### 2. Get Your Credentials

1. Go to **Settings > API** in your Supabase project
2. Copy the following:
   - **Project URL**: (starts with https://)
   - **Public Anon Key**: (your public key)
   - **Service Role Key**: (keep this secret - server-side only)

### 3. Configure the Frontend

1. Open `js/supabase.js` in the project
2. Replace the placeholder values:

   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://YOUR-PROJECT-REF.supabase.co", // Replace with your URL
     anonKey: "YOUR-PUBLIC-ANON-KEY", // Replace with your public key
   };
   ```

3. Or set environment variables:
   - `VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-KEY`

### 4. Initialize the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click "Run"
6. Wait for the schema to be created

### 5. Enable Row Level Security (RLS)

For security, enable RLS on all tables:

1. Go to **Authentication > Policies** in your Supabase dashboard
2. For each table (members, events, news, payments, etc.):
   - Enable RLS
   - Create policies:
     - **Public Read**: Allow unauthenticated users to read published content
     - **User Insert/Update**: Allow authenticated users to modify their own records
     - **Admin Only**: Create policies for admin operations (news, events)

Example policy for members table:

```sql
-- Allow users to read active members (public directory)
CREATE POLICY "Members are viewable by public"
ON members FOR SELECT
TO public
USING (status = 'active');

-- Allow members to update their own profile
CREATE POLICY "Members can update own profile"
ON members FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

### 6. Configure Authentication

1. Go to **Authentication > Providers** in Supabase
2. Enable Email & Password (default)
3. (Optional) Enable social providers:
   - Google OAuth
   - GitHub OAuth
   - Others as needed

4. In **Email Templates**, customize:
   - Confirmation email
   - Password reset email
   - Magic link email

### 7. Set Up Storage for Documents

1. Go to **Storage** in Supabase
2. Create a new bucket:
   - **Bucket name**: documents
   - **Public**: No (files need authentication)
3. Set up folder structure:
   ```
   documents/
   ├── bulletins/
   ├── reports/
   ├── constitutions/
   ├── publications/
   └── member-certificates/
   ```

### 8. Test the Connection

1. Open the website in a browser
2. Check the browser console (F12)
3. Look for the message: `[NBA Lokoja] Supabase client initialized successfully`
4. If there's an error, verify your credentials are correct

### 9. Test API Functions

To test if the backend is working:

1. Open the browser console (F12)
2. Test authentication:

   ```javascript
   // Test sign up
   await NBAAuth.signUp({
     email: "test@example.com",
     password: "TestPassword123",
     fullName: "Test User",
     phone: "+234 800 000 0000",
     scn: "SCN/2025/00001",
   });

   // Test sign in
   await NBAAuth.signIn("test@example.com", "TestPassword123");

   // Get current session
   const session = await NBAAuth.getSession();
   console.log(session);
   ```

## Available Functions

### Authentication (NBAAuth)

- `signUp(credentials)` - Register new member
- `signIn(email, password)` - Login
- `signOut()` - Logout
- `resetPassword(email)` - Password reset
- `getSession()` - Get current user session
- `onAuthChange(callback)` - Listen to auth state changes

### Database (NBADB)

- `getMember(userId)` - Get member profile
- `updateMember(userId, updates)` - Update member profile
- `listMembers(filters)` - Get all members
- `listEvents()` - Get all events
- `registerEvent(eventId, userId)` - Register for event
- `listNews()` - Get all news/announcements
- `listPublications()` - Get publications
- `recordPayment(userId, payment)` - Record payment
- `submitInquiry(inquiry)` - Submit contact inquiry
- `subscribeNews(callback)` - Real-time news updates

### Storage (NBAStorage)

- `uploadDocument(file, path)` - Upload file
- `getPublicUrl(path)` - Get file URL
- `listFiles(folder)` - List files in folder

## Database Schema Overview

### Tables

- **members** - User profiles and membership info
- **events** - Events and programs
- **event_registrations** - Event attendee tracking
- **news** - News and announcements
- **publications** - Legal publications and documents
- **payments** - Payment tracking
- **inquiries** - Contact form submissions

### Relationships

```
members (1) -----> (*) event_registrations
events (1) -----> (*) event_registrations

members (1) -----> (*) payments
members (1) -----> (*) inquiries
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for production
3. **Enable RLS** on all tables
4. **Implement rate limiting** on forms
5. **Validate inputs** on frontend and backend
6. **Use HTTPS** only in production
7. **Keep Supabase updated** with latest security patches
8. **Monitor access logs** regularly
9. **Use service role key** only on backend
10. **Rotate keys periodically**

## Troubleshooting

### "Supabase client initialization failed"

- Check your credentials are correct
- Verify the Supabase CDN script is loaded in HTML
- Check browser console for specific error

### "Cannot read properties of null"

- Supabase client not initialized
- Check credentials in `supabase.js`
- Verify CDN script is in HTML head

### Authentication not working

- Check email provider is enabled in Supabase
- Verify SMTP settings are configured
- Check email confirmation settings

### Database queries return mock data

- Supabase client not properly initialized
- Check credentials
- Verify RLS policies aren't blocking queries

## Next Steps

1. Customize email templates for your brand
2. Set up backup schedule
3. Configure webhooks for notifications
4. Implement admin dashboard
5. Set up monitoring and alerts
6. Create user documentation
7. Deploy to production

## Support Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase Community: https://supabase.io/
- NBA Lokoja Development Team

---

**Last Updated**: April 30, 2026
**Version**: 1.0
