# Zairo — Financial Workspace UI

> A modern React frontend for Zairo, a secure role-based financial workspace for managing transactions and users.

Built with React, Vite, Axios, and Tailwind CSS.

---

## Overview

Zairo UI communicates with the Zairo Backend API to provide a clean interface for managing financial data.

The application supports JWT authentication, role-based access, transaction management, dashboard analytics, and workspace administration.

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Framework | React |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Authentication | JWT |
| Backend | Spring Boot REST API |

---

## Features

- Secure JWT Login
- Role-Based Dashboard
- Transaction Management
- Transaction Filtering
- Net Income & Expense Overview
- PDF Report Download
- Workspace User Management
- Protected Routes
- Responsive UI

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/Aakashch-code/zairo-ui
cd zairo-ui
```

---

### Install dependencies

```bash
npm install
```

---

### Configure Environment

Create a `.env` file in the root directory.

```env
VITE_API_URL=http://localhost:8085
```

Replace it with your deployed backend URL if necessary.

---

### Start Development Server

```bash
npm run dev
```

The application will start on:

```
http://localhost:5173
```

---

## Production Build

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Project Structure

```text
src/
├── components/
│   └── Sidebar.jsx
│
├── pages/
│   ├── authentication/
│   ├── workspace/
│   └── Dashboard.jsx
│
├── service/
│   └── api.jsx
│
├── App.jsx
├── App.css
└── main.jsx
```

---

## Backend API

The frontend communicates with the Zairo Backend API for:

- JWT Authentication
- Transaction Management
- Role-Based Authorization
- PDF Report Generation
- Workspace User Management

---

## Future Improvements

- Dark Mode
- Charts & Analytics
- Search & Pagination
- Mobile UI Enhancements
- Toast Notifications
- Better Loading States

---

## License

Open for learning and portfolio purposes.

---

**Built by [Aakash Chauhan](https://github.com/Aakashch-code)**
