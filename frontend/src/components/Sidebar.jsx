import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  BarChart3, 
  Users, 
  BookOpen, 
  Settings, 
  Home, 
  FolderOpen, 
  FileText, 
  CheckSquare, 
  Calendar, 
  Edit3, 
  Award, 
  MessageSquare,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isActive }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const sidebarMenus = {
    admin: [
      { label: 'Overview Dashboard', path: '/admin-dashboard', icon: BarChart3 },
      { label: 'Manage Users', path: '/admin-users', icon: Users },
      { label: 'Manage Courses', path: '/admin-courses', icon: BookOpen },
      { label: 'System Settings', path: '/admin-settings', icon: Settings }
    ],
    faculty: [
      { label: 'Faculty Dashboard', path: '/faculty-dashboard', icon: Home },
      { label: 'Course Materials', path: '/faculty-courses', icon: FolderOpen },
      { label: 'Assignments Hub', path: '/faculty-assignments', icon: FileText },
      { label: 'Quiz Builder', path: '/faculty-quizzes', icon: CheckSquare },
      { label: 'Attendance logs', path: '/faculty-attendance', icon: Calendar }
    ],
    student: [
      { label: 'Student Dashboard', path: '/student-dashboard', icon: Home },
      { label: 'My Enrolled Courses', path: '/student-courses', icon: BookOpen },
      { label: 'Assignments Center', path: '/student-assignments', icon: Edit3 },
      { label: 'Quiz Arena', path: '/student-quizzes', icon: Award },
      { label: 'AI Tutor Chat', path: '/student-ai-tutor', icon: MessageSquare, glow: true }
    ]
  };

  const menuItems = sidebarMenus[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';
  };

  return (
    <aside className={`app-sidebar ${isActive ? 'active' : ''}`} id="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">
          <GraduationCap style={{ width: '22px', height: '22px' }} />
        </div>
        <span class="logo-text">AEGIS LMS</span>
      </div>

      {/* Profile Info */}
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebar-user-avatar">
          {getInitials(user.name)}
        </div>
        <div class="user-info">
          <span class="user-name" id="sidebar-user-name">{user.name}</span>
          <span class="user-role-badge" id="sidebar-user-role">
            {user.role === 'admin' ? 'Super Admin' : user.role === 'faculty' ? 'Faculty Member' : 'Student'}
          </span>
        </div>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={index} className="sidebar-menu-item">
              <NavLink 
                to={item.path}
                className={({ isActive }) => isActive ? 'active' : ''}
                style={item.glow ? {
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  background: 'rgba(99, 102, 241, 0.08)',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.1)'
                } : {}}
              >
                <Icon style={{ width: '18px', height: '18px' }} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
          <LogOut style={{ width: '16px', height: '16px' }} /> Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
