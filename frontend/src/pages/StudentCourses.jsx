import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Search, Book, FileText, Download, AlertCircle } from 'lucide-react';
import { toast } from '../utils/toast';
import confetti from 'canvas-confetti';

const StudentCourses = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [catalog, setCatalog] = useState([]);
  
  // Router subtabs: 'my-courses', 'browse-catalog'
  const [activeTab, setActiveTab] = useState('my-courses');
  const [activeCourseId, setActiveCourseId] = useState(null);

  const fetchData = async () => {
    try {
      const enrolledData = await apiCall('/courses');
      const catalogData = await apiCall('/courses/catalog');
      
      setMyCourses(enrolledData);
      setCatalog(catalogData);
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnrollCourse = async (courseId) => {
    try {
      await apiCall(`/courses/${courseId}/enroll`, {
        method: 'POST',
        body: { studentId: user.id }
      });
      toast('Successfully enrolled in course!', 'success');
      
      // Confetti celebration
      if (typeof confetti === 'function') {
        confetti({ particleCount: 60, spread: 45 });
      }

      fetchData();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const handleDownloadFile = (fileName) => {
    toast(`Document "${fileName}" successfully downloaded to Local Storage!`, 'success');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Courses Hub...</p>
      </div>
    );
  }

  const activeCourse = myCourses.find(c => c._id === activeCourseId);
  const getInitials = (n) => {
    return n ? n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() : 'U';
  };

  return (
    <div className="animate-fade-in">
      {activeTab === 'my-courses' && (
        <>
          {activeCourseId && activeCourse ? (
            // Course syllabus details
            <div className="glass-panel">
              <div className="panel-header">
                <div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveCourseId(null)} style={{ marginBottom: '0.75rem' }}>
                    <ArrowLeft style={{ width: '14px', height: '14px' }} /> My Courses
                  </button>
                  <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>{activeCourse.code}</span>
                  <h3>{activeCourse.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Instructor: <strong>{activeCourse.instructorName}</strong> ({activeCourse.instructor?.email || 'Faculty'})</p>
                </div>
              </div>
              <div className="panel-content">
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{activeCourse.description}</p>
                
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Syllabus Chapters & Materials</h4>
                {activeCourse.modules.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No course content uploaded by the instructor yet.</p>
                ) : (
                  activeCourse.modules.map((mod, mIdx) => (
                    <div style={{ marginBottom: '1.5rem' }} key={mIdx}>
                      <h5 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                        <Book style={{ width: '14px', height: '14px', display: 'inline', marginRight: '0.2rem', verticalAlign: 'middle' }} /> {mod.title}
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.25rem' }}>
                        {mod.files.length === 0 ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No reference documents published.</span>
                        ) : (
                          mod.files.map((f, fIdx) => (
                            <div className="material-item" key={fIdx}>
                              <div className="material-info">
                                <FileText className="material-icon" style={{ width: '16px', height: '16px' }} />
                                <div>
                                  <span className="material-title">{f.name}</span>
                                  <span className="material-size" style={{ marginLeft: '0.5rem' }}>({f.size})</span>
                                </div>
                              </div>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadFile(f.name)}>
                                <Download style={{ width: '14px', height: '14px' }} /> Download
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Enrolled courses list
            <>
              <div className="glass-panel" style={{ marginBottom: '1.5rem', borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                <div className="panel-header">
                  <h3>My Active Courses</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('browse-catalog')}>
                    <Search style={{ width: '14px', height: '14px' }} /> Browse All Courses
                  </button>
                </div>
              </div>
              <div className="courses-grid">
                {myCourses.length === 0 ? (
                  <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle style={{ width: '40px', height: '40px', marginBottom: '0.75rem', display: 'inline-block' }} />
                    <p>You are not enrolled in any courses. Browse the catalog to register!</p>
                  </div>
                ) : (
                  myCourses.map((c, i) => (
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
                          <button className="btn btn-primary btn-sm" onClick={() => setActiveCourseId(c._id)}>
                            Enter Course
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'browse-catalog' && (
        <>
          <div className="glass-panel" style={{ marginBottom: '1.5rem', borderBottom: 'none', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
            <div className="panel-header">
              <h3>Institution Course Catalog</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('my-courses')}>
                <ArrowLeft style={{ width: '14px', height: '14px' }} /> My Enrolled Courses
              </button>
            </div>
          </div>
          <div className="courses-grid">
            {catalog.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No new courses available for enrollment. You have registered in all available options!</p>
              </div>
            ) : (
              catalog.map((c, i) => (
                <div className="glass-panel course-card" key={i}>
                  <div className={`course-banner ${c.code.includes('202') ? 'accent' : ''}`}>
                    <span className="course-code">{c.code}</span>
                  </div>
                  <div className="course-body">
                    <h4 className="course-title">{c.title}</h4>
                    <p className="course-desc">{c.description}</p>
                    <div className="course-meta">
                      <div className="course-instructor">
                        <span>Instructor: <strong>{c.instructorName}</strong></span>
                      </div>
                      <button className="btn btn-accent btn-sm" onClick={() => handleEnrollCourse(c._id)}>
                        Enroll Course
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentCourses;
