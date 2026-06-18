import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Book, BookOpen } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form fields
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructorEmail, setInstructorEmail] = useState('');

  const fetchData = async () => {
    try {
      const coursesData = await apiCall('/courses');
      const usersData = await apiCall('/auth/users');
      
      setCourses(coursesData);
      const facultyUsers = usersData.filter(u => u.role === 'faculty');
      setFaculty(facultyUsers);
      if (facultyUsers.length > 0) {
        setInstructorEmail(facultyUsers[0].email);
      }
      
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!code || !title || !description || !instructorEmail) return;

    try {
      await apiCall('/courses', {
        method: 'POST',
        body: { code, title, description, instructorEmail }
      });
      toast(`Course "${title}" successfully registered!`, 'success');
      setShowAddModal(false);
      
      // Reset
      setCode('');
      setTitle('');
      setDescription('');
      
      fetchData();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const getInitials = (n) => {
    return n ? n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Course Registries...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ marginBottom: '2rem' }}>
      <div className="panel-header">
        <div>
          <h3>Course Registry Database</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Create academic modules and assign class instructors.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus style={{ width: '16px', height: '16px' }} /> Add New Course
        </button>
      </div>
      <div className="panel-content">
        <div className="courses-grid">
          {courses.map((c, i) => (
            <div className="glass-panel course-card" key={i}>
              <div className={`course-banner ${c.code.includes('202') ? 'accent' : ''}`}>
                <span className="course-code">{c.code}</span>
              </div>
              <div className="course-body">
                <h4 className="course-title">{c.title}</h4>
                <p className="course-desc">{c.description}</p>
                <div className="course-meta">
                  <div className="course-instructor">
                    <div className="avatar-placeholder">{getInitials(c.instructorName)}</div>
                    <span>{c.instructorName}</span>
                  </div>
                  <span><strong>{c.studentsEnrolled.length}</strong> Students</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal
        show={showAddModal}
        title="Create Academic Course"
        onClose={() => setShowAddModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddCourse}>Register Course</button>
          </>
        }
      >
        {faculty.length === 0 ? (
          <p style={{ color: 'var(--color-danger)' }}>Cannot create a course. Register at least one Faculty member first.</p>
        ) : (
          <form onSubmit={handleAddCourse}>
            <div className="form-group">
              <label className="form-label" htmlFor="add-course-code">Display Course Code</label>
              <input 
                type="text" 
                id="add-course-code" 
                className="form-control" 
                placeholder="E.g. CS-101" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-course-title">Course Title</label>
              <input 
                type="text" 
                id="add-course-title" 
                className="form-control" 
                placeholder="Intro to Programming" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-course-instructor">Assign Instructor</label>
              <select 
                id="add-course-instructor" 
                className="form-control" 
                value={instructorEmail}
                onChange={(e) => setInstructorEmail(e.target.value)}
                required
              >
                {faculty.map((f, index) => (
                  <option key={index} value={f.email}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-course-desc">Course Description</label>
              <textarea 
                id="add-course-desc" 
                className="form-control" 
                style={{ height: '100px' }} 
                placeholder="Outline the curriculum details here..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminCourses;
