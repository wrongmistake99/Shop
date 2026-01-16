import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleMenuClick = (path) => {
    if (window.innerWidth < 768) toggleSidebar();
    navigate(path);
  };

  const handleLogoClick = () => {
    if (window.innerWidth < 768) toggleSidebar();
    navigate('/dashboard'); // ← Changed from '/' to '/dashboard'
  };

  return (
    <aside
      className={`bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 w-64 min-h-screen flex flex-col fixed inset-y-0 left-0 z-30 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition duration-300 ease-in-out shadow-lg border-r border-gray-200 dark:border-gray-700`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogoClick}
          className="flex items-center space-x-3 focus:outline-none"
        >
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-bold">J</span>
          </div>
          <span className="text-base font-bold text-blue-600 dark:text-blue-400">JurisonShop</span>
        </button>

        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {[
          { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }, // ← Changed to '/dashboard'
          { path: '/inventory', label: 'Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { path: '/transactions', label: 'Transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { path: '/records', label: 'Records', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { path: '/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => handleMenuClick(item.path)}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive(item.path)
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                isActive(item.path) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Motorcycle Parts
          </p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
            Inventory System
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;