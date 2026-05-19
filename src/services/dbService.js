// src/services/dbService.js
// Firebase Realtime Database helper functions for Reaction Trainer
// ─────────────────────────────────────────────────────────────────

import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
} from 'firebase/database';
import { db } from '../firebase';

// ── LEVEL DIFFICULTY MAP ────────────────────────────────────────────────────
export const DIFFICULTY_MAP = {
  easy:    3000,
  medium:  2000,
  hard:    1500,
  extreme: 1000,
};

// ── LEVEL ───────────────────────────────────────────────────────────────────

/** Save user's selected difficulty level — ESP32 reads this node */
export async function saveLevel(uid, level) {
  const diff = DIFFICULTY_MAP[level] ?? 3000;
  await update(ref(db, `gameSettings/${uid}`), {
    level,
    difficulty: diff,
    updatedAt: serverTimestamp(),
  });
  await update(ref(db, `users/${uid}`), {
    currentLevel: level,
    updatedAt: serverTimestamp(),
  });
}

/** Get current game settings for a user */
export async function getGameSettings(uid) {
  const snap = await get(ref(db, `gameSettings/${uid}`));
  return snap.exists() ? snap.val() : null;
}

// ── SCORES ──────────────────────────────────────────────────────────────────

/** Save a completed game result to scores node */
export async function saveGameScore(uid, gameData) {
  const scoresRef = ref(db, `scores/${uid}`);
  const newRef = push(scoresRef);
  await set(newRef, {
    score:        gameData.score ?? 0,
    reactionTime: gameData.reactionTime ?? 0,
    accuracy:     gameData.accuracy ?? 0,
    level:        gameData.level ?? 'easy',
    hits:         gameData.hits ?? 0,
    misses:       gameData.misses ?? 0,
    timestamp:    serverTimestamp(),
  });

  // Update user stats
  const userSnap = await get(ref(db, `users/${uid}`));
  if (userSnap.exists()) {
    const u = userSnap.val();
    const totalGames = (u.totalGames ?? 0) + 1;
    const bestScore  = Math.max(u.bestScore ?? 0, gameData.score ?? 0);
    const bestReact  = u.bestReaction === 0
      ? gameData.reactionTime
      : Math.min(u.bestReaction, gameData.reactionTime ?? 9999);
    const accuracy   = Math.round(
      ((u.accuracy ?? 0) * (totalGames - 1) + (gameData.accuracy ?? 0)) / totalGames
    );

    await update(ref(db, `users/${uid}`), {
      bestScore,
      bestReaction: bestReact,
      accuracy,
      totalGames,
      updatedAt: serverTimestamp(),
    });
  }
}

/** Get last N game scores for a user */
export async function getRecentScores(uid, limit = 10) {
  const q = query(
    ref(db, `scores/${uid}`),
    orderByChild('timestamp'),
    limitToLast(limit)
  );
  const snap = await get(q);
  if (!snap.exists()) return [];
  const games = [];
  snap.forEach(child => games.push({ id: child.key, ...child.val() }));
  return games.reverse();
}

// ── LEADERBOARD ──────────────────────────────────────────────────────────────

/** Fetch top players by bestScore */
export async function getLeaderboard(limit = 20) {
  const q = query(
    ref(db, 'users'),
    orderByChild('bestScore'),
    limitToLast(limit)
  );
  const snap = await get(q);
  if (!snap.exists()) return [];
  const players = [];
  snap.forEach(child => players.push({ uid: child.key, ...child.val() }));
  return players.sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));
}

// ── ESP32 LIVE STATE ────────────────────────────────────────────────────────

/** Subscribe to ESP32 online status — returns unsubscribe fn */
export function subscribeEsp32Status(uid, callback) {
  const r = ref(db, `gameSettings/${uid}/esp32Online`);
  return onValue(r, snap => callback(snap.val() ?? false));
}

/** Subscribe to live game state */
export function subscribeGameState(uid, callback) {
  const r = ref(db, `gameSettings/${uid}/gameState`);
  return onValue(r, snap => callback(snap.val() ?? 'idle'));
}

/** ESP32 writes score via this helper (mirrors ESP32 Firebase write path) */
export async function esp32WriteScore(uid, payload) {
  // ESP32 writes to: esp32Data/{uid}/latest
  await set(ref(db, `esp32Data/${uid}/latest`), {
    ...payload,
    timestamp: serverTimestamp(),
  });
}

// ── USER PROFILE ─────────────────────────────────────────────────────────────

export async function updateUserProfile(uid, data) {
  await update(ref(db, `users/${uid}`), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
}
