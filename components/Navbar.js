'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Camera, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router           = useRouter();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <div className="bg-primary-500 rounded-xl p-1.5">
              <Camera size={18} className="text-white" />
            </div>
            <span className="text-lg font-black text-primary-500 tracking-tight">Norrvex Partner</span>
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right mr-1">
                <p className="text-xs font-semibold text-gray-700 leading-tight">{user.name || user.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-400">Employee</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <button onClick={() => { logout(); router.replace('/'); }}
                className="p-2 text-gray-400 hover:text-red-500 active:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
