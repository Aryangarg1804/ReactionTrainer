// src/pages/Signup.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleChange(e) {
    setForm(v => ({ ...v, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('All fields are required'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name);
      setSuccess(true);
      toast.success('Account created! Check your email for verification.');
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password too weak',
      };
      setError(msgs[err.code] ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Account created via Google!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') toast.error('Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center p-4">
        <div className="glass-card p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-700 text-white mb-2 uppercase tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>
            Registration Complete
          </h2>
          <p className="text-slate-400 text-sm mb-2">
            A verification link was sent to <span className="text-cyan-400">{form.email}</span>
          </p>
          <p className="text-slate-600 text-xs mb-6">Verify your email to unlock all features</p>
          <Link
            to="/login"
            className="btn-cyber btn-primary w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 scanlines pointer-events-none opacity-40" />
      <div className="fixed top-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-600/3 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 shadow-xl shadow-cyan-500/20 mb-4">
            <Zap size={26} className="text-dark-900" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-700 text-white tracking-wider uppercase" style={{fontFamily:'Rajdhani',fontWeight:700}}>
            Create <span className="neon-text">Account</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1" style={{fontFamily:'Share Tech Mono',fontSize:'0.7rem'}}>
            JOIN THE REACTION TRAINER
          </p>
        </div>

        <div className="glass-card p-7">
          <div className="mb-6">
            <h2 className="text-lg font-700 text-slate-200 uppercase tracking-wide" style={{fontFamily:'Rajdhani',fontWeight:700}}>
              New Operator
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">Register to track your reaction training</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="btn-cyber btn-outline-cyber w-full py-2.5 rounded-lg flex items-center justify-center gap-2 mb-5 text-sm"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-cyan-500/10" />
            <span className="text-xs text-slate-600" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>OR</span>
            <div className="flex-1 h-px bg-cyan-500/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name:'name', label:'Display Name', type:'text', icon:User, placeholder:'Operator Zero' },
              { name:'email', label:'Email', type:'email', icon:Mail, placeholder:'operator@example.com' },
              { name:'password', label:'Password', type:'password', icon:Lock, placeholder:'••••••••' },
              { name:'confirm', label:'Confirm Password', type:'password', icon:Lock, placeholder:'••••••••' },
            ].map(({ name, label, type, icon: Icon, placeholder }) => (
              <div key={name}>
                <label className="block text-xs text-slate-500 mb-1.5 uppercase tracking-wider" style={{fontFamily:'Share Tech Mono',fontSize:'0.6rem'}}>
                  {label}
                </label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="input-cyber pl-9"
                  />
                </div>
              </div>
            ))}

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                <span className="text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-cyber btn-primary w-full py-3 rounded-lg font-700 text-sm flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                : <><Zap size={15} strokeWidth={2.5} /> Create Account</>
              }
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-5">
            Already registered?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
