import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Upload,
  FileText,
  Trophy,
  ClipboardList,
  Menu,
  X,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin, isAccountant } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen for global toggle event (dispatched from Navbar)
  useEffect(() => {
    const handler = () => setIsMobileMenuOpen((prev) => !prev);
    window.addEventListener('toggleSidebar', handler);
    return () => window.removeEventListener('toggleSidebar', handler);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape and lock scroll when open (mobile)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/leads', icon: ClipboardList, label: 'All Leads' },
    { to: '/admin/upload', icon: Upload, label: 'Upload Leads' },
    { to: '/admin/salespeople', icon: Users, label: 'Manage Team' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/admin/profile', icon: Settings, label: 'Account Settings' }
  ];

  const salespersonLinks = [
    { to: '/salesperson', icon: Trophy, label: 'Leaderboard' },
    { to: '/salesperson/leads', icon: ClipboardList, label: 'My Leads' }
  ];

  const superAdminLinks = [
    { to: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/super-admin/companies', icon: Users, label: 'Companies' }, // Reusing Users icon or change to Building if available
  ];

  let links = [];
  if (useAuth().isSuperAdmin) {
    links = superAdminLinks;
  } else if (isAdmin || isAccountant) {
    links = adminLinks;
  } else {
    links = salespersonLinks;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static left-0 z-40
        top-16 bottom-0 md:inset-y-0
        w-64 bg-white shadow-lg min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 md:p-6">
          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ backgroundColor: isActive ? 'var(--color-primary-600)' : undefined }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
