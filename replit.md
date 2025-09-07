# UPSC News Analyzer

## Overview
A full-stack web application that helps UPSC (Union Public Service Commission) aspirants analyze and categorize newspaper articles by subject. The application allows users to upload newspaper files (PDF/images), automatically categorizes articles into UPSC-relevant subjects, and provides an organized way to browse and study current affairs.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Vite**: Fast build tool and development server with hot module replacement
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Server state management for API calls and caching
- **shadcn/ui**: Component library built on Radix UI primitives with Tailwind CSS styling
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **File Upload System**: Multer middleware for handling newspaper file uploads (PDF, JPG, PNG)
- **In-Memory Storage**: Interface-based storage system with memory implementation for development
- **API Routes**: Organized endpoints for newspapers, subjects, articles, and search functionality

### Data Storage Solutions
- **PostgreSQL with Drizzle**: Database ORM configured for PostgreSQL with Neon Database support
- **Schema Design**: 
  - Newspapers table for uploaded files
  - UPSC subjects table with predefined categories
  - Articles table linking newspapers to subjects with content analysis
- **File System**: Local file storage for uploaded newspaper files

### Authentication and Authorization
- Currently no authentication system implemented
- Session-based architecture prepared with express-session and connect-pg-simple

### Key Features
- **File Upload**: Support for PDF and image newspaper uploads
- **Subject Categorization**: Pre-defined UPSC subjects (Economy, Politics, International Relations, etc.)
- **Article Management**: Content extraction and categorization from uploaded newspapers
- **Search Functionality**: Article search within subjects
- **Mobile Navigation**: Bottom navigation bar for mobile-first experience
- **Admin Panel**: Interface for uploading and managing newspapers

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon Database PostgreSQL adapter
- **drizzle-orm** & **drizzle-kit**: TypeScript ORM for PostgreSQL
- **express**: Node.js web framework
- **multer**: File upload middleware
- **@tanstack/react-query**: Server state management

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **class-variance-authority**: Utility for creating component variants
- **tailwindcss**: Utility-first CSS framework
- **clsx**: Conditional className utility

### Development Tools
- **vite**: Frontend build tool
- **typescript**: Type checking
- **esbuild**: JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Utility Libraries
- **date-fns**: Date manipulation library
- **wouter**: Lightweight routing
- **zod**: Schema validation
- **react-hook-form**: Form state management