// src/hooks/useUserStats.js
import { useState, useEffect } from 'react';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useUserStats() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const r = ref(db, `users/${currentUser.uid}`);
    const unsub = onValue(r, snap => {
      setStats(snap.exists() ? snap.val() : null);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return { stats, loading };
}

// src/hooks/useGameSettings.js — inline below for single file
export function useGameSettings() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const r = ref(db, `gameSettings/${currentUser.uid}`);
    const unsub = onValue(r, snap => {
      setSettings(snap.exists() ? snap.val() : null);
    });
    return unsub;
  }, [currentUser]);

  return { settings };
}

// Returns last `limit` scores, newest first
// Reads ALL children (Firebase push-key order = insertion order)
export function useRecentScores(limit = 10) {
  const { currentUser } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const r = ref(db, `scores/${currentUser.uid}`);
    const unsub = onValue(r, snap => {
      if (!snap.exists()) { setScores([]); setLoading(false); return; }
      const arr = [];
      snap.forEach(child => {
        const val = child.val();
        if (val && typeof val === 'object') {
          arr.push({ id: child.key, ...val });
        }
      });
      // Firebase push keys are already in insertion order (oldest first)
      // Reverse to get newest first, then take limit
      setScores(arr.reverse().slice(0, limit));
      setLoading(false);
    });
    return unsub;
  }, [currentUser, limit]);

  return { scores, loading };
}

// Fetches ALL scores sorted oldest→newest for the progress chart.
// Uses Firebase push-key natural order (no timestamp sort needed —
// avoids issues with ESP32's millis() timestamp which resets on reboot).
export function useAllScores() {
  const { currentUser } = useAuth();
  const [allScores, setAllScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const r = ref(db, `scores/${currentUser.uid}`);
    const unsub = onValue(r, snap => {
      if (!snap.exists()) { setAllScores([]); setLoading(false); return; }
      const arr = [];
      snap.forEach(child => {
        const val = child.val();
        if (val && typeof val === 'object') {
          arr.push({ id: child.key, ...val });
        }
      });
      // Push keys are already chronological (oldest first) — no sort needed.
      // Assign sequential game numbers for chart x-axis.
      setAllScores(arr.map((g, i) => ({ ...g, gameNum: i + 1 })));
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return { allScores, loading };
}

// ── Firebase push-key → unix timestamp decoder ──────────────────────────────
// Firebase push keys encode a 48-bit unix timestamp (ms) in their first 8 chars.
// This lets us know WHEN a score was uploaded without the ESP32 needing to write
// an esp32Online flag — works even with unmodified ESP32 firmware.
const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
function pushKeyToMs(key) {
  if (!key || key.length < 8) return null;
  let ms = 0;
  for (let i = 0; i < 8; i++) {
    const idx = PUSH_CHARS.indexOf(key[i]);
    if (idx === -1) return null;
    ms = ms * 64 + idx;
  }
  return ms;
}

function formatLastSeen(ms) {
  if (!ms) return null;
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60)  return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Smart ESP32 status — combines the esp32Online flag with push-key-decoded
// activity detection. Works even before the ESP32 is reflashed with the fix.
export function useEsp32Status() {
  const { currentUser } = useAuth();
  const [isOnline,     setIsOnline]     = useState(false);
  const [lastActiveMs, setLastActiveMs] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Watch the esp32Online flag (set by ESP32 after applying the Arduino fix below)
    const onlineRef  = ref(db, `gameSettings/${currentUser.uid}/esp32Online`);
    const unsubOnline = onValue(onlineRef, snap => setIsOnline(snap.val() ?? false));

    // 2. Watch the latest score's push key — decode when the last game was uploaded
    const latestRef  = query(ref(db, `scores/${currentUser.uid}`), limitToLast(1));
    const unsubScore = onValue(latestRef, snap => {
      if (!snap.exists()) return;
      let lastKey = null;
      snap.forEach(child => { lastKey = child.key; });
      const ms = pushKeyToMs(lastKey);
      if (ms) setLastActiveMs(ms);
    });

    return () => { unsubOnline(); unsubScore(); };
  }, [currentUser]);

  const msSince        = lastActiveMs ? Date.now() - lastActiveMs : null;
  // "Recently active" = a score was uploaded within the last 15 minutes
  const recentlyActive = msSince !== null && msSince < 15 * 60 * 1000;
  const lastSeenLabel  = formatLastSeen(lastActiveMs);
  // Effective online = flag is true OR score uploaded in last 2 minutes (mid-session)
  const effectiveOnline = isOnline || (msSince !== null && msSince < 2 * 60 * 1000);

  return { isOnline, effectiveOnline, recentlyActive, lastActiveMs, lastSeenLabel, msSince };
}
