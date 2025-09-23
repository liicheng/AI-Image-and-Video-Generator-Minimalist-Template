# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern full-stack web application template for AI-driven image and video generation, built with Next.js 14, TypeScript, and integrated with Replicate AI API. The application features user authentication, subscription-based credit system, and multi-language support.

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint
npm run build:prod   # Build with NODE_ENV=production
```

### Database Setup
```bash
psql -U your_username -d your_database -f src/backend/sql/init.sql
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14.2.11 (App Router), TypeScript 5, Tailwind CSS 3.4, NextUI/HeroUI
- **Backend**: Next.js API Routes, PostgreSQL, NextAuth.js 4
- **AI Integration**: Replicate API
- **Storage**: AWS S3 / Cloudflare R2
- **Payment**: Stripe
- **Authentication**: Google OAuth via NextAuth.js

### Key Components
- **AI Effects**: Two main AI models - Kling v2.1 (video generation) and Flux1.1 Pro (image generation)
- **Credit System**: Users consume credits for AI generation tasks
- **Subscription Plans**: Monthly/yearly billing with credit allocation
- **Multi-language**: Built-in internationalization with next-intl

### Project Structure
```
src/
├── app/                    # Next.js App Router with internationalization
│   ├── [locale]/           # Localized routes
│   │   ├── (free)/         # Public pages
│   │   └── layout.tsx      # Main layout
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── predictions/    # AI generation endpoints
│   │   ├── webhook/        # Stripe & Replicate webhooks
│   │   └── r2/             # File upload endpoints
│   └── globals.css         # Global styles
├── backend/                # Backend logic
│   ├── models/             # Database models
│   ├── service/            # Business logic services
│   └── config/             # Database configuration
├── components/             # React components
│   ├── landingpage/        # Landing page sections
│   ├── replicate/          # AI generation components
│   ├── layout/             # Layout components
│   └── price/              # Pricing components
└── config/                 # Application configuration
```

### Database Schema
The application uses PostgreSQL with the following main tables:
- **users**: User authentication and profile data
- **credit_usage**: Tracks credit consumption per subscription cycle
- **effect**: AI effect configurations and metadata
- **effect_result**: Stores AI generation results
- **payment_history**: Payment transaction records
- **subscription_plans**: Available subscription plans
- **user_subscriptions**: User subscription status and cycles

### Environment Variables
Required environment variables in `.env.local`:
- Database: `POSTGRES_URL`
- Authentication: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, Google OAuth credentials
- AI: `REPLICATE_API_TOKEN`
- Payment: Stripe keys and webhook secrets
- Storage: AWS S3/Cloudflare R2 credentials

## Development Notes

### Credit System
- Each AI effect has a credit cost (Kling v2.1: 15 credits, Flux1.1 Pro: 1 credit)
- Credits are allocated based on subscription plans
- Usage is tracked per billing cycle

### AI Integration
- Uses Replicate API for AI model execution
- Supports both image and video generation
- Results are stored in `effect_result` table with status tracking

### Authentication Flow
- Google OAuth via NextAuth.js
- User data stored in PostgreSQL users table
- Session management with NextAuth

### Payment Processing
- Stripe integration for subscription management
- Webhook handlers for payment events
- Credit allocation upon successful payment

### File Storage
- Supports AWS S3 and Cloudflare R2
- Media files stored with CDN access
- Configurable storage types in effect results

## Configuration Files
- `next.config.mjs`: Next.js configuration with image optimization and internationalization
- `tailwind.config.ts`: Tailwind CSS with NextUI and custom animations
- `tsconfig.json`: TypeScript configuration with path aliases (`@/*`)