import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/lists', label: 'Email Lists', icon: '📋' },
  { to: '/subscribers', label: 'Subscribers', icon: '👥' },
  { to: '/segments', label: 'Segments', icon: '🏷️' },
  { to: '/templates', label: 'Templates', icon: '📝' },
  { to: '/campaigns', label: 'Campaigns', icon: '📧' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary-700">Email Marketing</h1>
          <p className="text-xs text-gray-500 mt-1">AWS SES Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
