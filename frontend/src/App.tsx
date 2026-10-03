import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("https://youtube-watch-party-sttg.onrender.com");

interface Participant {
  userId: string;
  username: string;
  role: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");

  const [inRoom, setInRoom] = useState(false);
  const [myRole, setMyRole] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [videoId, setVideoId] = useState("PrCSLs1YHtA");
  const [chatMessage, setChatMessage] = useState("");

const [chatMessages, setChatMessages] = useState<
  { username: string; message: string }[]
>([]);

  const playerRef = useRef<any>(null);
  const pendingRoomStateRef = useRef<any>(null);

  // ==========================================
// READ ROOM ID FROM URL
// ==========================================

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sharedRoom = params.get("room");

  if (sharedRoom) {
    setRoomId(sharedRoom.toUpperCase());
  }
}, []);

  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {
    socket.on("room_created", (data) => {
      setRoomId(data.roomId);
      setMyRole(data.role);
      setInRoom(true);
    });

    socket.on("join_success", (data) => {
      setRoomId(data.roomId);
      setMyRole(data.role);
      setInRoom(true);
    });

    socket.on("participants_updated", (data) => {
 

  setParticipants(data.participants);

  // Find my own participant information
  const me = data.participants.find(
    (participant: Participant) => participant.userId === socket.id
  );

  if (me) {
    setMyRole(me.role);
  }
});

    // Receive Play command from another user
socket.on("remote_play", () => {

  if (playerRef.current) {
    playerRef.current.mute();
    playerRef.current.playVideo();
  }
});

// Receive Pause command from another user
socket.on("remote_pause", () => {

  if (playerRef.current) {
    playerRef.current.pauseVideo();
  }
});

socket.on("remote_seek", ({ currentTime }) => {
 
  if (playerRef.current) {
    playerRef.current.seekTo(currentTime, true);
  }
});

socket.on("remote_change_video", ({ videoId }) => {
 

  if (playerRef.current) {
    playerRef.current.loadVideoById(videoId);
  }

  setVideoId(videoId);
});

socket.on("participant_removed", () => {
 

  setInRoom(false);
  setMyRole("");
  setParticipants([]);
  setMessage("You were removed from the room.");
});

socket.on("room_state", (data) => {
 
  setVideoId(data.videoId);

  pendingRoomStateRef.current = data;

});

socket.on("receive_message", (data) => {

  setChatMessages((previousMessages) => [
    ...previousMessages,
    {
      username: data.username,
      message: data.message,
    },
  ]);
});

    socket.on("error_message", (data) => {
      setMessage(data.message);
    });

    return () => {
  socket.off("room_created");
  socket.off("join_success");
  socket.off("participants_updated");
  socket.off("remote_play");
  socket.off("remote_pause");
  socket.off("remote_seek");
  socket.off("remote_change_video");
  socket.off("participant_removed");
  socket.off("room_state");
  socket.off("receive_message");
  socket.off("error_message");
};
  }, []);

  // ==========================================
  // LOAD YOUTUBE PLAYER
  // ==========================================

  useEffect(() => {
    // Don't create the player until we are inside a room
    if (!inRoom) {
      return;
    }

    const createPlayer = () => {
      const playerElement = document.getElementById("youtube-player");

      if (!playerElement) {
        
        return;
      }

      if (playerRef.current) {
        return;
      }

      playerRef.current = new window.YT.Player("youtube-player", {
        height: "450",
        width: "100%",
        videoId: videoId,

        playerVars: {
          playsinline: 1,
        },

        events: {
        onReady: (event: any) => {
  playerRef.current = event.target;

  const pendingState = pendingRoomStateRef.current;

  if (pendingState) {
    playerRef.current.loadVideoById(pendingState.videoId);

    setTimeout(() => {
      if (!playerRef.current) return;

      playerRef.current.seekTo(
        pendingState.currentTime,
        true
      );

      if (pendingState.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }

      pendingRoomStateRef.current = null;
    }, 1000);
  }
},

          onStateChange: () => {
},
        },
      });
    };

    // If YouTube API is already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    // Load YouTube API
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");

      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;

      document.body.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = createPlayer;

    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, [inRoom]);

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const createRoom = () => {
    if (!username.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    const newRoomId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    socket.emit("create_room", {
      roomId: newRoomId,
      username: username,
    });
  };

  // ==========================================
  // JOIN ROOM
  // ==========================================

  const joinRoom = () => {
    if (!username.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!roomId.trim()) {
      setMessage("Please enter a Room ID.");
      return;
    }

    socket.emit("join_room", {
      roomId: roomId.toUpperCase(),
      username: username,
    });
  };

  // ==========================================
// SEND CHAT MESSAGE
// ==========================================

const sendChatMessage = () => {
  if (!chatMessage.trim()) {
    return;
  }

  socket.emit("send_message", {
    roomId,
    username,
    message: chatMessage.trim(),
  });

  setChatMessage("");
};

  // ==========================================
  // PLAY
  // ==========================================

  const playVideo = () => {

  if (playerRef.current) {
    playerRef.current.playVideo();
  }

  const currentTime = playerRef.current
  ? playerRef.current.getCurrentTime()
  : 0;

socket.emit("play_video", {
  roomId: roomId,
  currentTime: currentTime,
});


};

  // ==========================================
  // PAUSE
  // ==========================================

 const pauseVideo = () => {
  console.log("Current Room ID:", roomId);
  console.log("My Role:", myRole);

  const currentTime = playerRef.current
    ? playerRef.current.getCurrentTime()
    : 0;

  if (playerRef.current) {
    playerRef.current.pauseVideo();
  }

  socket.emit("pause_video", {
    roomId: roomId,
    currentTime: currentTime,
  });

  
};

  // ==========================================
  // CHANGE VIDEO
  // ==========================================

  const changeVideo = () => {
  if (!videoId.trim()) {
    return;
  }


  // Change video for Host
  if (playerRef.current) {
    playerRef.current.loadVideoById(videoId);
  }

  // Tell backend
  socket.emit("change_video", {
    roomId: roomId,
    videoId: videoId,
  });

};
  // ==========================================
  // seek video
  // ==========================================

  const seekVideo = () => {
  if (!playerRef.current) {
    return;
  }

  const currentTime = playerRef.current.getCurrentTime();


  playerRef.current.seekTo(currentTime, true);

  socket.emit("seek_video", {
    roomId: roomId,
    currentTime: currentTime,
  });

  
};

// ==========================================
// MAKE MODERATOR
// ==========================================

const makeModerator = (userId: string) => {

  socket.emit("assign_role", {
    roomId: roomId,
    userId: userId,
    role: "Moderator",
  });
};

// ==========================================
// REMOVE PARTICIPANT
// ==========================================

const removeParticipant = (userId: string) => {

  socket.emit("remove_participant", {
    roomId: roomId,
    userId: userId,
  });
};

// ==========================================
// COPY ROOM LINK
// ==========================================

const copyRoomLink = () => {
  const roomLink = `${window.location.origin}/?room=${roomId}`;

  navigator.clipboard.writeText(roomLink);

  setMessage("Room link copied!");
  
  setTimeout(() => {
    setMessage("");
  }, 2000);
};

  // ==========================================
  // WATCH ROOM
  // ==========================================

  if (inRoom) {
    return (
      <div className="room-page">

        <header className="room-header">

          <div>
            <h1>🎬 YouTube Watch Party</h1>

            <p>
              Room ID: <strong>{roomId}</strong>
            </p>

            <button onClick={copyRoomLink}>
              📋 Copy Room Link
            </button>
          </div>

          <div className="role-badge">
            {myRole}
          </div>

        </header>

        <div className="room-content">

          {/* VIDEO */}

          <main className="video-section">

            <div className="youtube-container">
              <div id="youtube-player"></div>
            </div>

            <div className="video-controls">

              <button
                onClick={playVideo}
                disabled={myRole === "Participant"}
              >
                ▶ Play
              </button>

              <button
                onClick={pauseVideo}
                disabled={myRole === "Participant"}
              >
                ⏸ Pause
              </button>

              <button
                 onClick={seekVideo}
                 disabled={myRole === "Participant"}
>
                  Sync Position
              </button>

              <input
                type="text"
                placeholder="Enter YouTube Video ID"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                disabled={myRole === "Participant"}
              />

              <button
                onClick={changeVideo}
                disabled={myRole === "Participant"}
              >
                Change Video
              </button>

            </div>

          </main>

          {/* PARTICIPANTS */}

          <aside className="participants-section">

            <h2>
              👥 Participants ({participants.length})
            </h2>

            {participants.map((participant) => (
  <div
    className="participant"
    key={participant.userId}
  >

    <div>
      👤 {participant.username}
    </div>

    <span>
      {participant.role}
    </span>

    {myRole === "Host" &&
  participant.userId !== socket.id && (
    <div className="participant-actions">
      {participant.role === "Participant" && (
        <button
          onClick={() =>
            makeModerator(participant.userId)
          }
        >
          ⭐ Make Moderator
        </button>
      )}

      <button
        onClick={() =>
          removeParticipant(participant.userId)
        }
      >
        🚫 Remove
      </button>
    </div>
  )}

  </div>

            ))}

            {/* CHAT */}

<div className="chat-section">
  <h3>💬 Room Chat</h3>

  <div className="chat-messages">
    {chatMessages.length === 0 ? (
      <p>No messages yet.</p>
    ) : (
      chatMessages.map((chat, index) => (
        <div key={index} className="chat-message">
          <strong>{chat.username}</strong>
          <span>{chat.message}</span>
        </div>
      ))
    )}
  </div>

  <div className="chat-input">
    <input
      type="text"
      placeholder="Type a message..."
      value={chatMessage}
      onChange={(e) => setChatMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendChatMessage();
        }
      }}
    />

    <button onClick={sendChatMessage}>
      Send
    </button>
  </div>
</div>

          </aside>

        </div>

      </div>
    );
  }

  // ==========================================
  // HOME PAGE
  // ==========================================

  return (
    <div className="app">

      <div className="container">

        <h1>🎬 YouTube Watch Party</h1>

        <p className="subtitle">
          Watch YouTube videos together in real time.
        </p>

        <div className="form-section">

          <label>Your Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

        </div>

        <div className="buttons">

          <button onClick={createRoom}>
            Create Watch Party
          </button>

        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="form-section">

          <label>Room ID</label>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) =>
              setRoomId(e.target.value.toUpperCase())
            }
          />

        </div>

        <div className="buttons">

          <button onClick={joinRoom}>
            Join Watch Party
          </button>

        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>

    </div>
  );
}

export default App;

