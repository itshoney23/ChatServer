const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const cors = require('cors');
const serviceAccount = require('./buzz-chat-b7cc8-firebase-adminsdk-fbsvc-78fa068b49.json'); // path to your Firebase Admin SDK JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

// Socket.IO Real-Time Messaging
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  socket.on('send_message', async ({ sender, receiver, message }) => {
    const timestamp = Date.now();
    const conversationId = [sender, receiver].sort().join('_');

    // Real-time message to receiver
    io.to(receiver).emit('receive_message', { sender, message, timestamp });

    // Save to Firestore
    await db.collection('Messages')
      .doc(conversationId)
      .collection('chats')
      .add({ sender, receiver, message, timestamp });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Endpoint to fetch chat history
app.get('/history', async (req, res) => {
  const { user1, user2 } = req.query;
  const conversationId = [user1, user2].sort().join('_');

  const snapshot = await db.collection('Messages')
    .doc(conversationId)
    .collection('chats')
    .orderBy('timestamp')
    .get();

  const messages = snapshot.docs.map(doc => doc.data());
  res.json(messages);
});

app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('Users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error fetching users');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
