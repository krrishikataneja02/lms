import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { ArrowLeft, Send, CheckCircle, File, Paperclip } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';
import confetti from 'canvas-confetti';

const StudentAssignments = () => {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab switch
  const [selectedAsgId, setSelectedAsgId] = useState(null);

  // Submit form fields
  const [subText, setSubText] = useState('');
  const [subFileName, setSubFileName] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachInput, setAttachInput] = useState('');

  const fetchData = async () => {
    try {
      const coursesData = await apiCall('/courses');
      const assignmentsData = await apiCall('/assignments');
      const submissionsData = await apiCall('/assignments/submissions/my');
      
      setCourses(coursesData);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!subText.trim()) return;

    try {
      await apiCall(`/assignments/${selectedAsgId}/submit`, {
        method: 'POST',
        body: {
          content: subText.trim(),
          fileName: subFileName || null
        }
      });
      toast('Assignment uploaded successfully!', 'success');
      
      // Celebrate
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      setSubText('');
      setSubFileName('');
      fetchData();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const handleAttachFile = (e) => {
    e.preventDefault();
    if (attachInput.trim()) {
      setSubFileName(attachInput.trim());
      setShowAttachModal(false);
      setAttachInput('');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Assignments Center...</p>
      </div>
    );
  }

  const activeAsg = assignments.find(a => a._id === selectedAsgId);
  const activeSub = submissions.find(s => s.assignmentId === selectedAsgId);

  return (
    <div className="animate-fade-in">
      {selectedAsgId && activeAsg ? (
        // Submission page
        <div className="glass-panel" style={{ maxWidth: '750px' }}>
          <div className="panel-header">
            <div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAsgId(null)} style={{ marginBottom: '0.75rem' }}>
                <ArrowLeft style={{ width: '14px', height: '14px' }} /> Assignment Hub
              </button>
              <h3>Submit: {activeAsg.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Total points: <strong>{activeAsg.points} pts</strong> | Deadline: <code>{activeAsg.dueDate}</code>
              </p>
            </div>
          </div>
          <div className="panel-content">
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <strong style={{ color: 'var(--color-primary)' }}>Problem Instructions:</strong>
              <p style={{ marginTop: '0.5rem', fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>{activeAsg.description}</p>
            </div>

            {activeSub ? (
              <div className="glass-panel" style={{ padding: '1.25rem', borderColor: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.02)' }}>
                <h4 style={{ color: 'var(--color-success)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle style={{ width: '16px', height: '16px' }} /> Assignment Submitted
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date: <code>{activeSub.submissionDate}</code></p>
                <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{activeSub.content}</div>
                {activeSub.fileName && (
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    <Paperclip style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.2rem' }} /> Attachment: {activeSub.fileName}
                  </p>
                )}
                
                {activeSub.grade !== null ? (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}>Instructor Evaluation & Feedback</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>Score: {activeSub.grade} / {activeAsg.points}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>"{activeSub.feedback}"</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Evaluating submissions requires instructor review. You will receive marks here once completed.
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitWork}>
                <div className="form-group">
                  <label className="form-label" htmlFor="submit-asg-text">Your Submission Content (Code / Text explanation)</label>
                  <textarea 
                    id="submit-asg-text" 
                    className="form-control" 
                    style={{ height: '180px', fontFamily: 'monospace' }} 
                    placeholder="Type or paste your code solution here..." 
                    value={subText}
                    onChange={(e) => setSubText(e.target.value)}
                    required 
                  ></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Attach File (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      id="submit-asg-file-label" 
                      className="form-control" 
                      style={{ maxWidth: '300px' }} 
                      readOnly 
                      placeholder="No file attached" 
                      value={subFileName}
                    />
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAttachModal(true)}>Attach PDF/JS</button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  <Send style={{ width: '14px', height: '14px' }} /> Upload Submission
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        // List Hub
        <div className="glass-panel">
          <div className="panel-header">
            <h3>My Active Assignments</h3>
          </div>
          <div className="panel-content">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Assignment Title</th>
                    <th>Associated Course</th>
                    <th>Due Date</th>
                    <th>Weight Scale</th>
                    <th>Evaluation Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assignments published in your courses.</td></tr>
                  ) : (
                    assignments.map((asg, i) => {
                      const sub = submissions.find(s => s.assignmentId === asg._id);
                      let badge = <span className="badge badge-warning">Awaiting submission</span>;
                      if (sub) {
                        badge = sub.grade !== null 
                          ? <span className="badge badge-success">Graded: {sub.grade} / {asg.points}</span>
                          : <span className="badge badge-info">Submitted</span>;
                      }
                      const course = courses.find(c => c._id === asg.courseId);
                      return (
                        <tr key={i}>
                          <td><strong>{asg.title}</strong></td>
                          <td><span className="badge badge-primary">{course ? course.code : 'CS'}</span></td>
                          <td><code>{asg.dueDate}</code></td>
                          <td>{asg.points} pts</td>
                          <td>{badge}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAsgId(asg._id)}>
                              {sub ? 'Review' : 'Start Task'}
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

      {/* Attach File Modal */}
      <Modal
        show={showAttachModal}
        title="Attach Work Reference"
        onClose={() => setShowAttachModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAttachModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAttachFile}>Attach</button>
          </>
        }
      >
        <form onSubmit={handleAttachFile}>
          <div className="form-group">
            <label className="form-label" htmlFor="attach-file-name-input">Filename</label>
            <input 
              type="text" 
              id="attach-file-name-input" 
              className="form-control" 
              placeholder="binary_search.py" 
              value={attachInput}
              onChange={(e) => setAttachInput(e.target.value)}
              required 
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentAssignments;
