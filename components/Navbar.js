'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, ShieldCheck } from 'lucide-react';
import Brand from './Brand';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router           = useRouter();

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#cce2e6' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-h-20 py-2">

          {/* Logo */}
          <button onClick={() => router.push('/dashboard')}
            aria-label="Apollo Pharmacy x Norrvex Labs - dashboard" className="shrink-0 flex items-center gap-2.5 active:opacity-70 transition-opacity">
            <Brand compact />
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/repository')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: '#fff4ce', color: '#005f73' }}>
                Repository
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ backgroundColor: '#fff4ce', color: '#005f73' }}>
                  <ShieldCheck size={13} /> Admin Panel
                </button>
              )}
              <div className="hidden sm:block text-right mr-1">
                <p className="text-xs font-semibold leading-tight" style={{ color: '#123f49' }}>
                  {user.name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs capitalize" style={{ color: '#446b74', fontWeight: 300 }}>
                  {user.role || 'Vendor'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: user.role === 'admin' ? '#fff4ce' : '#d8f3e6' }}>
                <span className="font-semibold text-sm" style={{ color: '#005f73' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <button onClick={() => { logout(); router.replace('/'); }}
                className="p-2 rounded-xl transition-colors hover:bg-red-50 hover:text-red-600"
                style={{ color: '#577982' }}
                title="Sign out">
                <LogOut size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
