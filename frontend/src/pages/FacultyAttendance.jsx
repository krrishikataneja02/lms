import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Calendar, BarChart3 } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';

const FacultyAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState('');
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ratios modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState([]);

  const fetchCourses = async () => {
    try {
      const data = await apiCall('/courses');
      setCourses(data);
      if (data.length > 0) {
        setActiveCourseId(data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  const fetchAttendanceAndStudents = async () => {
    if (!activeCourseId) return;
    try {
      // Find course in state to get enrolled students list
      const course = courses.find(c => c._id === activeCourseId);
      if (!course) return;

      setStudents(course.studentsEnrolled || []);

      // Fetch logs for this course on this date
      const logs = await apiCall(`/attendance/${activeCourseId}?date=${activeDate}`);
      setAttendanceLogs(logs);
      
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchAttendanceAndStudents();
  }, [activeCourseId, activeDate, courses]);

  const handleMarkAttendance = async (studentEmail, status) => {
    try {
      const record = await apiCall(`/attendance/${activeCourseId}`, {
        method: 'POST',
        body: {
          date: activeDate,
          studentEmail,
          status
        }
      });
      
      // Update local state dynamically without refetching to keep UI fluid
      const updatedLogs = [...attendanceLogs];
      const index = updatedLogs.findIndex(l => l.studentEmail.toLowerCase() === studentEmail.toLowerCase());
      if (index !== -1) {
        updatedLogs[index] = record;
      } else {
        updatedLogs.push(record);
      }
      setAttendanceLogs(updatedLogs);
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const handleOpenSummaryReport = async () => {
    if (!activeCourseId) return;
    setLoading(true);
    try {
      const allAttendance = await apiCall(`/attendance/${activeCourseId}`);
      
      const ratios = students.map(s => {
        const studentLogs = allAttendance.filter(a => a.studentEmail.toLowerCase() === s.email.toLowerCase());
        const presentCount = studentLogs.filter(a => a.status === 'present' || a.status === 'late').length;
        const ratio = studentLogs.length ? Math.round((presentCount / studentLogs.length) * 100) : 100;
        return {
          name: s.name,
          email: s.email,
          total: studentLogs.length,
          ratio
        };
      });

      setSummaryData(ratios);
      setShowSummaryModal(true);
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  if (loading && courses.length > 0 && students.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Attendance Logs...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No courses assigned yet.</p>
      </div>
    );
  }

  const activeCourse = courses.find(c => c._id === activeCourseId);

  return (
    <div className="glass-panel animate-fade-in">
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3>Course Roster Attendance Sheet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Daily student attendance registry.</p>
        </div>
        <div className="attendance-header-meta">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Course:</label>
            <select 
              id="attendance-course-select" 
              className="form-control" 
              style={{ width: '140px', padding: '0.4rem 2rem 0.4rem 0.8rem' }}
              value={activeCourseId}
              onChange={(e) => setActiveCourseId(e.target.value)}
            >
              {courses.map((c, i) => (
                <option key={i} value={c._id}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="attendance-date-selector">
            <Calendar style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }} />
            <input 
              type="date" 
              id="attendance-date-input" 
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleOpenSummaryReport}>
            <BarChart3 style={{ width: '14px', height: '14px' }} /> Monthly Report
          </button>
        </div>
      </div>
      <div className="panel-content">
        <div className="table-container">
          <table className="custom-table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Student Name (Email Address)</th>
                <th>Present (P)</th>
                <th>Absent (A)</th>
                <th>Late (L)</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No students enrolled in this course yet.</td></tr>
              ) : (
                students.map((s, i) => {
                  const log = attendanceLogs.find(a => a.studentEmail.toLowerCase() === s.email.toLowerCase());
                  const status = log ? log.status : null;
                  
                  return (
                    <tr key={i}>
                      <td style={{ textAlign: 'left' }}>
                        <strong>{s.name}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{s.email}</p>
                      </td>
                      <td>
                        <button 
                          className={`attendance-status-btn ${status === 'present' ? 'present' : ''}`}
                          onClick={() => handleMarkAttendance(s.email, 'present')}
                        >P</button>
                      </td>
                      <td>
                        <button 
                          className={`attendance-status-btn ${status === 'absent' ? 'absent' : ''}`}
                          onClick={() => handleMarkAttendance(s.email, 'absent')}
                        >A</button>
                      </td>
                      <td>
                        <button 
                          className={`attendance-status-btn ${status === 'late' ? 'late' : ''}`}
                          onClick={() => handleMarkAttendance(s.email, 'late')}
                        >L</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ratios summary Modal */}
      {activeCourse && (
        <Modal
          show={showSummaryReportModal => showSummaryModal}
          title="Course Monthly Roster Report"
          onClose={() => setShowSummaryModal(false)}
          footer={<button className="btn btn-secondary" onClick={() => setShowSummaryModal(false)}>Close Report</button>}
        >
          <div style={{ fontSize: '0.9rem' }}>
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>{activeCourse.code} Attendance Ratios</h4>
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrolled Sessions</th>
                    <th>Present Ratio</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No students enrolled.</td></tr>
                  ) : (
                    summaryData.map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.total} classes logged</td>
                        <td><strong>{s.ratio}%</strong></td>
                        <td>
                          <span className={`badge ${s.ratio >= 75 ? 'badge-success' : 'badge-danger'}`}>
                            {s.ratio >= 75 ? 'Good standing' : 'Low attendance'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FacultyAttendance;
