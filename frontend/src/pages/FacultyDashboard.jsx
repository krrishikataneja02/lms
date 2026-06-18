import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, GraduationCap, Clock, CheckCircle2, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '../utils/toast';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    gradedTasks: 0
  });
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const coursesData = await apiCall('/courses');
        const assignmentsData = await apiCall('/assignments');
        
        const courseIds = coursesData.map(c => c._id);
        
        // Fetch all submissions for these assignments
        const submissionsPromises = assignmentsData.map(asg => 
          apiCall(`/assignments/${asg._id}/submissions`).catch(() => [])
        );
        const allSubmissionsResults = await Promise.all(submissionsPromises);
        const allSubmissions = allSubmissionsResults.flat();

        // Stats
        const totalCourses = coursesData.length;
        
        const enrolledStudentsSet = new Set();
        coursesData.forEach(c => c.studentsEnrolled.forEach(s => enrolledStudentsSet.add(s._id || s)));
        const totalStudents = enrolledStudentsSet.size;

        const pending = allSubmissions.filter(s => s.grade === null);
        const graded = allSubmissions.filter(s => s.grade !== null);

        setCourses(coursesData);
        setStats({
          totalCourses,
          totalStudents,
          pendingGrading: pending.length,
          gradedTasks: graded.length
        });
        
        // Setup pending submissions list with name & assignment details
        const enrichedPending = pending.map(sub => {
          const asg = assignmentsData.find(a => a._id === sub.assignmentId);
          return {
            ...sub,
            assignmentTitle: asg ? asg.title : 'Assignment'
          };
        });

        setPendingSubmissions(enrichedPending);
        setLoading(false);
      } catch (err) {
        toast(err.message, 'danger');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Faculty Hub...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="dashboard-grid">
        <div className="glass-panel stats-card primary">
          <div className="stats-info">
            <h3>Courses Instructed</h3>
            <p>{stats.totalCourses}</p>
          </div>
          <div className="stats-icon-wrapper">
            <BookOpen style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card secondary">
          <div className="stats-info">
            <h3>Total Unique Students</h3>
            <p>{stats.totalStudents}</p>
          </div>
          <div className="stats-icon-wrapper">
            <GraduationCap style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card warning">
          <div className="stats-info">
            <h3>Pending Grading</h3>
            <p>{stats.pendingGrading}</p>
          </div>
          <div className="stats-icon-wrapper">
            <Clock style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card accent">
          <div className="stats-info">
            <h3>Graded Tasks</h3>
            <p>{stats.gradedTasks}</p>
          </div>
          <div className="stats-icon-wrapper">
            <CheckCircle2 style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Instructed Courses list */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3>My Assigned Courses</h3>
          </div>
          <div className="panel-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {courses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No courses assigned by system administrator yet.</p>
              ) : (
                courses.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>{c.code}</span>
                      <h4 style={{ fontSize: '0.95rem' }}>{c.title}</h4>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>{c.studentsEnrolled.length}</strong> Enrolled</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ungraded submissions queue */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Submissions Awaiting Review</h3>
          </div>
          <div className="panel-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {pendingSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <Smile style={{ width: '36px', height: '36px', strokeWidth: 1.5, marginBottom: '0.5rem', display: 'inline-block' }} />
                <p>All student assignments are currently graded!</p>
              </div>
            ) : (
              pendingSubmissions.map((s, i) => (
                <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>{s.studentId?.name || s.studentEmail}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.assignmentTitle}</p>
                  </div>
                  <Link to="/faculty-assignments" className="btn btn-secondary btn-sm">Review</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
