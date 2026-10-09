import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import MySkills from './pages/MySkills';
import SkillDetail from './pages/SkillDetail';
import SkillGraph from './pages/SkillGraph';
import SkillGaps from './pages/SkillGaps';
import Recommendations from './pages/Recommendations';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import TeamAnalysis from './pages/TeamAnalysis';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import JobLearningPath from './pages/JobLearningPath';
import Applications from './pages/Applications';
import Applicants from './pages/Applicants';
import JobManagement from './pages/JobManagement';
import CareerMarket from './pages/CareerMarket';
import CareerExplorer from './pages/CareerExplorer';
import Onboarding from './pages/Onboarding';
import Assessments from './pages/Assessments';
import AssessmentRunner from './pages/AssessmentRunner';
import Projects from './pages/Projects';
import Activity from './pages/Activity';
import AdminDashboard from './pages/AdminDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import StudentManagement from './pages/StudentManagement';
import RecruiterManagement from './pages/RecruiterManagement';
import CollegeManagement from './pages/CollegeManagement';
import InterviewPrep from './pages/InterviewPrep';
import LoadingSpinner from './components/LoadingSpinner';


// 1. Private Route Guard
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Checking security clearance..." />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 2. Public Route Guard (Redirects logged-in users away from auth forms)
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // If authenticated, redirect away from public auth pages to role dashboard
  if (isAuthenticated) {
    const userRole = user?.accountRole || user?.role;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'recruiter' || userRole === 'manager') return <Navigate to="/recruiter/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // Only display full-screen verifying spinner if there is an existing session token being checked
  // Guest visitors without stored tokens render the public interface immediately without waiting
  if (loading) {
    const hasStoredToken = typeof window !== 'undefined' &&
      !!(localStorage.getItem('skillgraph_token') || localStorage.getItem('token'));
    if (hasStoredToken) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <LoadingSpinner message="Verifying session..." />
        </div>
      );
    }
  }

  return children;
};

// 3. Manager/Admin Role Guard
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const hasAccess = allowedRoles.includes(user?.accountRole);

  React.useEffect(() => {
    if (!loading && isAuthenticated && !hasAccess) {
      toast.error('Access restricted: requires privileged role');
    }
  }, [loading, isAuthenticated, hasAccess]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Verifying authorization permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return hasAccess ? children : <Navigate to="/dashboard" replace />;
};

// 4. Role-Based Dynamic Dashboard
const RoleDashboard = () => {
  const { user } = useAuth();
  if (user?.accountRole === 'admin') {
    return <AdminDashboard />;
  }
  if (user?.accountRole === 'recruiter' || user?.accountRole === 'manager') {
    return <RecruiterDashboard />;
  }
  return <Dashboard />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '13px',
              borderRadius: '10px',
              border: '1px solid #334155',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
              padding: '10px 14px'
            }
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div className="flex items-center w-full gap-2">
                  <div className="shrink-0">{icon}</div>
                  <div className="flex-1 text-xs font-medium leading-relaxed">{message}</div>
                  {t.type !== 'loading' && (
                    <button
                      type="button"
                      onClick={() => toast.dismiss(t.id)}
                      className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Auth Pages (Redirect to dashboard if already authenticated) */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected Main App Layout Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <RoleDashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/recruiter/dashboard"
            element={
              <RoleRoute allowedRoles={['recruiter', 'manager', 'admin']}>
                <DashboardLayout>
                  <RecruiterDashboard />
                </DashboardLayout>
              </RoleRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </RoleRoute>
            }
          />

          <Route
            path="/skills"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <MySkills />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/skills/:id"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <SkillDetail />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/skill-graph"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <SkillGraph />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/skill-gaps"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <SkillGaps />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <Recommendations />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <Progress />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Profile />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Jobs />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <JobDetail />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs/:id/learning-path"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <JobLearningPath />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <Applications />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/market"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <CareerMarket />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/careers"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <CareerExplorer />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            }
          />
          <Route
            path="/assessments"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <Assessments />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/assessments/:id"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <AssessmentRunner />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <Activity />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/interview-prep"
            element={
              <RoleRoute allowedRoles={['student', 'employee']}>
                <DashboardLayout>
                  <InterviewPrep />
                </DashboardLayout>
              </RoleRoute>
            }
          />

          {/* Admin Exclusive Routes */}
          <Route
            path="/admin/students"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <StudentManagement />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/recruiters"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <RecruiterManagement />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/colleges"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <CollegeManagement />
                </DashboardLayout>
              </RoleRoute>
            }
          />

          {/* Recruiter & Admin Operations Routes */}
          <Route
            path="/team"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <DashboardLayout>
                  <TeamAnalysis />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <RoleRoute allowedRoles={['admin', 'recruiter', 'manager']}>
                <DashboardLayout>
                  <JobManagement />
                </DashboardLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/admin/applicants"
            element={
              <RoleRoute allowedRoles={['admin', 'recruiter', 'manager']}>
                <DashboardLayout>
                  <Applicants />
                </DashboardLayout>
              </RoleRoute>
            }
          />


          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
