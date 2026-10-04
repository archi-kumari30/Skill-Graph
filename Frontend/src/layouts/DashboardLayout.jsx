import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AIAssistant from '../components/AIAssistant';
import api from '../services/api';
import {
  Network,
  LayoutDashboard,
  Award,
  Compass,
  TrendingUp,
  User,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Briefcase,
  BookOpen,
  CheckCircle2,
  FolderGit2,
  Flame,
  CalendarCheck,
  Target,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [commandData, setCommandData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchQuickSummary = async () => {
      try {
        const res = await api.get('/dashboard/command-center');
        if (isMounted && res?.data) {
          setCommandData(res.data);
        }
      } catch (err) {
        // Silently fail if not logged in or network hiccup
      }
    };
    fetchQuickSummary();
    return () => { isMounted = false; };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      label: 'Explore',
      items: [
        { name: 'Career Paths', path: '/careers', icon: Compass },
        { name: 'Skill Graph', path: '/skill-graph', icon: Network },
        { name: 'Job Market', path: '/jobs', icon: Briefcase },
        { name: 'Market Trends', path: '/market', icon: TrendingUp }
      ]
    },
    {
      label: 'My Growth',
      items: [
        { name: 'My Skills', path: '/skills', icon: Award },
        { name: 'Learning Roadmap', path: '/progress', icon: BookOpen },
        { name: 'Assessments', path: '/assessments', icon: CheckCircle2, badge: 'Tests' },
        { name: 'Study Activity', path: '/activity', icon: CalendarCheck }
      ]
    },
    {
      label: 'Readiness & Portfolio',
      items: [
        { name: 'Skill Gaps', path: '/skill-gaps', icon: Target },
        { name: 'Project Evidence', path: '/projects', icon: FolderGit2 },
        { name: 'Career Profile', path: '/profile', icon: User }
      ]
    }
  ];

  if (user?.accountRole === 'admin' || user?.accountRole === 'manager') {
    navGroups.push({
      label: 'Management',
      items: [
        { name: 'Team Analysis', path: '/team', icon: Users }
      ]
    });
  }

  const readinessScore = commandData?.readiness?.score ?? commandData?.quickStats?.readinessScore ?? null;
  const streakDays = commandData?.quickStats?.streakDays ?? 0;
  const targetRoleName = commandData?.user?.targetRole?.name || user?.targetRoleId?.name || 'Not Selected';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Floating global AI assistant drawer */}
      <AIAssistant />

      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 w-full h-16 bg-white/90 backdrop-blur-md z-30 border-b border-zinc-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex justify-between items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="flex items-center space-x-2.5 text-zinc-900 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Network className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight leading-none text-zinc-900">SkillGraph</span>
                <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">Career Engine</span>
              </div>
            </Link>

            {/* Target Role Pill (Desktop) */}
            <div className="hidden md:flex items-center space-x-2 bg-zinc-100/80 border border-zinc-200/80 rounded-full px-3 py-1 text-xs">
              <span className="text-zinc-500 font-medium">Target:</span>
              <Link to="/careers" className="font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 group">
                {targetRoleName}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics & User Dropdown */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Streak Badge */}
            {streakDays > 0 && (
              <Link
                to="/activity"
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
                title={`${streakDays} Day Practice Streak`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{streakDays}d</span>
              </Link>
            )}

            {/* Career Readiness Score Badge */}
            {readinessScore !== null && (
              <Link
                to="/skill-gaps"
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  readinessScore >= 75
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    : readinessScore >= 40
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
                title="Career Readiness Score"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{readinessScore}% Ready</span>
              </Link>
            )}

            {/* Quick Action Button */}
            <Link
              to="/assessments"
              className="hidden lg:flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shadow-indigo-200"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Skills</span>
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-zinc-800 leading-none mb-0.5">{user?.name}</p>
                  <p className="text-[10px] text-zinc-400 capitalize leading-none">{user?.accountRole || 'Member'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-2 z-50 animate-in fade-in duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-xs font-bold text-zinc-900">{user?.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <User className="w-4 h-4 mr-2.5 text-zinc-400" />
                    Career Profile
                  </Link>
                  <Link
                    to="/projects"
                    className="flex items-center px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <FolderGit2 className="w-4 h-4 mr-2.5 text-zinc-400" />
                    Project Evidence
                  </Link>
                  <Link
                    to="/activity"
                    className="flex items-center px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    <CalendarCheck className="w-4 h-4 mr-2.5 text-zinc-400" />
                    Study Activity Log
                  </Link>
                  <div className="my-1 border-t border-zinc-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Categorized Secondary Bar */}
        <div className="hidden lg:block bg-[#FAF9F6] border-b border-zinc-200/70">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-x-auto no-scrollbar py-1.5">
            <div className="flex items-center space-x-1">
              {[
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Career Paths', path: '/careers' },
                { name: 'Skill Graph', path: '/skill-graph' },
                { name: 'My Skills', path: '/skills' },
                { name: 'Skill Gaps', path: '/skill-gaps' },
                { name: 'Learning Roadmap', path: '/progress' },
                { name: 'Assessments', path: '/assessments' },
                { name: 'Project Evidence', path: '/projects' },
                { name: 'Study Activity', path: '/activity' },
                { name: 'Job Market', path: '/jobs' },
                { name: 'Profile', path: '/profile' }
              ].map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-150">
          <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Network className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-zinc-900">SkillGraph</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4.5 h-4.5" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-zinc-100 bg-zinc-50">
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center justify-center py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-sm font-bold text-rose-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
