import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('welcome123');
  
  // Delete selection
  const [deleteEmail, setDeleteEmail] = useState('');
  
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      const data = await apiCall('/auth/users');
      setUsers(data);
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      await apiCall('/auth/users', {
        method: 'POST',
        body: { name, email, role, password }
      });
      toast(`Account created successfully for ${name}!`, 'success');
      setShowAddModal(false);
      
      // Reset inputs
      setName('');
      setEmail('');
      setRole('student');
      setPassword('welcome123');
      
      fetchUsers();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteEmail) return;

    try {
      await apiCall(`/auth/users/${deleteEmail}`, {
        method: 'DELETE'
      });
      toast(`Deleted ${deleteEmail} and all associated records.`, 'success');
      setShowDeleteModal(false);
      setDeleteEmail('');
      fetchUsers();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const getInitials = (n) => {
    return n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ height: '100%' }}>
      <div className="panel-header">
        <div>
          <h3>System User Database</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Add, monitor, or remove platform accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus style={{ width: '16px', height: '16px' }} /> Add Account
        </button>
      </div>
      <div className="panel-content">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Email Address</th>
                <th>User Role</th>
                <th>Default Password</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', border: 'none', backgroundColor: 'var(--bg-hover)' }}>
                        {getInitials(u.name)}
                      </div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'faculty' ? 'badge-warning' : 'badge-primary'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td><code>{u.password ? 'welcome123' : '••••••••'}</code></td>
                  <td style={{ textAlign: 'right' }}>
                    {u.email.toLowerCase() === currentUser.email.toLowerCase() ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingRight: '12px' }}>Active Session</span>
                    ) : (
                      <button className="btn btn-danger btn-sm" onClick={() => { setDeleteEmail(u.email); setShowDeleteModal(true); }}>
                        <Trash2 style={{ width: '14px', height: '14px' }} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal 
        show={showAddModal} 
        title="Register New Account" 
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddUser}>Register User</button>
          </>
        }
      >
        <form onSubmit={handleAddUser}>
          <div className="form-group">
            <label className="form-label" htmlFor="add-user-name">Full Name</label>
            <input 
              type="text" 
              id="add-user-name" 
              className="form-control" 
              placeholder="E.g. Dr. John Watson" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-user-email">Email Address</label>
            <input 
              type="email" 
              id="add-user-email" 
              className="form-control" 
              placeholder="j.watson@school.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-user-role">Account Privilege</label>
            <select 
              id="add-user-role" 
              className="form-control" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-user-password">Assigned Password</label>
            <input 
              type="text" 
              id="add-user-password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        title="Delete Account Confirmation"
        onClose={() => setShowDeleteModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Abort</button>
            <button className="btn btn-danger" onClick={handleDeleteUser}>Permanently Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete user <strong>{deleteEmail}</strong>?</p>
        <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 500 }}>
          <AlertTriangle style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline' }} /> 
          Warning: This will delete all student enrollments, assignment uploads, grades, and quiz results permanently.
        </p>
      </Modal>
    </div>
  );
};

export default AdminUsers;
