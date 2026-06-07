# Phoenix Adventures - Full Stack Booking Application

A high-end, secure, and fully animated adventure booking platform.

## Project Structure
- **/frontend**: React + Vite application for customers.
- **/admin**: React + Vite application for administrative management.
- **/backend**: Node.js + Express API with Supabase and Razorpay integration.

## Tech Stack
- **Frontend/Admin:** React, Vite, Framer Motion, Lucide Icons, Vanilla CSS.
- **Backend:** Node.js, Express, Supabase (PostgreSQL), Razorpay.
- **Security:** JWT Authentication, Bcrypt password hashing, Express-validator, Razorpay Signature Verification.

## Setup Instructions

### 1. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file based on `.env.example` and fill in your Supabase and Razorpay credentials.
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
  - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
  - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
  - `OPENAI_API_KEY`: Your OpenAI API Key (for AI features)
  - `SUPABASE_URL`: (Optional, if using Supabase directly)
  - `SUPABASE_KEY`: (Optional)

### 3. Frontend & Admin Deployment (React/Vite)
- Deploy the `/frontend` and `/admin` directories separately to Vercel or Netlify.
- Set the Environment Variables in your hosting provider:
  - **Frontend:**
    - `VITE_API_URL`: Your deployed Backend URL (e.g., `https://phoenix-api.onrender.com`)
    - `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID
  - **Admin:**
    - `VITE_API_URL`: Your deployed Backend URL

## Key Features
- **Premium Landing Page:** Smooth animations, glassmorphism, and responsive design.
- **Adventure Booking:** Integrated with Razorpay for secure payments.
- **Admin Dashboard:** Full control over adventures, bookings, and users using Convex + Express.
- **AI Integration:** Automatic itinerary optimization and PDF extraction.
- **Secure Auth:** JWT-based login and registration with Convex backend.
- **Real-time DB:** Powered by Convex.

## Social Links
- Instagram: [phoenix_adventures__](https://www.instagram.com/phoenix_adventures__/)
- WhatsApp: [Join Group](https://chat.whatsapp.com/IddLlhp0XTV5Y2KGUpM3C2)
- Location: [Google Maps](https://maps.app.goo.gl/A3ZQYPCJWLCtgyB58)
