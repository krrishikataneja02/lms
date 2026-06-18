import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Sun, Moon, Bell } from 'lucide-react';

const Header = ({ onToggleSidebar, title, onShowModal }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('aegis_theme') || 'dark');
  const [hasUnread, setHasUnread] = useState(false);

  // Apply theme class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Simulate unread notification on load
  useEffect(() => {
    if (user && user.role === 'student') {
      const timer = setTimeout(() => {
        setHasUnread(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('aegis_theme', nextTheme);
  };

  const handleNotificationsClick = () => {
    setHasUnread(false);
    
    let alertsHtml = '';
    if (user.role === 'student') {
      alertsHtml = `
        <div style="font-size: 0.9rem; display:flex; flex-direction:column; gap:0.75rem;">
          <div style="padding:0.75rem; border-radius:12px; background:var(--color-warning-bg); border:1px solid var(--color-warning); color:var(--color-warning);">
            <strong>⏰ AUTO DEADLINE ALARM</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">"CS-101: Binary Search Implementation" is due in 3 days. Prepare your coding submissions!</p>
          </div>
          <div style="padding:0.75rem; border-radius:12px; background:var(--color-info-bg); border:1px solid var(--color-info); color:var(--color-info);">
            <strong>📢 Syllabus Material Uploaded</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">Prof. Smith uploaded "graph_theory_primer.pdf" into CS-202 Chapter 2.</p>
          </div>
        </div>
      `;
    } else if (user.role === 'faculty') {
      alertsHtml = `
        <div style="font-size: 0.9rem; display:flex; flex-direction:column; gap:0.75rem;">
          <div style="padding:0.75rem; border-radius:12px; background:var(--color-warning-bg); border:1px solid var(--color-warning); color:var(--color-warning);">
            <strong>📌 Grading Submission Alerts</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">Student Alex Jones submitted homework files for CS-101 Binary Search.</p>
          </div>
        </div>
      `;
    } else {
      alertsHtml = `
        <div style="font-size: 0.9rem; display:flex; flex-direction:column; gap:0.75rem;">
          <div style="padding:0.75rem; border-radius:12px; background:var(--color-success-bg); border:1px solid var(--color-success); color:var(--color-success);">
            <strong>✨ Aegis Platform Status</strong>
            <p style="margin-top:0.25rem; font-size:0.85rem;">All database modules online. MongoDB synchronizations complete.</p>
          </div>
        </div>
      `;
    }

    onShowModal({
      title: 'System Notifications Hub',
      body: <div dangerouslySetInnerHTML={{ __html: alertsHtml }} />,
      footer: (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onShowModal(null)}>
          Mark all as read
        </button>
      )
    });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="sidebar-toggle-btn" onClick={onToggleSidebar}>
          <Menu style={{ width: '22px', height: '22px' }} />
        </button>
        <h2 style={{ fontSize: '1.35rem' }}>{title}</h2>
      </div>
      <div className="header-right">
        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? (
            <Sun style={{ width: '22px', height: '22px' }} />
          ) : (
            <Moon style={{ width: '22px', height: '22px' }} />
          )}
        </button>
        
        {/* Notifications bell */}
        <div className="header-notifications">
          <button className="notification-bell" onClick={handleNotificationsClick} title="System Notifications">
            <Bell style={{ width: '22px', height: '22px' }} />
            {hasUnread && <span className="notification-dot"></span>}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
