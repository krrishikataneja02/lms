import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn } from 'lucide-react';
import { toast } from '../utils/toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast(`Welcome back, ${res.user.name}!`, 'success');
      if (res.user.role === 'admin') navigate('/admin-dashboard');
      else if (res.user.role === 'faculty') navigate('/faculty-dashboard');
      else navigate('/student-dashboard');
    } else {
      toast(res.message, 'danger');
    }
  };

  const triggerDemoLogin = (role) => {
    let demoEmail = '';
    let demoPassword = '';

    if (role === 'admin') {
      demoEmail = 'admin@school.edu';
      demoPassword = 'admin123';
    } else if (role === 'faculty') {
      demoEmail = 'prof.smith@school.edu';
      demoPassword = 'faculty123';
    } else if (role === 'student') {
      demoEmail = 'alex.jones@school.edu';
      demoPassword = 'student123';
    }

    setEmail(demoEmail);
    setPassword(demoPassword);
    
    // Perform login directly
    setTimeout(async () => {
      setLoading(true);
      const res = await login(demoEmail, demoPassword);
      setLoading(false);
      if (res.success) {
        toast(`Welcome back, ${res.user.name}!`, 'success');
        if (res.user.role === 'admin') navigate('/admin-dashboard');
        else if (res.user.role === 'faculty') navigate('/faculty-dashboard');
        else navigate('/student-dashboard');
      } else {
        toast(res.message, 'danger');
      }
    }, 100);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">
              <GraduationCap style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Aegis LMS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI-Powered Educational Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="animate-fade-in">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              className="form-control" 
              placeholder="name@school.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input 
              type="password" 
              id="login-password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            <LogIn style={{ width: '18px', height: '18px' }} /> {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Request Access</Link>
          </p>
        </form>

        <div className="auth-demo-logins">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Demo Access</span>
          <div className="auth-demo-grid">
            <button className="btn-demo-login" onClick={() => triggerDemoLogin('admin')}>Super Admin</button>
            <button className="btn-demo-login" onClick={() => triggerDemoLogin('faculty')}>Faculty</button>
            <button className="btn-demo-login" onClick={() => triggerDemoLogin('student')}>Student</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
