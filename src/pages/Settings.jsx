// src/pages/Settings.jsx
import { useState } from 'react';
import {
  Settings as SettingsIcon, Wifi, Database, Code, Shield,
  ChevronRight, ExternalLink, AlertTriangle, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGameSettings } from '../hooks/useUserStats';
import { saveLevel, DIFFICULTY_MAP } from '../services/dbService';
import toast from 'react-hot-toast';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-cyan-500/10">
        <Icon size={15} className="text-cyan-400" />
        <h3 className="text-sm font-600 text-slate-300 uppercase tracking-wider" style={{fontFamily:'Rajdhani',fontWeight:600}}>
          {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { currentUser } = useAuth();
  const { settings } = useGameSettings();
  const [saving, setSaving] = useState(false);

  async function handleLevelChange(e) {
    setSaving(true);
    try {
      await saveLevel(currentUser.uid, e.target.value);
      toast.success('Level updated');
    } catch { toast.error('Failed to update level'); }
    finally { setSaving(false); }
  }

  const dbPath = `https://console.firebase.google.com/project/${import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'your-project'}/database`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs text-slate-600 uppercase tracking-widest mb-1" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>Configuration</p>
        <h1 className="text-3xl font-700 text-white tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>
          <span className="neon-text">System</span> Settings
        </h1>
      </div>

      {/* Level settings */}
      <Section title="Difficulty" icon={SettingsIcon}>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
            Active Level
          </label>
          <select
            value={settings?.level ?? 'easy'}
            onChange={handleLevelChange}
            disabled={saving}
            className="input-cyber"
          >
            {Object.keys(DIFFICULTY_MAP).map(lvl => (
              <option key={lvl} value={lvl} style={{background:'#0a1520'}}>
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)} — {DIFFICULTY_MAP[lvl]}ms window
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-600 mt-1.5">
            Current difficulty: <span className="text-cyan-400">{settings?.difficulty ?? 3000}ms</span> reaction window
          </p>
        </div>
      </Section>

      {/* ESP32 Integration */}
      <Section title="ESP32 Integration" icon={Wifi}>
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Configure your ESP32 firmware with these Firebase paths:</p>

          <div className="space-y-2">
            {[
              { label: 'Read Level',         path: `gameSettings/${currentUser?.uid}/level` },
              { label: 'Read Difficulty (ms)',path: `gameSettings/${currentUser?.uid}/difficulty` },
              { label: 'Write Score',         path: `scores/${currentUser?.uid}/<gameId>/score` },
              { label: 'Write Reaction Time', path: `scores/${currentUser?.uid}/<gameId>/reactionTime` },
              { label: 'Set Online Status',   path: `gameSettings/${currentUser?.uid}/esp32Online` },
              { label: 'Set Game State',      path: `gameSettings/${currentUser?.uid}/gameState` },
            ].map(({ label, path }) => (
              <div key={label} className="flex items-start justify-between gap-3 py-2 border-b border-cyan-500/5 last:border-0">
                <span className="text-xs text-slate-500 w-32 shrink-0">{label}</span>
                <code className="text-xs text-cyan-400/80 break-all text-right" style={{fontFamily:'Share Tech Mono',fontSize:'0.62rem'}}>
                  {path}
                </code>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Arduino / ESP32 Snippet */}
      <Section title="ESP32 Code Snippet" icon={Code}>
        <p className="text-xs text-slate-500 mb-3">Add to your Arduino firmware (requires FirebaseESP32 library):</p>
        <pre className="text-xs bg-dark-700 border border-cyan-500/10 rounded-lg p-4 overflow-x-auto text-slate-400 leading-relaxed" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>
{`#include <FirebaseESP32.h>

#define USER_UID  "${currentUser?.uid ?? 'YOUR_UID_HERE'}"
#define DB_URL    "${import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'YOUR_DB_URL'}"

// Read difficulty level
int getDifficulty() {
  int val = 3000; // default
  if (Firebase.getInt(fbData,
    "/gameSettings/" + String(USER_UID) + "/difficulty"))
    val = fbData.intData();
  return val;
}

// Write score after game
void uploadScore(int score, int reactionMs, int accuracy) {
  String path = "/scores/" + String(USER_UID) + "/" + String(millis());
  Firebase.setInt(fbData, path + "/score",        score);
  Firebase.setInt(fbData, path + "/reactionTime", reactionMs);
  Firebase.setInt(fbData, path + "/accuracy",     accuracy);
}

// Announce online status
void setOnline(bool online) {
  Firebase.setBool(fbData,
    "/gameSettings/" + String(USER_UID) + "/esp32Online",
    online);
}`}
        </pre>
      </Section>

      {/* Firebase Console */}
      <Section title="Firebase Database" icon={Database}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Database URL</span>
            <code className="text-xs text-cyan-400 truncate max-w-xs" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>
              {import.meta.env.VITE_FIREBASE_DATABASE_URL ?? 'Not configured'}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Project ID</span>
            <code className="text-xs text-cyan-400" style={{fontFamily:'Share Tech Mono',fontSize:'0.65rem'}}>
              {import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-project'}
            </code>
          </div>
          <a
            href={dbPath}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cyber btn-outline-cyber px-4 py-2 rounded-lg text-sm flex items-center gap-2 w-fit mt-2"
          >
            <ExternalLink size={13} />
            Open Firebase Console
          </a>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-slate-300">Email Verification</p>
              <p className="text-xs text-slate-600">Required for full access</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${currentUser?.emailVerified ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'}`} style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
              {currentUser?.emailVerified ? 'VERIFIED' : 'PENDING'}
            </span>
          </div>

          <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/15 rounded-lg p-4">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-300 font-600" style={{fontFamily:'Rajdhani',fontWeight:600}}>Danger Zone</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">Permanently delete all your data and account. This cannot be undone.</p>
              <button className="btn-cyber text-xs px-4 py-2 rounded-lg flex items-center gap-2 text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors">
                <Trash2 size={12} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
