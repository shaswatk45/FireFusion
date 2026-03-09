const app = require('./app');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const { startWildfireMonitoring } = require('./services/wildfireMonitoring');

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available globally
global.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start wildfire monitoring (checks every 60 minutes)
  // For testing, you can reduce to 5 minutes: startWildfireMonitoring(5)
  startWildfireMonitoring(60);
});
