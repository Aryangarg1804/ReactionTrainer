// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { ref, set, get, remove, serverTimestamp } from 'firebase/database';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Create user record in Realtime DB ──────────────────────────────────────
  async function createUserProfile(uid, data) {
    const userRef   = ref(db, `users/${uid}`);
    const settRef   = ref(db, `gameSettings/${uid}`);

    await set(userRef, {
      name:         data.name ?? 'Operator',
      email:        data.email,
      photoURL:     data.photoURL ?? null,
      bestScore:    0,
      bestReaction: 0,
      accuracy:     0,
      totalGames:   0,
      currentLevel: 'easy',
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    });

    await set(settRef, {
      level:      'easy',
      difficulty: 3000,
      esp32Online: false,
      gameState:  'idle',
      updatedAt:  serverTimestamp(),
    });
  }

  async function syncActiveUser(uid) {
    await set(ref(db, 'activeUser'), { uid });
  }

  // ── Fetch user profile from DB ─────────────────────────────────────────────
  async function fetchUserProfile(uid) {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) setUserProfile(snap.val());
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    await createUserProfile(cred.user.uid, { name: displayName, email });
    await syncActiveUser(cred.user.uid);
    return cred;
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password).then(async (cred) => {
      await syncActiveUser(cred.user.uid);
      return cred;
    });
  }

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncActiveUser(cred.user.uid);
    // Create profile only if first-time user
    const snap = await get(ref(db, `users/${cred.user.uid}`));
    if (!snap.exists()) {
      await createUserProfile(cred.user.uid, {
        name:     cred.user.displayName,
        email:    cred.user.email,
        photoURL: cred.user.photoURL,
      });
    }
    return cred;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  function logout() {
    setUserProfile(null);
    return remove(ref(db, 'activeUser')).then(() => signOut(auth));
  }

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncActiveUser(user.uid);
        await fetchUserProfile(user.uid);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
