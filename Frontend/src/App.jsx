import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import CareerMarket from './pages/CareerMarket';
import CareerExplorer from './pages/CareerExplorer';
import Onboarding from './pages/Onboarding';
import Assessments from './pages/Assessments';
import AssessmentRunner from './pages/AssessmentRunner';
import Projects from './pages/Projects';
import Activity from './pages/Activity';
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
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
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

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }
          }}
        />
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
                  <Dashboard />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <MySkills />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/skills/:id"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <SkillDetail />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/skill-graph"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <SkillGraph />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/skill-gaps"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <SkillGaps />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Recommendations />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Progress />
                </DashboardLayout>
              </PrivateRoute>
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
              <PrivateRoute>
                <DashboardLayout>
                  <CareerExplorer />
                </DashboardLayout>
              </PrivateRoute>
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
              <PrivateRoute>
                <DashboardLayout>
                  <Assessments />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/assessments/:id"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <AssessmentRunner />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Activity />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          {/* restricted Manager/Admin Routes */}
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

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
