# ARKD Presolutions CRM

A complete CRM-style manufacturing management dashboard for ARKD Presolutions, built with Next.js App Router, TypeScript, Prisma, MySQL, and Tailwind CSS.

## Features

- **Authentication System:** Secure login system using NextAuth with hashed passwords (bcrypt).
- **Role-Based Permissions:** Admin, Manager, and Operator access levels.
- **Manufacturing Modules:** Dashboard, Daily Production, Targets, Workers Log, Dispatch, Scrap & Rejection, Maintenance, Expenses, and Master Data.
- **Premium UI:** Dark industrial theme with orange/gold accents matching the original ARKD dashboard, powered by Tailwind CSS and shadcn/ui.
- **Database Backend:** All data powered by Prisma and MySQL, targeting `arkd_Infra`.

## Prerequisites

1. Node.js (v18+)
2. MySQL (XAMPP/LAMP/MAMP/WAMP) or standalone MySQL server
3. phpMyAdmin (optional, for easy database management)

## Setup Instructions

### 1. Database Creation

Open phpMyAdmin (or your preferred MySQL client) and create a new database with the exact name:
**`arkd_Infra`**

*(Note: Do not create any tables. Prisma will handle this for you.)*

### 2. Configure Environment

Copy `.env.example` to a new `.env` file:
```bash
cp .env.example .env
```
Update your `DATABASE_URL` if your MySQL root user has a password:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/arkd_Infra"
```

### 3. Install & Setup

Run these commands in the terminal:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

### 4. Default Login

The seed script creates a default Admin user:
- **Email:** `admin@arkd.local`
- **Password:** `admin123`

### 5. Deployment (VPS or cPanel Node.js)

1. Upload the files to your server (exclude `node_modules` and `.next`).
2. Run `npm install` on the server.
3. Update the `.env` file with the production MySQL credentials.
4. Run `npx prisma generate` and `npx prisma migrate deploy` on the server.
5. Build the application for production:
   ```bash
   npm run build
   ```
6. Start the Next.js server:
   ```bash
   npm start
   ```
7. Use PM2 (on VPS) or Phusion Passenger (on cPanel) to keep the app running.

## Testing Checklist

- [x] npm install works
- [x] Prisma generate works
- [x] Migration creates tables inside arkd_Infra
- [x] Seed creates default admin
- [x] Login page renders with dark theme
- [x] Dashboard UI renders with Recharts layout ready
- [x] Production module UI implemented

*Note: For the database portions to work, the `arkd_Infra` MySQL database must be actively running on localhost:3306.*
