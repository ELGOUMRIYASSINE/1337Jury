// 42Nexus - Layout Component
// This file is for: FATYZA (Frontend Developer)
// Description: Main layout with sidebar navigation

import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/resources', label: 'Resources', icon: '📚' },
  { path: '/votes', label: 'Votes', icon: '🗳️' },
  { path: '/disputes', label: 'Disputes', icon: '⚡' },
  { path: '/tests', label: 'Tests', icon: '🧪' },
];

function Layout() {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-42-dark border-r border-gray-700">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-42-teal">42Nexus</h1>
          <p className="text-sm text-gray-400">Python Common Core</p>
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-42-teal text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {user?.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{user?.login}</p>
              <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
