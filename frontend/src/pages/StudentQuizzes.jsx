import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../utils/api';
import { Timer, Award, CheckCircle } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';
import confetti from 'canvas-confetti';

const StudentQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active quiz playing states
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  
  // Scoring modals
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreResult, setScoreResult] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const quizzesData = await apiCall('/quizzes');
      const attemptsData = await apiCall('/quizzes/attempts/my');
      
      setQuizzes(quizzesData);
      setAttempts(attemptsData);
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer interval hook
  useEffect(() => {
    if (activeQuiz && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            toast('Time has expired! Quiz automatically submitted.', 'danger');
            handleSubmitQuiz(true); // Auto-submit flag
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeQuiz, secondsLeft]);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswers(Array(quiz.questions.length).fill(null));
    setSecondsLeft(quiz.duration);
  };

  const handleSelectOption = (oIdx) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIdx] = oIdx;
    setSelectedAnswers(updated);
  };

  const handleSubmitQuiz = async (isTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!activeQuiz) return;

    // Validate if unanswered questions exist (when not timed out)
    if (!isTimeout) {
      const unanswered = selectedAnswers.some(ans => ans === null);
      if (unanswered) {
        toast('Please answer all questions before submitting.', 'warning');
        return;
      }
    }

    // Evaluate score
    let correct = 0;
    activeQuiz.questions.forEach((q, index) => {
      const studentAnswer = selectedAnswers[index];
      if (studentAnswer === q.answer) {
        correct++;
      }
    });

    const score = Math.round((correct / activeQuiz.questions.length) * 100);

    try {
      await apiCall(`/quizzes/${activeQuiz._id}/attempts`, {
        method: 'POST',
        body: {
          answers: selectedAnswers.map(ans => ans || 0),
          score
        }
      });

      setCorrectCount(correct);
      setScoreResult(score);
      setShowScoreModal(true);
      setActiveQuiz(null);

      // Play confetti on success
      if (score >= 70 && typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 80 });
      }

      fetchData();
    } catch (err) {
      toast(err.message, 'danger');
      setActiveQuiz(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Quizzes...</p>
      </div>
    );
  }

  // Formatting seconds: "01:45"
  const getFormattedTimer = () => {
    const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const secs = (secondsLeft % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="animate-fade-in">
      {!activeQuiz ? (
        // Quizzes Table List
        <div className="glass-panel">
          <div className="panel-header">
            <h3>Syllabus Quiz Arena</h3>
          </div>
          <div className="panel-content">
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Questions</th>
                    <th>Time Limit</th>
                    <th>Assessment Attempt Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assessments published in your classes.</td></tr>
                  ) : (
                    quizzes.map((q, i) => {
                      const attempt = attempts.find(a => a.quizId === q._id);
                      return (
                        <tr key={i}>
                          <td><strong>{q.title}</strong></td>
                          <td>{q.questions.length} Questions</td>
                          <td><code>{q.duration} seconds</code></td>
                          <td>
                            {attempt ? (
                              <span className="badge badge-success">Completed: {attempt.score}%</span>
                            ) : (
                              <span className="badge badge-warning">Not attempted</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {attempt ? (
                              <button className="btn btn-secondary btn-sm" disabled>Completed</button>
                            ) : (
                              <button className="btn btn-primary btn-sm" onClick={() => startQuiz(q)}>Attempt</button>
                            )}
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
      ) : (
        // Active Quiz Playing Runner Deck
        <div className="quiz-taker-container animate-fade-in">
          <div className="quiz-header">
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>{activeQuiz.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}</p>
            </div>
            <div className={`quiz-timer-box ${secondsLeft <= 15 ? 'timer-low' : ''}`}>
              <Timer style={{ width: '16px', height: '16px' }} />
              <span>{getFormattedTimer()}</span>
            </div>
          </div>
          
          <div className="quiz-progress-bar">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${Math.round((currentQuestionIdx / activeQuiz.questions.length) * 100)}%` }}
            ></div>
          </div>

          <div className="glass-panel quiz-card" style={{ padding: '2rem' }}>
            <h4 className="quiz-card-question">{activeQuiz.questions[currentQuestionIdx].question}</h4>
            <div className="quiz-options-list">
              {activeQuiz.questions[currentQuestionIdx].options.map((opt, oIdx) => (
                <div 
                  key={oIdx}
                  className={`quiz-option-card ${selectedAnswers[currentQuestionIdx] === oIdx ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(oIdx)}
                >
                  <span className="quiz-option-letter">{String.fromCharCode(65 + oIdx)}</span>
                  <span style={{ fontSize: '0.95rem' }}>{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)} 
              disabled={currentQuestionIdx === 0}
            >Previous</button>
            
            {currentQuestionIdx === activeQuiz.questions.length - 1 ? (
              <button className="btn btn-accent" onClick={() => handleSubmitQuiz(false)}>Submit Quiz</button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                disabled={selectedAnswers[currentQuestionIdx] === null}
              >Next Question</button>
            )}
          </div>
        </div>
      )}

      {/* Score Modal */}
      <Modal
        show={showScoreModal}
        title="Assessment Scorecard"
        onClose={() => setShowScoreModal(false)}
        footer={
          <button className="btn btn-primary" onClick={() => setShowScoreModal(false)} style={{ width: '100%' }}>
            Return to Arena
          </button>
        }
      >
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {scoreResult >= 70 ? '🏆' : '📝'}
          </div>
          <h3>Quiz Finished!</h3>
          <p style={{ 
            fontSize: '2.5rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-heading)', 
            color: scoreResult >= 70 ? 'var(--color-success)' : 'var(--color-warning)',
            margin: '1rem 0' 
          }}>
            {scoreResult}%
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>{correctCount} of {correctCount + (activeQuiz ? 0 : quizzes.find(q=>!q._id)?.questions.length || 3) - correctCount} questions correct.</p>
        </div>
      </Modal>
    </div>
  );
};

export default StudentQuizzes;
