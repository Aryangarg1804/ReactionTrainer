# ⚡ Reaction Trainer — ESP32 Gaming Hub

A full-stack IoT reaction training application built with React + Vite + Tailwind CSS + Firebase, designed to sync with an ESP32 hardware device over WiFi.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Get values from: [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps → Web App

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Enable Firebase Services
In Firebase Console, enable:
- **Authentication** → Email/Password + Google provider
- **Realtime Database** → Start in test mode, then apply `database.rules.json`

### 4. Start Dev Server
```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── GameHistory.jsx    # Recent scores table
│   ├── Layout.jsx         # Sidebar wrapper
│   ├── LevelSelector.jsx  # Difficulty buttons
│   ├── LoadingSpinner.jsx # Full-screen & inline spinner
│   ├── Sidebar.jsx        # Navigation + ESP32 status
│   └── StatCard.jsx       # Dashboard stat cards
├── context/
│   └── AuthContext.jsx    # Firebase auth provider
├── hooks/
│   └── useUserStats.js    # Live Firebase subscriptions
├── pages/
│   ├── Dashboard.jsx      # Main hub
│   ├── Leaderboard.jsx    # Global rankings
│   ├── Login.jsx          # Auth page
│   ├── Profile.jsx        # User profile + edit
│   ├── Settings.jsx       # App + ESP32 config
│   └── Signup.jsx         # Registration
├── routes/
│   └── ProtectedRoute.jsx # Auth guard
├── services/
│   └── dbService.js       # All Firebase DB helpers
├── firebase.js            # Firebase app init
├── App.jsx                # Router + layout
└── main.jsx               # Entry point
```

---

## 🗄️ Firebase Database Structure

```
/users/{uid}/
  name, email, photoURL
  bestScore, bestReaction, accuracy
  totalGames, currentLevel
  createdAt, updatedAt

/gameSettings/{uid}/
  level            ← ESP32 reads this
  difficulty       ← ms value (1000–3000)
  esp32Online      ← ESP32 writes true/false
  gameState        ← "idle" | "playing" | "finished"
  updatedAt

/scores/{uid}/{gameId}/
  score, reactionTime, accuracy
  hits, misses, level, timestamp

/esp32Data/{uid}/latest/
  score, reactionTime, accuracy, timestamp
```

---

## 🔌 ESP32 Integration

### Required Libraries
- `FirebaseESP32` by Mobizt
- `WiFi.h` (built-in)

### Key Firebase Paths for ESP32

| Action | Path |
|--------|------|
| Read level | `gameSettings/{UID}/level` |
| Read difficulty (ms) | `gameSettings/{UID}/difficulty` |
| Set online status | `gameSettings/{UID}/esp32Online` |
| Set game state | `gameSettings/{UID}/gameState` |
| Write score | `scores/{UID}/{timestamp}/score` |
| Write reaction time | `scores/{UID}/{timestamp}/reactionTime` |

### Example ESP32 Firmware Sketch
See Settings page in the app for a full code snippet with your UID pre-filled.

---

## 🎮 Difficulty Levels

| Level   | Reaction Window |
|---------|----------------|
| Easy    | 3000ms         |
| Medium  | 2000ms         |
| Hard    | 1500ms         |
| Extreme | 1000ms         |

---

## 🏗️ Build for Production

```bash
npm run build
npm run preview
```

---

## 🔒 Security

Apply `database.rules.json` to your Firebase Realtime Database for proper access control:
- Users can only read/write their own data
- ESP32 can write to `esp32Data` node
- Leaderboard is readable by all authenticated users

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3 + custom cyberpunk design system
- **Auth**: Firebase Authentication (Email/Password + Google)
- **Database**: Firebase Realtime Database
- **Routing**: React Router DOM v6
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Fonts**: Rajdhani + Exo 2 + Share Tech Mono (Google Fonts)
