# Naxora – Customer Support Ticket Management System

A full-stack customer support platform designed to streamline ticket management, customer communication, and support team workflows. Naxaro provides role-based dashboards, ticket tracking, real-time conversations, and administrative controls through a modern web interface.



## 📌 Project Overview

Naxaro is a MERN-stack customer support management application that enables customers to raise support tickets and communicate with support agents. Administrators can manage agents and monitor overall support operations, while agents can manage assigned tickets and respond to customer queries.

The application implements JWT-based authentication, role-based access control, RESTful APIs, and real-time communication using Socket.IO.

## ✨ Key Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Password hashing
- Protected API routes
- Role-based access control

### 🎫 Ticket Management
- Create and submit support tickets
- View and manage tickets
- Update ticket status and priority
- Assign tickets to support agents
- Search and filter tickets
- Track ticket progress

### 👥 Role-Based Dashboards

**Admin**
- View system-wide ticket statistics
- Manage support agents
- Monitor ticket activity
- Activate or deactivate agents

**Agent**
- View assigned tickets
- Manage ticket status and priority
- Respond to customer queries
- Track support workload

**Customer**
- Create support tickets
- View personal tickets
- Track ticket status
- Communicate with support agents

### 💬 Real-Time Communication
- Real-time ticket conversations using Socket.IO
- Join and leave ticket-specific rooms
- Real-time message updates
- Typing indicators

### 📎 File Attachments
- Upload multiple files to tickets
- View ticket attachments
- Download attachments
- Access-controlled attachment endpoints

### 🔔 Notifications & Activity Tracking
- Notification management
- Ticket activity tracking
- Conversation history

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| Real-Time Communication | Socket.IO |
| API Communication | Axios |
| Security | Helmet, CORS |
| Development Tools | Git, GitHub, Postman |
| Frontend Deployment | Netlify |
| Backend Deployment | Render |

## 🏗️ Project Structure

```text
Customer-Support-Ticket-Management-System/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── assets/
│   ├── index.html
│   └── package.json
│
├── postman/
├── .gitignore
└── README.md
```

*Note: The folder structure above describes the main project areas; individual files and folders may vary as the project evolves.*

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/123-devanshubhattacharya2027/Customer-Support-Ticket-Management-System.git
```

```bash
cd Customer-Support-Ticket-Management-System
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secure_jwt_secret

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## 🔑 Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `NODE_ENV` | Application environment |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for JWT authentication |
| `CLIENT_URL` | Frontend origin allowed for Socket.IO |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend REST API base URL, including `/api` |
| `VITE_SOCKET_URL` | Backend Socket.IO server URL |



## 🔌 API Overview

The backend exposes RESTful API routes for the application's main modules.

| Module | Base Route | Purpose |
|---|---|---|
| Authentication | `/api/auth` | Registration, login and profile |
| Tickets | `/api/tickets` | Ticket management |
| Replies | `/api/replies` | Ticket conversations and activities |
| Dashboard | `/api/dashboard` | Dashboard statistics |
| Users | `/api/users` | Agent management |
| Attachments | `/api/attachments` | Ticket file attachments |
| Notifications | `/api/notifications` | Notification management |

All protected endpoints require a valid JWT token.

## 🔒 Security Considerations

- Passwords are hashed before storage.
- JWT authentication protects private endpoints.
- Role-based middleware restricts access to authorized users.
- Helmet provides HTTP security headers.
- CORS controls cross-origin access.
- Sensitive environment variables are kept outside source control.




