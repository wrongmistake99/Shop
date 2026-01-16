import React, { useState, useEffect } from 'react';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  
  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState('light');

  // === STEP 1: Load saved theme from localStorage on mount ===
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // Default to system if no saved preference
      setTheme('system');
    }
  }, []);

  // === STEP 2: Apply theme to <html> and save to localStorage whenever theme changes ===
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // Save preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // === STEP 3: Listen to system changes ONLY when in 'system' mode ===
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <div className="p-4 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and shop preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-5">
        <div className="flex gap-1 p-1.5">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === 'account'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === 'shop'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Shop
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === 'appearance'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Appearance
          </button>
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'account' && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Account Settings</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">Update your personal information and password</p>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue="Admin User"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  defaultValue="admin"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                    <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                    <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          // ... shop tab unchanged (same as before)
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Shop Information</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">Manage your motorcycle shop details</p>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Shop Name</label>
                <input type="text" defaultValue="Jurison Shop" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input type="text" defaultValue="123 Main Street, Quezon City" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input type="text" defaultValue="+63 912 345 6789" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input type="email" defaultValue="contact@jurisonshop.com" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md transition flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Appearance</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-5">Customize how the application looks</p>

            <div className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Theme</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === 'light'}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Light</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Dark</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={theme === 'system'}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-4 h-4 text-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">System</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  System uses your device's preferred color scheme.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Preview</h3>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 space-y-3">
                  <div className="h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                  <div className="h-6 bg-white dark:bg-gray-800 rounded shadow-sm"></div>
                  <div className="h-6 bg-blue-50 dark:bg-gray-900 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;