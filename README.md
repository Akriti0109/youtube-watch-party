# 🎬 YouTube Watch Party

A real-time collaborative YouTube watching platform where multiple users can join the same room and watch videos together. Playback actions such as play, pause, seek, and video changes are synchronized across all users in the room.

The application uses **React + TypeScript** for the frontend and **Node.js + Express + Socket.IO** for real-time communication.

---

## 🚀 Features

### 🎥 Synchronized Video Playback

* Play videos together in real time.
* Pause videos for everyone in the room.
* Synchronize the current playback position.
* Change the YouTube video for all participants.
* Uses the YouTube IFrame Player API.

### 🏠 Room System

* Create a unique watch-party room.
* Join an existing room using a Room ID.
* Share rooms using a unique room link.
* Automatically detect the Room ID from a shared URL.

### 👥 User Roles

The application supports three roles:

| Role           | Permissions                |
| -------------- | -------------------------- |
| 👑 Host        | Full control over the room |
| ⭐ Moderator    | Playback and video control |
| 👤 Participant | Watch-only access          |

#### Host

The Host can:

* Play/Pause videos
* Synchronize playback position
* Change videos
* Promote Participants to Moderator
* Remove participants
* Share the room link

#### Moderator

The Moderator can:

* Play/Pause videos
* Synchronize playback position
* Change videos

#### Participant

Participants can:

* Watch the synchronized video
* View other participants
* Use room chat

Participants cannot control playback or change the video.

---

## 💬 Real-Time Room Chat

Users can communicate with each other using the built-in room chat.

Messages are sent through Socket.IO and broadcast to all users currently inside the room.

---

## 🔄 Real-Time Synchronization

The application uses **WebSockets through Socket.IO** to synchronize actions between users.

For example:

```text
Host
  │
  │ Play Video
  ▼
Backend / Socket.IO
  │
  │ Broadcast Event
  ▼
All Participants
  │
  ▼
Video Plays
```

The same mechanism is used for:

* Play
* Pause
* Seek
* Change Video
* Participant updates
* Role updates
* Chat messages

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       Browser       │
                    │   React + TypeScript│
                    └──────────┬──────────┘
                               │
                               │ Socket.IO
                               ▼
                    ┌─────────────────────┐
                    │       Backend       │
                    │ Node.js + Express   │
                    │     + Socket.IO     │
                    └──────────┬──────────┘
                               │
                     Room State Management
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Active Rooms     │
                    │  Users + Video     │
                    │  Roles + Playback  │
                    └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* CSS
* YouTube IFrame Player API
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* CORS

### Development Tools

* Visual Studio Code
* Git
* GitHub
* npm

---

## 📁 Project Structure

```text
youtube-watch-party/
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Then enter the project folder:

```bash
cd youtube-watch-party
```

---

### 2. Start the Backend

Open a terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
node server.js
```

The backend should run on:

```text
http://localhost:5000
```

You should see:

```text
Server running on http://localhost:5000
```

---

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## ▶️ How to Use

### Create a Watch Party

1. Open the application.
2. Enter your name.
3. Click **Create Watch Party**.
4. A unique Room ID is generated.
5. The creator becomes the **Host**.

### Join a Watch Party

1. Enter your name.
2. Enter the Room ID.
3. Click **Join Watch Party**.
4. You join as a **Participant**.

Alternatively, the Host can use **Copy Room Link** and share the generated link.

---

## 🎮 Playback Synchronization

When a Host or Moderator performs an action:

```text
User Action
     ↓
React Frontend
     ↓
Socket.IO Event
     ↓
Node.js Backend
     ↓
Permission Validation
     ↓
Room State Updated
     ↓
Socket.IO Broadcast
     ↓
Other Users
     ↓
YouTube Player Updated
```

The backend validates the user's role before processing playback-control events.

This prevents unauthorized Participants from controlling the shared video.

---

## 🔌 Socket.IO Events

The application uses the following real-time events:

| Event                  | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `create_room`          | Creates a new room                             |
| `join_room`            | Joins an existing room                         |
| `room_created`         | Notifies the creator that the room was created |
| `join_success`         | Confirms successful room joining               |
| `room_state`           | Sends current video/playback state             |
| `play_video`           | Requests video playback                        |
| `pause_video`          | Requests video pause                           |
| `seek_video`           | Synchronizes playback position                 |
| `change_video`         | Changes the current YouTube video              |
| `remote_play`          | Broadcasts play action                         |
| `remote_pause`         | Broadcasts pause action                        |
| `remote_seek`          | Broadcasts seek position                       |
| `remote_change_video`  | Broadcasts video change                        |
| `assign_role`          | Assigns Moderator role                         |
| `remove_participant`   | Removes a participant                          |
| `participants_updated` | Updates participant list                       |
| `send_message`         | Sends a chat message                           |
| `receive_message`      | Receives a chat message                        |
| `participant_removed`  | Notifies a removed user                        |

---

## 🔐 Role-Based Permission System

The backend verifies permissions before processing important actions.

For example:

```text
Participant
     │
     │ Attempt to change video
     ▼
Backend
     │
     │ Check Role
     ▼
Participant ❌
     │
     ▼
Request Rejected
```

Whereas:

```text
Host / Moderator
       │
       │ Change Video
       ▼
    Backend
       │
       │ Permission Valid
       ▼
 Room State Updated
       │
       ▼
 Other Users Updated
```

This provides server-side protection instead of relying only on disabled frontend buttons.

---

## 📸 Screenshots



### Home Page

<img width="1046" height="838" alt="Home page" src="https://github.com/user-attachments/assets/31e5495f-fcbe-4f00-adac-006c7bafd747" />


### Watch Party Room

<img width="1822" height="857" alt="Host" src="https://github.com/user-attachments/assets/ca915963-d001-4ad0-9482-d2f4b1ee1edc" />


### Participant & Role Management

<img width="438" height="382" alt="Participants" src="https://github.com/user-attachments/assets/c037e827-6451-4996-9f27-6e62ededb847" />


### Real-Time Chat

<img width="417" height="458" alt="chat" src="https://github.com/user-attachments/assets/4fcd791e-a227-4734-acf8-a627bbae9b62" />


---

## 🌐 Live Demo

**Live Application:**
`https://youtube-watch-party-o7ro-h83d200zb-akriti0109.vercel.app`

**Backend:**
`https://youtube-watch-party-sttg.onrender.com`

> Deployment URLs will be added after deploying the frontend and backend.

---

## 🔮 Future Enhancements

Possible future improvements include:

* Persistent room storage
* User authentication
* Host transfer
* Persistent chat history
* Emoji reactions
* Redis-based room synchronization
* Room expiration
* Better mobile responsiveness
* Video thumbnails and Now Playing information
* Participant requests for playback changes

---

## 🎯 Project Objective

The main objective of this project is to develop a real-time collaborative video-watching platform using WebSocket communication.

The project demonstrates:

* Real-time communication
* Client-server architecture
* WebSocket-based synchronization
* Role-based authorization
* Room management
* API integ
