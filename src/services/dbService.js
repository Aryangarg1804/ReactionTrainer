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

// Reverse map: ms → level name (matches ESP32 output)
const DIFF_TO_LEVEL = { 3000: 'easy', 2000: 'medium', 1500: 'hard', 1000: 'extreme' };

/**
 * Compute advanced stats (avgScore, per-level breakdown) from a user's full score
 * history and persist them to /users/{uid} so the Leaderboard can rank by them.
 * Called client-side for the current user only (scores of other users are private).
 */
export async function syncUserAdvancedStats(uid, allScores) {
  if (!uid || !allScores || allScores.length === 0) return;

  // ── Overall stats ────────────────────────────────────────────────────────
  const scores    = allScores.map(g => g.score ?? 0);
  const reactions = allScores.map(g => g.averageReaction).filter(v => v > 0);
  const accs      = allScores.map(g => g.accuracy ?? 0);

  const avgScore    = scores.reduce((a, b) => a + b, 0)    / scores.length;
  const avgReaction = reactions.length
    ? reactions.reduce((a, b) => a + b, 0) / reactions.length
    : 0;
  const avgAccuracy = accs.reduce((a, b) => a + b, 0) / accs.length;

  // ── Per-level stats ──────────────────────────────────────────────────────
  const LEVELS = ['easy', 'medium', 'hard', 'extreme'];
  const levelStats = {};
  for (const level of LEVELS) {
    const games = allScores.filter(g => {
      const lvl = g.level ?? DIFF_TO_LEVEL[g.difficulty];
      return lvl === level;
    });
    if (games.length === 0) continue;

    const lvlScores    = games.map(g => g.score ?? 0);
    const lvlReactions = games.map(g => g.averageReaction).filter(v => v > 0);
    const lvlAccs      = games.map(g => g.accuracy ?? 0);

    levelStats[level] = {
      games:       games.length,
      avgScore:    Math.round((lvlScores.reduce((a, b) => a + b, 0) / lvlScores.length) * 10) / 10,
      bestScore:   Math.max(...lvlScores),
      avgReaction: lvlReactions.length
        ? Math.round(lvlReactions.reduce((a, b) => a + b, 0) / lvlReactions.length)
        : 0,
      avgAccuracy: Math.round((lvlAccs.reduce((a, b) => a + b, 0) / lvlAccs.length) * 10) / 10,
    };
  }

  await update(ref(db, `users/${uid}`), {
    avgScore:       Math.round(avgScore    * 10) / 10,
    avgReaction:    Math.round(avgReaction),
    avgAccuracy:    Math.round(avgAccuracy * 10) / 10,
    levelStats,
    statsUpdatedAt: serverTimestamp(),
  });
}


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
