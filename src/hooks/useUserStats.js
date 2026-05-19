// src/hooks/useUserStats.js
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
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

export function useRecentScores(limit = 5) {
  const { currentUser } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const r = ref(db, `scores/${currentUser.uid}`);
    const unsub = onValue(r, snap => {
      if (!snap.exists()) { setScores([]); setLoading(false); return; }
      const arr = [];
      snap.forEach(child => arr.push({ id: child.key, ...child.val() }));
      setScores(arr.reverse().slice(0, limit));
      setLoading(false);
    });
    return unsub;
  }, [currentUser, limit]);

  return { scores, loading };
}
