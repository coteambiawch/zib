# Custom Authentication Setup Instructions

## What I Need From You

Please follow these steps to set up the custom authentication system in your Supabase database:

### 1. Run the SQL Script
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Create a new query
4. Copy and paste the entire contents of `supabase-auth-setup.sql` file
5. Click **Run** to execute the script

### 2. Create Storage Bucket (Optional)
If you plan to use image attachments for dialogs:
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `dialog-photos`
3. Set it to **Public** (or create appropriate access policies)

### 3. Verify Database Setup
After running the SQL script, you should see:
- A new table called `custom_users` with columns: id, email, password_hash, name, created_at, updated_at
- Your existing `demo_dialogs` table now has a `user_id` column
- Row Level Security policies are enabled

**If you already had a `custom_users` table without the `name` field:**
1. Run the `update-add-name-field.sql` script instead
2. This will add the name column to your existing table

### 4. Test the Authentication
1. Make sure your development server is running (`npm run dev`)
2. Try creating a new account - it should work instantly without email verification
3. Try logging in with the created account
4. Your dialogs should be user-specific

## What the System Does Now

- **No Email Verification**: Accounts are created instantly
- **Secure Passwords**: Passwords are hashed with SHA-256 and salt before storing
- **User Sessions**: Login state is maintained in localStorage
- **User-Specific Data**: Each user only sees their own dialogs
- **Security**: Row Level Security ensures data isolation between users

## Troubleshooting

If you encounter any issues:
1. Check the Supabase SQL Editor for any error messages
2. Verify your Supabase project URL and anon key in the code
3. Make sure the database tables were created successfully
4. Check the browser console for any JavaScript errors

Let me know if you need help with any of these steps!
