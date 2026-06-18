import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, PlusCircle, Trash } from 'lucide-react';
import { toast } from '../utils/toast';

const FacultyQuizzes = () => {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // tab switch: 'list', 'create'
  const [activeTab, setActiveTab] = useState('list');

  // Form meta
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState('120');
  
  // Questions list builder
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: '',
      options: ['', '', '', ''],
      answer: 0
    }
  ]);

  const fetchData = async () => {
    try {
      const coursesData = await apiCall('/courses');
      const quizzesData = await apiCall('/quizzes');
      
      setCourses(coursesData);
      setQuizzes(quizzesData);
      if (coursesData.length > 0) {
        setQuizCourseId(coursesData[0]._id);
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

  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        question: '',
        options: ['', '', '', ''],
        answer: 0
      }
    ]);
  };

  const handleRemoveQuestionField = (index) => {
    if (questions.length === 1) return;
    const updated = [...questions];
    updated.splice(index, 1);
    // Re-adjust IDs
    updated.forEach((q, i) => { q.id = i + 1; });
    setQuestions(updated);
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].answer = Number(value);
    setQuestions(updated);
  };

  const handlePublishQuiz = async (e) => {
    e.preventDefault();
    if (!quizCourseId || !quizTitle || !quizDuration) return;

    // Validate questions
    const emptyCheck = questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (emptyCheck) {
      toast('Please fill out all question fields and options.', 'warning');
      return;
    }

    try {
      await apiCall('/quizzes', {
        method: 'POST',
        body: {
          courseId: quizCourseId,
          title: quizTitle.trim(),
          duration: Number(quizDuration),
          questions
        }
      });
      toast(`Assessment "${quizTitle}" published successfully!`, 'success');
      
      // Reset
      setQuizTitle('');
      setQuizDuration('120');
      setQuestions([{ id: 1, question: '', options: ['', '', '', ''], answer: 0 }]);
      setActiveTab('list');
      
      fetchData();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Assessments...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {activeTab === 'list' && (
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Published Course Assessments</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('create')}>
              <Plus style={{ width: '16px', height: '16px' }} /> Create Assessment
            </button>
          </div>
          <div className="panel-content">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Associated Course</th>
                    <th>Questions Count</th>
                    <th>Timer Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No quizzes published yet.</td></tr>
                  ) : (
                    quizzes.map((q, i) => {
                      const course = courses.find(c => c._id === q.courseId);
                      return (
                        <tr key={i}>
                          <td><strong>{q.title}</strong></td>
                          <td><span className="badge badge-primary">{course ? course.code : 'CS'}</span></td>
                          <td>{q.questions.length} questions</td>
                          <td><code>{q.duration} seconds</code></td>
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
        <div className="glass-panel" style={{ maxWidth: '800px' }}>
          <div className="panel-header">
            <h3>Publish Practice Quiz</h3>
          </div>
          <div className="panel-content">
            <form onSubmit={handlePublishQuiz}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="quiz-course">Associated Course</label>
                  <select 
                    id="quiz-course" 
                    className="form-control" 
                    value={quizCourseId}
                    onChange={(e) => setQuizCourseId(e.target.value)}
                    required
                  >
                    {courses.map((c, i) => (
                      <option key={i} value={c._id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="quiz-duration">Timer Limit (Seconds)</label>
                  <input 
                    type="number" 
                    id="quiz-duration" 
                    className="form-control" 
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(e.target.value)}
                    min="10" 
                    max="3600" 
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="quiz-title">Assessment Title</label>
                <input 
                  type="text" 
                  id="quiz-title" 
                  className="form-control" 
                  placeholder="E.g. Binary Tree Balancing MCQs" 
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required 
                />
              </div>

              <div style={{ marginTop: '1.5rem', marginBottom: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Questions Assembly</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddQuestionField}>
                  <PlusCircle style={{ width: '16px', height: '16px' }} /> Add Question
                </button>
              </div>

              {/* Questions builder */}
              {questions.map((q, qIndex) => (
                <div className="glass-panel" key={qIndex} style={{ padding: '1.25rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>Question {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveQuestionField(qIndex)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Input question premise here..." 
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {q.options.map((opt, oIndex) => (
                      <div className="form-group" style={{ marginBottom: 0 }} key={oIndex}>
                        <label className="form-label">Option {String.fromCharCode(65 + oIndex)}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          required 
                        />
                      </div>
                    ))}
                  </div>
                  <div className="form-group" style={{ maxWidth: '300px', marginBottom: 0 }}>
                    <label className="form-label">Correct Solution Option</label>
                    <select 
                      className="form-control" 
                      value={q.answer}
                      onChange={(e) => handleAnswerChange(qIndex, e.target.value)}
                    >
                      <option value="0">Option A</option>
                      <option value="1">Option B</option>
                      <option value="2">Option C</option>
                      <option value="3">Option D</option>
                    </select>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('list')}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyQuizzes;
