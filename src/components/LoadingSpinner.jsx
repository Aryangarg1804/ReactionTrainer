// src/components/LoadingSpinner.jsx
import { Zap } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-900 flex flex-col items-center justify-center z-50 page-bg">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-500/10 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={20} className="text-cyan-400" />
          </div>
        </div>
        <p className="mt-4 text-slate-500 text-sm tracking-widest uppercase" style={{fontFamily:'Share Tech Mono',fontSize:'0.7rem'}}>
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500/10 border-t-cyan-400 animate-spin" />
    </div>
  );
}
