'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/chat', label: 'Chat', icon: 'chat' },
    { href: '/plan', label: 'Plan', icon: 'calendar' },
    { href: '/analysis', label: 'Analysis', icon: 'chart' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'chat':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">✨</span>
            </div>
            <span className="text-xl font-light text-slate-700">Mindful</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                      }`}
                    >
                      {getIcon(item.icon)}
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            
            {/* Auth Section */}
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600 hidden sm:inline">
                    Hello, {user.email?.split('@')[0] || 'there'}
                  </span>
                  <div className="relative group">
                    <button className="w-8 h-8 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </button>
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/auth/sign-in"
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}