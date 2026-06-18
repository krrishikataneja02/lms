import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, UserPlus } from 'lucide-react';
import { toast } from '../utils/toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    const res = await register(name, email, role, password);
    setLoading(false);

    if (res.success) {
      toast('Registration request approved! You can now sign in.', 'success');
      navigate('/login');
    } else {
      toast(res.message, 'danger');
    }
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
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input 
              type="text" 
              id="reg-name" 
              className="form-control" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input 
              type="email" 
              id="reg-email" 
              className="form-control" 
              placeholder="name@school.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-role">I am a...</label>
            <select 
              id="reg-role" 
              className="form-control" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input 
              type="password" 
              id="reg-password" 
              className="form-control" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            <UserPlus style={{ width: '18px', height: '18px' }} /> {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
