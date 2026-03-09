# 🚨 DisasterSync - Emergency Management Platform

A comprehensive disaster management and relief coordination platform built with modern web technologies. DisasterSync enables efficient emergency response, resource management, and real-time communication during crisis situations.

## 🌟 Features

### 🔐 User Management & Authentication
- Secure user registration and login system
- Role-based access control (Admin/User)
- Protected routes and API endpoints
- Change roles and delete users

### 📊 Incident Management
- Create, track, and manage emergency incidents
- Assign incidents to specific volunteers
- Real-time incident status updates
- Incident categorization and priority levels
- Geographic incident mapping

### 🚨 Alert & Notification System
- Admin broadcast alert messaging
- Real-time notifications via Socket.io
- Emergency alert distribution

### 📦 Inventory Management
- Track emergency supplies and resources
- Inventory level monitoring
- Resource allocation tracking
- Supply chain management

### 📋 Inventory Request System
- Request emergency supplies and resources
- Approval workflow for resource requests
- Request status tracking
- Priority-based request handling

### 💬 Additional Features
- Public user request to become volunteer
- Real-time Dashboard
- Request incident assignment
- Mark as complete, delete and update status of incidents(in progress, resolved)
  
### ⚡ Real-time Features
- Live notifications and updates
- WebSocket-based real-time communication
- Instant alert broadcasting
- Real-time inventory updates

## 🛠️ Tech Stack

### Frontend
- **React** - Modern UI framework
- **Vite** - Fast development build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing

### Database
- **MongoDB Atlas** - Cloud database service

### Development Tools
- **ES6+ Modules** - Modern JavaScript
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
  git clone https://github.com/yourusername/Disaster-Sync.git

  cd disaster-sync


3. **Install server dependencies**
  cd server

  npm install


3. **Install client dependencies**
   cd ../client

   npm install


4. **Environment Setup**

   Create a `.env` file in the `server` directory:

   MONGO_URI=your_mongodb_atlas_connection_string

   JWT_SECRET=your_jwt_secret_key

   PORT=5000


5. **Run the application**

  **Start the server:**
    cd server

    node server.js


  **Start the client (in a new terminal):**
    cd client

    npm run dev


6. **Access the application**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## 🔧 Key Features Implementation

### Real-time Communication
- Implemented using Socket.io for instant notifications
- WebSocket connections for live updates
- Event-driven architecture for real-time features

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration for secure cross-origin requests

### Database Design
- MongoDB with Mongoose ODM
- Optimized schema design for emergency data
- Efficient indexing for fast queries

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👨‍💻 Developer

**[Khushi Malviya]**
- GitHub: [@khushi-malviya(https://github.com/khushi-malviya)
- LinkedIn: [My LinkedIn Profile](https://www.linkedin.com/in/khushi-malviya-72308a20b/)
- Email: khushimalviya11054@gmail.com

---

⭐ **Star this repository if you found it helpful!** ⭐

*Built with ❤️ for emergency response and disaster management*
