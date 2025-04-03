// server/func-interface.js
const { validateAuth } = require('./auth');  // Keep validateAuth in auth.js
const { updateRaceSessions } = require('./func-sessions') 

function authenticateUser(socket, data, io) {
    const { interfaceName, accessKey } = data;

    validateAuth(interfaceName, accessKey)
        .then(result => {
            updateRaceSessions(io) //Here so that /race-control will immediately show any race sessions
            socket.emit("validate-user", result);
        })
        .catch(err => {
            console.error("Authentication error:", err);
            socket.emit("validate-user", { success: false, error: "Authentication failed" });
        });
}

module.exports = { authenticateUser };
