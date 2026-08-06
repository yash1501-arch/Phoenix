# Phoenix Adventures - Full Stack Booking Application

A high-end, secure, and fully animated adventure booking platform.

## Project Structure
- **/frontend**: React + Vite application for customers.
- **/admin**: React + Vite application for administrative management.
- **/backend**: Node.js + Express API with Convex integration.

## Tech Stack
- **Frontend/Admin:** React, Vite, Framer Motion, Lucide Icons, Vanilla CSS.
- **Backend:** Node.js, Express, Convex (Database).
- **Security:** JWT Authentication, Bcrypt password hashing, Express-validator.

## Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file based on `.env.example` and fill in your credentials.
4. `npm start` (or `node index.js`)

### 2. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### 3. Admin Setup
1. `cd admin`
2. `npm install`
3. `npm run dev`

## Deployment Guide

For a **low-cost + secure** production setup (Cloudflare Pages, Convex, always-on API, manual UPI), see **[HOSTING.md](./HOSTING.md)**.

For step-by-step commands and full env tables, see **[DEPLOY.md](./DEPLOY.md)**.

### Quick overview
- **Database & functions:** Convex (`npx convex deploy`) — keep functions internal; admin key only on backend.
- **Backend:** Deploy `/backend` to Render / Koyeb / Railway. Set `CONVEX_URL`, `CONVEX_ADMIN_KEY`, `JWT_SECRET`, `CORS_ORIGINS`, `FRONTEND_URL`.
- **Frontend & admin:** Deploy static builds to Cloudflare Pages (or Vercel). Set `VITE_API_URL` to the HTTPS API.
- **Payments:** Manual UPI verification (no Razorpay/Paytm fees).

### 1. Database & Functions (Convex)
- Log in to Convex: `npx convex dev` (to set up development environment)
- Deploy to production: `npx convex deploy`
- Copy the **Convex Deployment URL** and **Admin Key** from the Convex dashboard.

### 2. Backend Deployment (Node.js/Express)
- Deploy the `/backend` directory to a platform like Render, Railway, or Heroku.
- Set the following Environment Variables in your hosting provider:
  - `PORT`: 5000 (or as provided by host)
  - `CONVEX_URL`: Your Convex Deployment URL
  - `CONVEX_ADMIN_KEY`: Your Convex Admin Key
  - `JWT_SECRET`: A long, random string
  - `CORS_ORIGINS`: Your production site origins
  - `FRONTEND_URL`: Customer site URL
  - `OPENAI_API_KEY`: (Optional) Admin AI helpers
  - `CLOUDINARY_*`: Image / screenshot uploads

### 3. Frontend & Admin Deployment (React/Vite)
- Deploy the `/frontend` and `/admin` directories separately to Cloudflare Pages or Vercel.
- Set the Environment Variables in your hosting provider:
  - **Frontend:**
    - `VITE_API_URL`: Your deployed Backend URL (e.g., `https://api.yourdomain.in`)
  - **Admin:**
    - `VITE_API_URL`: Your deployed Backend URL
  - Protect `admin.` with Cloudflare Access (see HOSTING.md).

## Key Features
- **Premium Landing Page:** Smooth animations and responsive design.
- **Adventure Booking:** Manual UPI pay → screenshot + UTR → admin verifies (0% gateway fee).
- **Admin Dashboard:** Adventures, blog, messages, payment verification.
- **Secure Auth:** JWT + bcrypt; Convex called only from the backend.
- **Real-time DB:** Powered by Convex.

## Social Links
- Instagram: [phoenix_adventures__](https://www.instagram.com/phoenix_adventures__/)
- WhatsApp: [Join Group](https://chat.whatsapp.com/IddLlhp0XTV5Y2KGUpM3C2)
- Location: [Google Maps](https://maps.app.goo.gl/n5uUa7B6FQLKS5aZ6)
