# Book Library Web Application

Welcome to the Book Library Web Application, a modern platform for browsing, purchasing, and managing book orders. This project is built with Next.js, React, and MongoDB (for production) with comprehensive development mode fallbacks.

## Table of Contents
- [Project Overview](#project-overview)
- [Technical Documentation](#technical-documentation)
  - [Architecture](#architecture)
  - [Key Features](#key-features)
  - [Technology Stack](#technology-stack)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Books](#books)
  - [Cart](#cart)
  - [Orders](#orders)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)

## Project Overview

The Book Library Web Application allows users to browse a collection of books, add them to a cart, complete purchases, view order history, and manage their profile. The application is designed with a responsive UI and includes animations for a better user experience.

## Technical Documentation

### Architecture

The application follows a client-server architecture with a React-based frontend built using Next.js for server-side rendering and routing. The backend (in production) connects to a MongoDB database through a RESTful API. In development mode, the application uses localStorage with mock data to simulate backend functionality.

- **Frontend**: Next.js with React components, Framer Motion for animations, and Tailwind CSS for styling.
- **Backend**: Node.js with Express (assumed for production API at `localhost:5000`).
- **Data Storage**: MongoDB (production) and localStorage (development mode).
- **State Management**: React Context API for authentication and user state.

### Key Features

- **User Authentication**: Login, registration, and profile management with mock authentication in development mode.
- **Book Browsing**: Search and view detailed book information, integrated with Google Books API for imports.
- **Shopping Cart**: Add, update, and remove books from the cart with localStorage persistence in development mode.
- **Order Management**: Complete purchases, view detailed order history with status tracking.
- **User Profile**: Manage personal information, view recent orders, and handle payment methods.
- **Responsive Design**: Mobile-first approach with Tailwind CSS for a seamless experience across devices.
- **Animations**: Framer Motion for smooth transitions and user interactions.

### Technology Stack

- **Frontend**: Next.js 13, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express (assumed for production)
- **Database**: MongoDB (production)
- **Icons**: React Icons (Fi* icons from Feather Icons)
- **HTTP Client**: Axios for API requests
- **Notifications**: React Hot Toast for user feedback

## API Documentation

The application interacts with a RESTful API at `http://localhost:5000/api` (configurable via environment variables). In development mode, API calls are mocked with data stored in localStorage. Below are the primary endpoints used by the frontend.

### Authentication

- **POST /api/auth/register** - Register a new user
  - Body: `{ username, email, password }`
  - Response: `{ token, user }`
- **POST /api/auth/login** - Login an existing user
  - Body: `{ email, password }`
  - Response: `{ token, user }`
- **GET /api/auth/me** - Get current user information
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`
- **PUT /api/auth/profile** - Update user profile
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ firstName, lastName, email, username, bio, phone, address }`
  - Response: `{ message, user }`

### Books

- **GET /api/books** - Get list of books with pagination and search
  - Query Params: `page, limit, search`
  - Response: `{ books, totalPages, currentPage, total }`
- **GET /api/books/:id** - Get details of a specific book
  - Response: `{ _id, title, authors, description, price, stock, category, imageLinks }`
- **GET /api/books/google/search** - Search Google Books API through backend
  - Query Params: `q, startIndex, maxResults, filter`
  - Response: `{ books, totalItems }`
- **POST /api/books/import/:googleBookId** - Import a book from Google Books
  - Body: `{ title, authors, description, price, stock, category }`
  - Response: `{ _id, title, authors, ... }`

### Cart

- **GET /api/cart** - Get current user's cart
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ cart: { items, totalAmount } }`
- **POST /api/cart/add** - Add item to cart
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ bookId, quantity }`
  - Response: `{ success, cart }`
- **PUT /api/cart/update/:itemId** - Update cart item quantity
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ quantity }`
  - Response: `{ success, cart }`
- **DELETE /api/cart/remove/:itemId** - Remove item from cart
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ success, cart }`
- **DELETE /api/cart/clear** - Clear cart
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ success, cart }`

### Orders

- **POST /api/orders/checkout** - Complete purchase and create order
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ items, shippingInfo, paymentInfo, totalAmount }`
  - Response: `{ success, order }`
- **GET /api/orders** - Get user's order history
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ orders }`
- **GET /api/orders/:id** - Get specific order details
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ order }`

**Note**: In development mode, all API calls have fallbacks that use localStorage to store mock data, ensuring the application remains functional without a backend.

## Setup Instructions

### Prerequisites

- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (comes with Node.js)
- **Git**: For cloning the repository (if applicable)

### Installation

1. **Clone the Repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd book-library
   ```
2. **Install Dependencies**:
   Navigate to the project directory and run:
   ```bash
   npm install
   ```
   This will install Next.js, React, Axios, Tailwind CSS, Framer Motion, and other dependencies defined in `package.json`.

### Environment Variables

Create a `.env.local` file in the root directory to configure environment variables. The following variables are supported:

- `NEXT_PUBLIC_API_URL`: URL of the backend API (default: `http://localhost:5000/api`)
- `NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY`: API key for Google Books API (default provided in code)

Example `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

**Note**: In development mode, the application will work without these variables as it uses mock data.

### Running the Application

1. **Development Mode**:
   Run the development server with:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to see the application. The app uses mock data and localStorage for persistence.

2. **Production Mode**:
   Build the application for production:
   ```bash
   npm run build
   npm start
   ```
   Ensure your backend API is running at the configured URL (default: `http://localhost:5000/api`).

### Development Mode

In development mode, the application automatically uses mock data and localStorage to simulate backend functionality. Key features include:
- **Mock Authentication**: Automatically generates a mock token and user profile.
- **Mock Cart and Orders**: Stores cart and order data in localStorage with sample data initialized on first load.
- **Mock Book Data**: Returns sample book information when the backend is unavailable.

To reset mock data, clear your browser's localStorage for the application domain.

---

This project was developed as part of IT3113 Assignment. For any issues or contributions, please contact the development team. 