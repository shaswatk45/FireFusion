# 🚨 FireFusion - Disaster Response & Coordination Platform

FireFusion is a web-based platform designed to assist in disaster response and relief coordination. It provides tools for managing incidents, tracking emergency resources, and enabling real-time communication between administrators and volunteers during crisis situations.

## 🌟 Platform Features

### 🔐 Authentication & User Roles
- Secure login and registration system
- Role-based access permissions (Admin/User)
- Protected API routes and application pages
- Admin ability to update user roles
- Admin control to remove users from the system

### 📊 Incident Tracking
- Create and manage disaster incidents
- Assign incidents to volunteers
- Update incident progress in real time
- Categorize incidents based on type and priority
- Map incidents geographically for easier tracking

### 🚨 Alerts & Notifications
- Administrators can broadcast emergency alerts
- Instant notifications using Socket.io
- Real-time alert delivery to active users

### 📦 Resource & Supply Management
- Monitor available emergency supplies
- Track inventory levels and resource usage
- Manage distribution of supplies during emergencies
- Maintain supply availability records

### 📋 Resource Request Handling
- Users can submit requests for emergency resources
- Admin approval system for requests
- Track the progress of supply requests
- Handle requests based on priority levels

### 💬 Additional Functionalities
- Public users can apply to become volunteers
- Real-time dashboard for monitoring system activity
- Volunteers can request incident assignments
- Incidents can be updated, resolved, or removed
- Incident status indicators (In Progress / Resolved)

### ⚡ Real-time Capabilities
- Live notifications across the platform
- WebSocket-based real-time communication
- Immediate alert broadcasts
- Live updates for inventory and incidents

## 🛠️ Technology Stack

### Frontend
- **React** – UI development framework
- **Vite** – Fast build and development tool
- **Tailwind CSS** – Utility-first styling framework
- **Socket.io Client** – Real-time communication

### Backend
- **Node.js** – Server runtime environment
- **Express.js** – Backend web framework
- **MongoDB** – NoSQL database
- **Mongoose** – MongoDB data modeling
- **Socket.io** – Real-time bidirectional communication
- **JWT** – Authentication using JSON Web Tokens
- **bcrypt** – Secure password hashing

### Database
- **MongoDB Atlas** – Cloud-hosted database service

### Development Utilities
- **ES6 Modules** – Modern JavaScript syntax
- **dotenv** – Environment variable configuration
- **CORS** – Cross-origin request handling

## 🚀 Getting Started

### Prerequisites
Make sure the following are installed:
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/shaswatk45/FireFusion.git
   cd FireFusion
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Environment Configuration
Create a `.env` file inside the `server` directory and add:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   node server.js
   ```

2. **Start the frontend client**
   ```bash
   cd client
   npm run dev
   ```

### Access the Application
- Frontend → `http://localhost:5173`
- Backend API → `http://localhost:5000`

## 🔧 Implementation Highlights

### Real-time System
- Socket.io used for instant updates
- WebSocket connections for live notifications
- Event-based communication between client and server

### Security
- Authentication implemented using JWT
- Password encryption with bcrypt
- Protected backend routes
- CORS enabled for secure requests

### Database Structure
- MongoDB with Mongoose ODM
- Structured schemas for incidents, users, and resources
- Indexed collections for efficient queries

## 🤝 Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to your branch (`git push origin feature/NewFeature`)
5. Submit a Pull Request

---

⭐ **Star this repository if you found it helpful!** ⭐

*Built with ❤️ for emergency response and disaster management*
