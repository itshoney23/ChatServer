const PORT = process.env.PORT || 3000;
const io = require("socket.io")(PORT, {
    cors: { origin: "*" }
});

console.log(`🚀 Socket.IO server starting on port ${PORT}...`);

io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on("chatMessage", (data) => {
        console.log(`💬 Message from ${data.username}: ${data.message}`);
        io.emit("chatMessage", {
            username: data.username,
            message: data.message
        });
    });

    socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});
