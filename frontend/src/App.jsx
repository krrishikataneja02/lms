import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

// Common Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Modal from './components/Modal';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminSettings from './pages/AdminSettings';

// Faculty Pages
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyCourses from './pages/FacultyCourses';
import FacultyAssignments from './pages/FacultyAssignments';
import FacultyQuizzes from './pages/FacultyQuizzes';
import FacultyAttendance from './pages/FacultyAttendance';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentAssignments from './pages/StudentAssignments';
import StudentQuizzes from './pages/StudentQuizzes';
import StudentAiTutor from './pages/StudentAiTutor';

// Private Route gate keeper
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Checking Session Credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to default dashboard
    const redirects = {
      admin: '/admin-dashboard',
      faculty: '/faculty-dashboard',
      student: '/student-dashboard'
    };
    return <Navigate to={redirects[user.role]} replace />;
  }

  return children;
};

// Main layout wrapper
const LayoutWrapper = ({ children, title }) => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const [activeModalData, setActiveModalData] = useState(null);

  return (
    <div className="app-container">
      <Sidebar isActive={sidebarActive} />
      <main className="app-content">
        <Header 
          onToggleSidebar={() => setSidebarActive(!sidebarActive)} 
          title={title} 
          onShowModal={(data) => setActiveModalData(data)}
        />
        <div className="main-view-container">
          {children}
        </div>
      </main>

      {/* Global notifications modal */}
      {activeModalData && (
        <Modal
          show={!!activeModalData}
          title={activeModalData.title}
          onClose={() => setActiveModalData(null)}
          footer={activeModalData.footer}
        >
          {activeModalData.body}
        </Modal>
      )}
    </div>
  );
};

const AppContent = () => {
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  // Listen to custom toast events
  useEffect(() => {
    const handleToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now() + Math.random().toString();
      
      setToasts(prev => [...prev, { id, message, type }]);

      // Auto clear after 4.5s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };

    window.addEventListener('aegis-toast', handleToast);
    return () => window.removeEventListener('aegis-toast', handleToast);
  }, []);

  const handleRemoveToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastIcon = (type) => {
    const style = { width: '18px', height: '18px', marginRight: '0.25rem' };
    if (type === 'success') return <CheckCircle style={style} />;
    if (type === 'warning') return <AlertTriangle style={style} />;
    if (type === 'danger') return <AlertCircle style={style} />;
    return <Info style={style} />;
  };

  return (
    <>
      {/* Toast Notifications */}
      <div className="notification-toast-container">
        {toasts.map(t => (
          <div className={`notification-toast toast-${t.type} animate-fade-in`} key={t.id}>
            {getToastIcon(t.type)}
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{t.message}</p>
            </div>
            <button className="notification-toast-close" onClick={() => handleRemoveToast(t.id)}>&times;</button>
          </div>
        ))}
      </div>

      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Super Admin Private Routes */}
        <Route path="/admin-dashboard" element={
          <PrivateRoute allowedRoles={['admin']}>
            <LayoutWrapper title="Institution Overview & Analytics"><AdminDashboard /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/admin-users" element={
          <PrivateRoute allowedRoles={['admin']}>
            <LayoutWrapper title="Faculty & Student Database"><AdminUsers /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/admin-courses" element={
          <PrivateRoute allowedRoles={['admin']}>
            <LayoutWrapper title="Global Course Registry"><AdminCourses /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/admin-settings" element={
          <PrivateRoute allowedRoles={['admin']}>
            <LayoutWrapper title="System Settings & Keys"><AdminSettings /></LayoutWrapper>
          </PrivateRoute>
        } />

        {/* Faculty Private Routes */}
        <Route path="/faculty-dashboard" element={
          <PrivateRoute allowedRoles={['faculty']}>
            <LayoutWrapper title="Faculty Hub Dashboard"><FacultyDashboard /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/faculty-courses" element={
          <PrivateRoute allowedRoles={['faculty']}>
            <LayoutWrapper title="Course Materials"><FacultyCourses /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/faculty-assignments" element={
          <PrivateRoute allowedRoles={['faculty']}>
            <LayoutWrapper title="Assignment Grading Center"><FacultyAssignments /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/faculty-quizzes" element={
          <PrivateRoute allowedRoles={['faculty']}>
            <LayoutWrapper title="Quiz Management Builder"><FacultyQuizzes /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/faculty-attendance" element={
          <PrivateRoute allowedRoles={['faculty']}>
            <LayoutWrapper title="Course Attendance Tracker"><FacultyAttendance /></LayoutWrapper>
          </PrivateRoute>
        } />

        {/* Student Private Routes */}
        <Route path="/student-dashboard" element={
          <PrivateRoute allowedRoles={['student']}>
            <LayoutWrapper title="Student Center Dashboard"><StudentDashboard /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/student-courses" element={
          <PrivateRoute allowedRoles={['student']}>
            <LayoutWrapper title="My Interactive Courses"><StudentCourses /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/student-assignments" element={
          <PrivateRoute allowedRoles={['student']}>
            <LayoutWrapper title="Assignment Submissions"><StudentAssignments /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/student-quizzes" element={
          <PrivateRoute allowedRoles={['student']}>
            <LayoutWrapper title="Quiz Assessment Arena"><StudentQuizzes /></LayoutWrapper>
          </PrivateRoute>
        } />
        <Route path="/student-ai-tutor" element={
          <PrivateRoute allowedRoles={['student']}>
            <LayoutWrapper title="Aegis AI Tutor Workspace"><StudentAiTutor /></LayoutWrapper>
          </PrivateRoute>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
