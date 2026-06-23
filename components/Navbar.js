'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LogOut, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router           = useRouter();

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#FEFAF0', borderColor: '#DDD3B0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
            <Image src="/images/norrvexlabs.png" alt="Norrvex Partner" width={130} height={36}
              style={{ objectFit: 'contain', height: '32px', width: 'auto' }} priority />
          </button>

          {user && (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ backgroundColor: '#EDE0C0', color: '#1B4332' }}>
                  <ShieldCheck size={13} /> Admin Panel
                </button>
              )}
              <div className="hidden sm:block text-right mr-1">
                <p className="text-xs font-semibold leading-tight" style={{ color: '#1B3A2A' }}>
                  {user.name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs capitalize" style={{ color: '#5A7A65', fontWeight: 300 }}>
                  {user.role || 'Vendor'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: user.role === 'admin' ? '#EDE0C0' : '#d8f3e6' }}>
                <span className="font-semibold text-sm" style={{ color: '#1B4332' }}>
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <button onClick={() => { logout(); router.replace('/'); }}
                className="p-2 rounded-xl transition-colors hover:bg-red-50 hover:text-red-600"
                style={{ color: '#8BA898' }}
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
