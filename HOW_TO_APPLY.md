# How to apply these changes

## Step 1: Copy all files
Copy EVERYTHING from this folder into your project root, 
replacing existing files when asked. The folder structure 
matches your project exactly.

## Step 2: Install new packages
Open terminal in your project folder and run:
```
npm install @supabase/supabase-js @supabase/ssr
```

## Step 3: Run the SQL
Go to Supabase Dashboard → SQL Editor → New Query
Paste the contents of supabase-setup.sql → Click Run

## Step 4: Create admin account
Go to Supabase Dashboard → Authentication → Users → Add User
Enter your email and a strong password.

## Step 5: Edit .env.local
Open .env.local and make sure your Supabase URL and key are correct.
Also update NEXT_PUBLIC_MAPTILER_KEY if needed.

## Step 6: Run the project
```
npm run dev
```

Open http://localhost:3000
Go to /admin and login with the email/password you created in Step 4.
