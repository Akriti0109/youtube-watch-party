const express = require("express"); // Help to create our backend server and APIs
const http = require("http"); // HTTP Server because Socket.IO will run on top of it
const cors = require("cors"); // CORS allows the frontend to communicate with the backend
const { Server } = require("socket.io"); // Real-time communication

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://youtube-watch-party-o7ro-h83d200zb-akriti0109.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

// Store all active rooms
const rooms = {};

app.get("/", (req, res) => {
  res.send("YouTube Watch Party Backend is running!");
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // -----------------------------
  // CREATE ROOM
  // -----------------------------

  socket.on("create_room", ({ roomId, username }) => {
    socket.join(roomId);

    rooms[roomId] = {
  host: socket.id,

  // Current playback state of the room
 currentVideo: "PrCSLs1YHtA",
currentTime: 0,
isPlaying: false,
lastUpdatedAt: Date.now(),

  participants: [
        {
          userId: socket.id,
          username: username,
          role: "Host",
        },
      ],
    };

    console.log(`${username} created room ${roomId}`);

    // Tell creator that room was created
    socket.emit("room_created", {
      roomId: roomId,
      role: "Host",
    });

    // Send participant list
    io.to(roomId).emit("participants_updated", {
      participants: rooms[roomId].participants,
    });
  });

  // -----------------------------
  // JOIN ROOM
  // -----------------------------

  socket.on("join_room", ({ roomId, username }) => {
    if (!rooms[roomId]) {
      socket.emit("error_message", {
        message: "Room does not exist",
      });

      return;
    }

    socket.join(roomId);

    rooms[roomId].participants.push({
      userId: socket.id,
      username: username,
      role: "Participant",
    });

    console.log(`${username} joined room ${roomId}`);

    // Tell the user joining was successful
    socket.emit("join_success", {
      roomId: roomId,
      role: "Participant",
    });

    // Send current video/playback state to the new participant
const room = rooms[roomId];

let currentTime = room.currentTime;

// If video is currently playing,
// calculate how much time has passed since last update.
if (room.isPlaying) {
  const elapsedTime =
    (Date.now() - room.lastUpdatedAt) / 1000;

  currentTime = currentTime + elapsedTime;
}

socket.emit("room_state", {
  videoId: room.currentVideo,
  currentTime: currentTime,
  isPlaying: room.isPlaying,
});

    // Send updated participant list to everyone
    io.to(roomId).emit("participants_updated", {
      participants: rooms[roomId].participants,
    });
  });

  // -----------------------------
  // PLAY VIDEO
  // -----------------------------

 socket.on("play_video", ({ roomId, currentTime }) => {
  

    const room = rooms[roomId];

if (!room) {
  console.log("Room not found:", roomId);
  return;
}

const participant = room.participants.find(
  (user) => user.userId === socket.id
);

    // Only Host or Moderator can control the video
    if (
      !participant ||
      (participant.role !== "Host" && participant.role !== "Moderator")
    ) {
      socket.emit("error_message", {
        message: "You do not have permission to play the video.",
      });

      return;
    }
    room.currentTime = currentTime;
    room.isPlaying = true;
    room.lastUpdatedAt = Date.now();

    console.log(
      `${participant.username} (${participant.role}) played the video`
    );

    // Send play command to other users
    socket.to(roomId).emit("remote_play");
  });

  // -----------------------------
  // PAUSE VIDEO
  // -----------------------------

  socket.on("pause_video", ({ roomId, currentTime }) => {
   

    const room = rooms[roomId];

    if (!room) {
      console.log("Room not found:", roomId);
      return;
    }
    

    const participant = room.participants.find(
      (user) => user.userId === socket.id
    );

    // Only Host or Moderator can control the video
    if (
      !participant ||
      (participant.role !== "Host" && participant.role !== "Moderator")
    ) {
      socket.emit("error_message", {
        message: "You do not have permission to pause the video.",
      });

      return;
    }
    room.currentTime = currentTime;
    room.isPlaying = false;
    room.lastUpdatedAt = Date.now();

    console.log(
      `${participant.username} (${participant.role}) paused the video`
    );

    // Send pause command to other users
    socket.to(roomId).emit("remote_pause");
  });

  // -----------------------------
// SEEK VIDEO
// -----------------------------

socket.on("seek_video", ({ roomId, currentTime }) => {
  

  const room = rooms[roomId];

  if (!room) {
    return;
  }
  
  const participant = room.participants.find(
    (user) => user.userId === socket.id
  );

  // Only Host or Moderator can seek
  if (
    !participant ||
    (participant.role !== "Host" && participant.role !== "Moderator")
  ) {
    socket.emit("error_message", {
      message: "You do not have permission to seek the video.",
    });

    return;
  }
  room.currentTime = currentTime;
  room.lastUpdatedAt = Date.now();

  // Send seek position to other users
  socket.to(roomId).emit("remote_seek", {
    currentTime: currentTime,
  });
});

// -----------------------------
// CHANGE VIDEO
// -----------------------------

socket.on("change_video", ({ roomId, videoId }) => {

  const room = rooms[roomId];

  if (!room) {
    return;
  }

  const participant = room.participants.find(
    (user) => user.userId === socket.id
  );

  // Only Host or Moderator can change the video
  if (
    !participant ||
    (participant.role !== "Host" && participant.role !== "Moderator")
  ) {
    socket.emit("error_message", {
      message: "You do not have permission to change the video.",
    });

    return;
  }
  room.currentVideo = videoId;
room.currentTime = 0;
room.isPlaying = false;
room.lastUpdatedAt = Date.now();

  // Send the new video ID to other users
  socket.to(roomId).emit("remote_change_video", {
    videoId: videoId,
  });
});

// -----------------------------
// ASSIGN MODERATOR ROLE
// -----------------------------

socket.on("assign_role", ({ roomId, userId, role }) => {

  const room = rooms[roomId];

  if (!room) {
    return;
  }

  // Find the person making the request
  const requester = room.participants.find(
    (user) => user.userId === socket.id
  );

  // Only Host can assign Moderator
  if (!requester || requester.role !== "Host") {
    socket.emit("error_message", {
      message: "Only the Host can assign roles.",
    });

    return;
  }

  // Find the user whose role should change
  const targetUser = room.participants.find(
    (user) => user.userId === userId
  );

  if (!targetUser) {
    return;
  }

  // Change role
  targetUser.role = role;

  console.log(
    `${targetUser.username} is now ${targetUser.role}`
  );

  // Send updated participant list to everyone
  io.to(roomId).emit("participants_updated", {
    participants: room.participants,
  });
});

// -----------------------------
// REMOVE PARTICIPANT
// -----------------------------

socket.on("remove_participant", ({ roomId, userId }) => {

  const room = rooms[roomId];

  if (!room) {
    return;
  }

  // Find the person making the request
  const requester = room.participants.find(
    (user) => user.userId === socket.id
  );

  // Only Host can remove participants
  if (!requester || requester.role !== "Host") {
    socket.emit("error_message", {
      message: "Only the Host can remove participants.",
    });

    return;
  }

  // Find the participant to remove
  const targetUser = room.participants.find(
    (user) => user.userId === userId
  );

  if (!targetUser) {
    return;
  }

  // Don't allow Host to remove themselves
  if (targetUser.userId === room.host) {
    socket.emit("error_message", {
      message: "The Host cannot be removed.",
    });

    return;
  }

  console.log(
    `${targetUser.username} was removed by the Host`
  );

  // Tell the selected user that they were removed
  io.to(targetUser.userId).emit("participant_removed");

  // Remove user from room
  room.participants = room.participants.filter(
    (user) => user.userId !== userId
  );

  // Update everyone else
  io.to(roomId).emit("participants_updated", {
    participants: room.participants,
  });

  // Remove the socket from the Socket.IO room
  const targetSocket = io.sockets.sockets.get(userId);

  if (targetSocket) {
    targetSocket.leave(roomId);
  }
});


// ==========================================
// CHAT MESSAGE
// ==========================================

socket.on("send_message", ({ roomId, username, message }) => {
  console.log("CHAT MESSAGE RECEIVED:", username, message);

  const room = rooms[roomId];

  if (!room) {
    console.log("Chat error: Room not found:", roomId);
    return;
  }

  if (!message || !message.trim()) {
    return;
  }

  io.to(roomId).emit("receive_message", {
    username: username,
    message: message.trim(),
  });

  console.log("CHAT MESSAGE BROADCASTED TO ROOM:", roomId);
});

  // -----------------------------
  // USER DISCONNECTS
  // -----------------------------

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const roomId in rooms) {
      const room = rooms[roomId];

      const participant = room.participants.find(
        (user) => user.userId === socket.id
      );

      if (participant) {
        room.participants = room.participants.filter(
          (user) => user.userId !== socket.id
        );

        console.log(
          `${participant.username} left room ${roomId}`
        );

        // Send updated participant list
        io.to(roomId).emit("participants_updated", {
          participants: room.participants,
        });

        // Delete empty room
        if (room.participants.length === 0) {
          delete rooms[roomId];

          console.log(`Room ${roomId} deleted`);
        }
      }
    }
  });
});

// -----------------------------
// START SERVER
// -----------------------------

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});