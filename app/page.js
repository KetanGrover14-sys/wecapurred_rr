'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';

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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5EDD6' }}>

      {/* Top decorative bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1B4332, #2D6A4F, #40916C)' }} />

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/images/norrvexlabs.png" alt="Norrvex Partner" width={200} height={60}
            style={{ objectFit: 'contain', height: '52px', width: 'auto' }} priority />
          <p className="text-sm font-light tracking-widest uppercase" style={{ color: '#5A7A65', letterSpacing: '0.2em' }}>
            Partner Portal
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm rounded-3xl p-8 shadow-sm border"
          style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>

          <h2 className="text-2xl font-light mb-1" style={{ color: '#1B3A2A' }}>Welcome back</h2>
          <p className="text-sm mb-7 font-light" style={{ color: '#8BA898' }}>Sign in to your account</p>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-5 text-sm font-medium border"
              style={{ backgroundColor: '#fff0f0', borderColor: '#fcc', color: '#c0392b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: '#5A7A65' }}>Email</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all border"
                style={{
                  backgroundColor: '#F5EDD6',
                  borderColor: '#DDD3B0',
                  color: '#1B3A2A',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 300,
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#DDD3B0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: '#5A7A65' }}>Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all border pr-12"
                  style={{
                    backgroundColor: '#F5EDD6',
                    borderColor: '#DDD3B0',
                    color: '#1B3A2A',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 300,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2D6A4F'; e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#DDD3B0'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: '#8BA898' }}>
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-sm text-white transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ backgroundColor: '#2D6A4F' }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#1B4332'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#2D6A4F'; }}>
              {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-xs font-light mt-8" style={{ color: '#B8A06A' }}>
          © 2025 Norrvex Labs. All rights reserved.
        </p>
      </div>
    </div>
  );
}
