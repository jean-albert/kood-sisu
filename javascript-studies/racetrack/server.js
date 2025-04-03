require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { FRONT_DESK_KEY, RACE_CONTROL_KEY, LAP_TRACKER_KEY } = require('./config'); //Needed for command just below

// Check that access keys are in .env, as per requirements. 
if (!FRONT_DESK_KEY || !RACE_CONTROL_KEY || !LAP_TRACKER_KEY ) {
    console.error('Error: One or more access keys are undefined.');
    process.exit(1); 
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Port from .env or fallback to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from 'client/public' (HTML, CSS, images)
app.use(express.static(path.join(__dirname, './client/public')));
app.use('/js', express.static(path.join(__dirname, './client/js')));

// Serve the main-index HTML file as the default page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './client/public/main-index.html'));
});

// Dynamic static file retrieval. 
const htmlRoutes = [
    "main-index",
    "front-desk",
    "race-control",
    "lap-line-tracker",
    "leader-board",
    "next-race",
    "race-flag",
    "race-countdown",
  ];
  
htmlRoutes.forEach((route) => {
    app.get(`/${route}`, (req, res) => {
      res.sendFile(path.join(__dirname, './client/public', `${route}.html`));
    });
  });
  
// Set up socket connection logic
require('./server/socket-server').setupSocketEvents(io);

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});