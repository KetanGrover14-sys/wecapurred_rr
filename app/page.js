'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { Eye, EyeOff, Loader2, Camera, Image, FileText, Share2 } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router          = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { if (user) router.replace('/dashboard'); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
      } else {
        login(data);
        router.replace('/dashboard');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const features = [
    { icon: Camera,    label: 'Capture Photos' },
    { icon: FileText,  label: 'Add Specs'       },
    { icon: Image,     label: 'Build Gallery'   },
    { icon: Share2,    label: 'Export PPT'      },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Brand header strip */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-500 to-red-400 text-white px-6 pt-14 pb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4 shadow-lg">
          <Camera size={30} className="text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tight">Norrvex Partner</h1>
        <p className="text-red-100 mt-1 text-base">Banner &amp; Hoarding Solutions</p>

        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-xs font-medium">
              <Icon size={12} /> {label}
            </div>
          ))}
        </div>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-start justify-center px-4 -mt-5">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-7 pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-gray-50 text-base"
                placeholder="you@company.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-gray-50 pr-12 text-base"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-70 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-red-200 mt-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 py-6">© 2025 Norrvex Partner. All rights reserved.</p>
    </div>
  );
}
