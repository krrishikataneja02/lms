import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, ArrowLeft, File, Paperclip } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';

const FacultyAssignments = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Router tab states: 'list', 'create', 'grade'
  const [activeTab, setActiveTab] = useState('list');
  const [selectedAsgId, setSelectedAsgId] = useState('');
  
  // Grade Form
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  // Create Form
  const [asgCourseId, setAsgCourseId] = useState('');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgPoints, setAsgPoints] = useState('100');

  const fetchData = async () => {
    try {
      const coursesData = await apiCall('/courses');
      const assignmentsData = await apiCall('/assignments');
      
      setCourses(coursesData);
      setAssignments(assignmentsData);
      if (coursesData.length > 0) {
        setAsgCourseId(coursesData[0]._id);
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

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!asgCourseId || !asgTitle || !asgDesc || !asgDueDate || !asgPoints) return;

    try {
      await apiCall('/assignments', {
        method: 'POST',
        body: {
          courseId: asgCourseId,
          title: asgTitle.trim(),
          description: asgDesc.trim(),
          dueDate: asgDueDate,
          points: Number(asgPoints)
        }
      });
      toast(`Assignment "${asgTitle}" published successfully!`, 'success');
      
      // Reset
      setAsgTitle('');
      setAsgDesc('');
      setAsgDueDate('');
      setAsgPoints('100');
      setActiveTab('list');
      
      fetchData();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const handleOpenGradeTab = async (asgId) => {
    setSelectedAsgId(asgId);
    setLoading(true);
    try {
      const data = await apiCall(`/assignments/${asgId}/submissions`);
      setSubmissions(data);
      setActiveTab('grade');
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  const handleOpenGradeModal = (sub) => {
    setSelectedSub(sub);
    setGradeInput(sub.grade !== null ? sub.grade.toString() : '');
    setFeedbackInput(sub.feedback || '');
    setShowGradeModal(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      await apiCall(`/assignments/submissions/${selectedSub._id}/grade`, {
        method: 'PUT',
        body: {
          grade: Number(gradeInput),
          feedback: feedbackInput.trim()
        }
      });
      toast('Assignment grade evaluated successfully!', 'success');
      setShowGradeModal(false);
      
      // Reload submissions list
      const data = await apiCall(`/assignments/${selectedAsgId}/submissions`);
      setSubmissions(data);
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Assignments Hub...</p>
      </div>
    );
  }

  const selectedAsg = assignments.find(a => a._id === selectedAsgId);

  return (
    <div className="animate-fade-in">
      {activeTab === 'list' && (
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Active Assignments Registry</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('create')}>
              <Plus style={{ width: '16px', height: '16px' }} /> New Assignment
            </button>
          </div>
          <div className="panel-content">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Course Code</th>
                    <th>Grade Max Value</th>
                    <th>Final Deadline</th>
                    <th>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active assignments registered yet.</td></tr>
                  ) : (
                    assignments.map((asg, i) => {
                      const course = courses.find(c => c._id === asg.courseId);
                      return (
                        <tr key={i}>
                          <td><strong>{asg.title}</strong></td>
                          <td><span className="badge badge-primary">{course ? course.code : 'CS'}</span></td>
                          <td>{asg.points} pts</td>
                          <td><code>{asg.dueDate}</code></td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenGradeTab(asg._id)}>
                              View Reviews
                            </button>
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
      )}

      {activeTab === 'create' && (
        <div className="glass-panel" style={{ maxWidth: '650px' }}>
          <div className="panel-header">
            <h3>Register Course Assignment</h3>
          </div>
          <div className="panel-content">
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label className="form-label" htmlFor="asg-course">Syllabus Course</label>
                <select 
                  id="asg-course" 
                  className="form-control" 
                  value={asgCourseId}
                  onChange={(e) => setAsgCourseId(e.target.value)}
                  required
                >
                  {courses.map((c, i) => (
                    <option key={i} value={c._id}>{c.code} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asg-title">Assignment Title</label>
                <input 
                  type="text" 
                  id="asg-title" 
                  className="form-control" 
                  placeholder="E.g. Binary Search Optimizations" 
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="asg-desc">Requirements Description</label>
                <textarea 
                  id="asg-desc" 
                  className="form-control" 
                  style={{ height: '120px' }} 
                  placeholder="Provide explicit guidelines for the students..." 
                  value={asgDesc}
                  onChange={(e) => setAsgDesc(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" htmlFor="asg-due">Calendar Due Date</label>
                  <input 
                    type="date" 
                    id="asg-due" 
                    className="form-control" 
                    value={asgDueDate}
                    onChange={(e) => setAsgDueDate(e.target.value)}
                    required 
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="asg-points">Maximum Grade Scale</label>
                  <input 
                    type="number" 
                    id="asg-points" 
                    className="form-control" 
                    value={asgPoints}
                    onChange={(e) => setAsgPoints(e.target.value)}
                    min="10" 
                    max="1000" 
                    required 
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('list')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'grade' && (
        <div className="glass-panel">
          <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('list')} style={{ marginBottom: '1rem' }}>
                <ArrowLeft style={{ width: '14px', height: '14px' }} /> Back to Registry
              </button>
              <h3>Review Queue: {selectedAsg?.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Assign student score grades and constructive feedback summaries.</p>
            </div>
          </div>
          <div className="panel-content">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Submit Date</th>
                    <th>Uploaded file</th>
                    <th>Assigned Grade</th>
                    <th style={{ textAlign: 'right' }}>Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No student submission records uploaded yet.</td></tr>
                  ) : (
                    submissions.map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.studentId?.name || s.studentEmail}</strong></td>
                        <td><code>{s.submissionDate}</code></td>
                        <td>
                          <File style={{ width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '0.25rem', display: 'inline' }} />
                          {s.fileName || 'Online text answer'}
                        </td>
                        <td>
                          {s.grade !== null ? (
                            <span className="badge badge-success">{s.grade} / {selectedAsg?.points}</span>
                          ) : (
                            <span className="badge badge-warning">Awaiting</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenGradeModal(s)}>
                            {s.grade !== null ? 'Edit Grade' : 'Grade Item'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {selectedSub && selectedAsg && (
        <Modal
          show={showGradeModal}
          title="Evaluate Assignment Upload"
          onClose={() => setShowGradeModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={handleSaveGrade}>Save Evaluation</button>
            </>
          }
        >
          <div style={{ fontSize: '0.9rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Student Profile:</strong>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '0.25rem' }}>{selectedSub.studentId?.name || selectedSub.studentEmail} ({selectedSub.studentEmail})</p>
            </div>
            <div style={{ marginBottom: '1.25rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Submitted Answer Content:</strong>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{selectedSub.content}</p>
              {selectedSub.fileName && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                  <Paperclip style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} /> 
                  Attachment: <strong>{selectedSub.fileName}</strong>
                </div>
              )}
            </div>
            <form onSubmit={handleSaveGrade}>
              <div className="form-group">
                <label className="form-label" htmlFor="grade-value-input">Assigned Score (Max: {selectedAsg.points})</label>
                <input 
                  type="number" 
                  id="grade-value-input" 
                  className="form-control" 
                  min="0" 
                  max={selectedAsg.points} 
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="grade-feedback-input">Faculty Review Comments</label>
                <textarea 
                  id="grade-feedback-input" 
                  className="form-control" 
                  style={{ height: '80px' }} 
                  placeholder="Provide feedback..." 
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  required
                ></textarea>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FacultyAssignments;
