# 🛒 Multi-Vendor E-Commerce Platform

A complete, full-stack E-Commerce platform built using the **MERN** stack (MongoDB, Express, React, Node.js), featuring standard shopping functionality for customers and a comprehensive business dashboard for vendors, with real-time state synchronization via WebSockets (Socket.io) and automated PDF invoice generation.


## 🌟 Key Features

### 👤 Customer Experience
*   **Secure Authentication**: Log in securely using either email or mobile number with JWT token-based verification.
*   **Interactive Shopping Experience**:
    *   Dynamic catalog browsing with categories and search engine filtering.
    *   Interactive Cart: Add products, update quantities dynamically, and remove items with automated state syncing.
    *   Wishlist: Toggle products to save for later.
*   **Order Checkout**: Atomic stock checking and deductions during checkout to prevent double-ordering.
*   **Invoicing**: Instantly download PDF invoices generated dynamically on-the-fly using `pdfkit`.
*   **Service Bookings**: Book local on-demand services (e.g., technician requests) directly from the platform.
*   **Feedback & Reviews**: Rate and review delivered orders and services to help other customers.

### 🏪 Vendor Capabilities
*   **Dedicated Vendor Dashboard**: Full overview of shop statistics, total revenue, service bookings, and products.
*   **Inventory Control**: Complete CRUD capabilities for products (Add, Edit, Delete) with image uploads handled via `multer`.
*   **Real-time Order Alerts**: Receive instant notification cards when customer checkouts occur via Socket.io.
*   **Service Appointment Management**:
    *   Track pending booking requests.
    *   Confirm bookings and assign technicians automatically.
    *   Mark bookings as complete to update revenue metrics.

---

## 🛠️ Tech Stack

*   **Frontend**: React (v19), React Router DOM (v7), Axios, TailwindCSS, Material UI (MUI), Lucide React, Socket.io-client.
*   **Backend**: Node.js, Express.js (v5), MongoDB, Mongoose, JSON Web Tokens (JWT), BcryptJS (password hashing).
*   **Real-Time Sync**: Socket.io (client-server WebSocket architecture).
*   **Utilities & Services**: Multer (image/file uploads), PDFKit (dynamic PDF invoices generator).

#

## ⚡ Setup & Installation

### Prerequisites
*   Node.js installed (v18+ recommended)
*   MongoDB running locally or a MongoDB Atlas URI

### 1. Clone & Set Up the Backend
1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Create a `.env` file in the `backend` directory (or edit the existing one):
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/ecommerce
    JWT_SECRET=your_super_secret_jwt_key
    ```
4.  *(Optional)* Seed the database with sample products:
    ```bash
    npm run seed
    ```
5.  Start the backend server in development mode:
    ```bash
    npm run dev
    ```

### 2. Set Up the Frontend
1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd Frontend/ECommerce_frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend react app:
    ```bash
    npm start
    ```
    *This will open the application in your browser at `http://localhost:3000`.*

