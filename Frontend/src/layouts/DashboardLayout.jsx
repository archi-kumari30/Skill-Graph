import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';
import {
  Network,
  LayoutDashboard,
  Award,
  Compass,
  TrendingUp,
  Lightbulb,
  User,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Briefcase,
  BookOpen
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Skills', path: '/skills', icon: Award },
    { name: 'Skill Graph', path: '/skill-graph', icon: Network },
    { name: 'Career Explorer', path: '/careers', icon: Compass },
    { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { name: 'Learning', path: '/progress', icon: BookOpen },
    { name: 'Job Matches', path: '/jobs', icon: Briefcase },
    { name: 'Career Market', path: '/market', icon: TrendingUp },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Floating global SkillGraph AI drawer widget */}
      <AIAssistant />

      {/* Top Navbar */}
      <header className="sticky top-0 w-full h-16 bg-white/70 backdrop-blur-md z-30 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
          
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2 text-slate-800">
              <Network className="w-6 h-6 text-indigo-650" />
              <span className="text-base font-black tracking-tight">SkillGraph</span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                      isActive 
                        ? 'text-indigo-650 bg-indigo-50/50' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-650 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions: Profile, Logout */}
          <div className="hidden lg:flex items-center space-x-5">

            {/* User Profile Info */}
            <Link
              to="/profile"
              className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left shrink-0">
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-none mb-0.5">
                  {user?.name}
                </p>
                <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider leading-none">
                  {user?.accountRole === 'employee' ? 'Student' : user?.accountRole}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full border border-transparent hover:border-rose-100 text-rose-500 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Hamburger Mobile Trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-650 hover:bg-slate-50"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-150">
          <div className="h-16 px-6 border-b border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-indigo-600" />
              <span className="text-base font-extrabold text-slate-800">SkillGraph</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-655 hover:bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-6 py-8 flex flex-col space-y-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center justify-center py-3 bg-rose-50 hover:bg-rose-100 border border-rose-250/50 rounded-xl text-sm font-bold text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
