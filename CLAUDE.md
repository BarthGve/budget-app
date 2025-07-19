# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript budget management application using Vite, Supabase, and shadcn/ui components. The app allows users to track personal finances including credits, incomes, recurring charges, and savings contributions with collaboration features.

## Development Commands

```bash
# Start development server
npm run dev

# Build the application
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Technologies
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix-based)
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod validation

### Key Directory Structure
- `src/components/` - Feature-based component organization (admin, credits, dashboard, etc.)
- `src/pages/` - Route-level page components
- `src/context/` - Global state management (DataContext)
- `src/types/` - TypeScript interface definitions
- `src/lib/` - Utilities and Supabase client
- `src/components/ui/` - shadcn/ui components

### Core Data Models
- **Credits**: Loan tracking with installment calculations
- **RecurringCharges**: Subscription/bill management
- **Income**: Revenue tracking with collaboration sharing
- **SavingsContributions**: Savings goal management
- **Beneficiaries**: Expense recipients
- **Groups**: Beneficiary groupings

### State Management Pattern
- Central `DataContext` provides all app data and CRUD operations
- Component-specific hooks in `src/hooks/`
- Real-time updates via Supabase subscriptions
- Collaborative features using user sharing permissions

### Authentication & Authorization
- Supabase Auth with profile-based user management
- Admin role system with restricted access to user management
- Collaboration system with invite/accept workflow

## Development Guidelines

### Language Convention
- **All code (variables, functions, comments) must be in French** as specified in GEMINI.md
- Use strict TypeScript - avoid `any` types

### Component Standards
- **Must use shadcn/ui components exclusively**
- Alerts must use shadcn/ui `Alert` component
- Mobile-first responsive design with Tailwind CSS
- Use `React.lazy()` for code-splitting heavy components

### Data Fetching
- Primary data fetching through `DataContext.fetchAllData()`
- Admin-specific data loaded via Supabase Edge Functions
- Collaborative data filtered by user relationships

### Path Aliases
- Use `@/` alias for src directory imports (configured in tsconfig.json and vite.config.ts)

## Environment Setup
Required environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Testing
No test framework is currently configured. The project includes only ESLint for code quality.