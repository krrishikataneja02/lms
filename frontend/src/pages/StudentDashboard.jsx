import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Clock, FileCheck, Calendar, Smile } from 'lucide-react';
import { toast } from '../utils/toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendanceRatio, setAttendanceRatio] = useState(100);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const coursesData = await apiCall('/courses');
        const assignmentsData = await apiCall('/assignments');
        const submissionsData = await apiCall('/assignments/submissions/my');
        const attendanceData = await apiCall('/attendance/student/my');

        setCourses(coursesData);
        setAssignments(assignmentsData);
        setSubmissions(submissionsData);

        // Attendance Ratio
        const presentLogs = attendanceData.filter(a => a.status === 'present' || a.status === 'late').length;
        const ratio = attendanceData.length 
          ? Math.round((presentLogs / attendanceData.length) * 100) 
          : 100;
        setAttendanceRatio(ratio);

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
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Student Center...</p>
      </div>
    );
  }

  const pendingAsgsCount = assignments.length - submissions.length;
  const pendingAssignmentsList = assignments.filter(
    a => !submissions.some(s => s.assignmentId === a._id)
  );

  return (
    <div className="animate-fade-in">
      <div className="dashboard-grid">
        <div className="glass-panel stats-card primary">
          <div className="stats-info">
            <h3>Enrolled Classes</h3>
            <p>{courses.length}</p>
          </div>
          <div className="stats-icon-wrapper">
            <BookOpen style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card warning">
          <div className="stats-info">
            <h3>Pending Homework</h3>
            <p>{pendingAsgsCount >= 0 ? pendingAsgsCount : 0}</p>
          </div>
          <div className="stats-icon-wrapper">
            <Clock style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card secondary">
          <div className="stats-info">
            <h3>Submitted Tasks</h3>
            <p>{submissions.length}</p>
          </div>
          <div className="stats-icon-wrapper">
            <FileCheck style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
        <div className="glass-panel stats-card accent">
          <div className="stats-info">
            <h3>My Attendance Avg</h3>
            <p>{attendanceRatio}%</p>
          </div>
          <div className="stats-icon-wrapper">
            <Calendar style={{ width: '24px', height: '24px' }} />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Gradebook and Evaluations */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Gradebook & Evaluations</h3>
          </div>
          <div className="panel-content" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Topic Assignment</th>
                    <th>Submission Date</th>
                    <th>Obtained Mark</th>
                    <th>Instructor Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No completed assignments submitted yet.</td></tr>
                  ) : (
                    submissions.map((s, i) => {
                      const asg = assignments.find(a => a._id === s.assignmentId);
                      return (
                        <tr key={i}>
                          <td><strong>{asg ? asg.title : 'Assignment'}</strong></td>
                          <td><code>{s.submissionDate}</code></td>
                          <td>
                            {s.grade !== null ? (
                              <span className="badge badge-success">{s.grade} / {asg ? asg.points : 100}</span>
                            ) : (
                              <span className="badge badge-warning">Awaiting Grade</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {s.feedback || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Deadlines */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Upcoming Deadlines</h3>
          </div>
          <div className="panel-content" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingAssignmentsList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No pending homework remaining!</p>
              ) : (
                pendingAssignmentsList.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '12px', borderLeft: '3px solid var(--color-warning)', fontSize: '0.85rem' }}>
                    <strong>{a.title}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <span>Due: <code>{a.dueDate}</code></span>
                      <span>Value: {a.points} pts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
