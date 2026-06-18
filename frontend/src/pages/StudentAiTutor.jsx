import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../utils/api';
import { Paperclip, Send, ArrowRight, X } from 'lucide-react';
import { toast } from '../utils/toast';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import Modal from '../components/Modal';

const StudentAiTutor = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'tutor',
      text: '<p>Hello! I am your <strong>Aegis AI Tutor Agent</strong>. How can I help you study today?</p><p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.4rem;">You can ask me to explain algorithms, summarize files, build study guides, or generate practice MCQs!</p>',
      isHtml: true
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Attachment variables
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileText, setAttachedFileText] = useState('');
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [modalFileName, setModalFileName] = useState('syllabus_reference.txt');
  const [modalFileContent, setModalFileContent] = useState('');

  const chatPaneRef = useRef(null);

  // Scroll to bottom on updates
  useEffect(() => {
    if (chatPaneRef.current) {
      chatPaneRef.current.scrollTop = chatPaneRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() && !attachedFileText) return;

    // Student message bubble
    const userMsg = {
      sender: 'student',
      text: text,
      hasAttachment: !!attachedFileText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    const payload = {
      prompt: text,
      fileText: attachedFileText || null
    };

    // Reset attachments
    setAttachedFileName('');
    setAttachedFileText('');

    try {
      const data = await apiCall('/ai/chat', {
        method: 'POST',
        body: payload
      });

      // Parse markdown to HTML
      let htmlResponse = data.response;
      let quizData = null;

      // Extract MCQ JSON if available
      const jsonMcqRegex = /```json-mcq([\s\S]*?)```/i;
      const match = data.response.match(jsonMcqRegex);
      if (match && match[1]) {
        try {
          quizData = JSON.parse(match[1].trim());
          // Strip out the JSON block from response text
          htmlResponse = htmlResponse.replace(jsonMcqRegex, '');
        } catch (e) {
          console.error('Failed to parse MCQ block:', e);
        }
      }

      if (marked) {
        htmlResponse = marked.parse(htmlResponse);
      }

      const aiMsg = {
        sender: 'tutor',
        text: htmlResponse,
        isHtml: true,
        quiz: quizData
      };

      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);

      // Highlight code blocks
      setTimeout(() => {
        Prism.highlightAll();
      }, 50);

    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  const handleAttachFileConfirm = (e) => {
    e.preventDefault();
    if (modalFileName.trim() && modalFileContent.trim()) {
      setAttachedFileName(modalFileName.trim());
      setAttachedFileText(modalFileContent.trim());
      setShowAttachModal(false);
      setModalFileName('syllabus_reference.txt');
      setModalFileContent('');
      toast('Reference file attached for analysis!', 'success');
    }
  };

  const handleAnswerOptionClick = (mcqIndex, optIdx, correctIdx, e) => {
    const parent = e.currentTarget.parentNode;
    // Disable other click handlers in this question group
    const options = parent.querySelectorAll('.ai-quiz-option');
    options.forEach(opt => {
      opt.onclick = null;
      opt.style.pointerEvents = 'none';
      const oIdx = Number(opt.getAttribute('data-o-idx'));
      if (oIdx === correctIdx) {
        opt.classList.add('correct');
      } else if (oIdx === optIdx) {
        opt.classList.add('incorrect');
      }
    });
  };

  return (
    <div className="ai-tutor-container animate-fade-in">
      {/* Sidebar prompts */}
      <div className="glass-panel ai-tutor-sidebar" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Aegis AI Assistant</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          The AI Tutor uses Google's neural language models to explain syllabus topics, construct sample quizzes, summarize reference PDFs, and formulate custom roadmaps.
        </p>
        
        <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Suggested Prompts</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSendMessage('Explain Binary Search')} style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}>"Explain Binary Search"</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSendMessage('Create 5 MCQs on Graph Theory')} style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}>"Create Graph MCQs"</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSendMessage('Summarize study materials')} style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}>"Summarize study file"</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleSendMessage('Create a study plan for Data Structures')} style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}>"Create study plan"</button>
          </div>
        </div>
      </div>

      {/* Chat Room */}
      <div className="glass-panel ai-tutor-chatbox">
        <div className="chat-messages-area" ref={chatPaneRef}>
          {messages.map((msg, index) => (
            <div className={`chat-bubble-wrapper ${msg.sender === 'student' ? 'student-bubble' : 'tutor-bubble'} animate-fade-in`} key={index}>
              <div className="chat-bubble-avatar">{msg.sender === 'student' ? '👤' : '🤖'}</div>
              <div className="chat-bubble">
                {msg.isHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                ) : (
                  <p>{msg.text}</p>
                )}
                {msg.hasAttachment && (
                  <p style={{ fontSize: '0.75rem', borderTop: '1px dashed rgba(255,255,255,0.2)', marginTop: '0.4rem', paddingTop: '0.25rem' }}>
                    <Paperclip style={{ width: '12px', height: '12px', display: 'inline', marginRight: '0.2rem' }} /> Attachment analysis requested
                  </p>
                )}
                
                {/* Interactive MCQs Render */}
                {msg.quiz && (
                  <div className="ai-interactive-quiz">
                    {msg.quiz.map((mcq, qIdx) => (
                      <div key={qIdx} style={{ marginBottom: '1.25rem' }}>
                        <div className="ai-quiz-question">{qIdx + 1}. {mcq.question}</div>
                        <div className="ai-quiz-options-list">
                          {mcq.options.map((opt, oIdx) => (
                            <div 
                              className="ai-quiz-option" 
                              key={oIdx}
                              data-o-idx={oIdx}
                              onClick={(e) => handleAnswerOptionClick(qIdx, oIdx, mcq.answer, e)}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking bubble */}
          {loading && (
            <div className="chat-bubble-wrapper tutor-bubble animate-fade-in">
              <div className="chat-bubble-avatar">🤖</div>
              <div className="chat-bubble">
                <div className="chat-bubble-thinking">
                  <div className="thinking-dot"></div>
                  <div className="thinking-dot"></div>
                  <div className="thinking-dot"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attachment alert */}
        {attachedFileName && (
          <div style={{ display: 'flex', padding: '0.5rem 1.5rem', background: 'rgba(99,102,241,0.06)', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--color-primary)', alignItems: 'center', gap: '0.5rem' }}>
            <Paperclip style={{ width: '14px', height: '14px' }} />
            <span>Attachment: <strong>{attachedFileName}</strong></span>
            <button onClick={() => { setAttachedFileName(''); setAttachedFileText(''); }} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
          </div>
        )}

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <button className="chat-file-upload-btn" onClick={() => setShowAttachModal(true)} title="Attach reference text file">
              <Paperclip style={{ width: '18px', height: '18px' }} />
            </button>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ask AI Tutor a question..." 
              style={{ borderRadius: 'var(--radius-full)' }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleSendMessage()} style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {/* Attach Document Modal */}
      <Modal
        show={showAttachModal}
        title="Upload Reference Text Document"
        onClose={() => setShowAttachModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAttachModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAttachFileConfirm}>Ingest File</button>
          </>
        }
      >
        <form onSubmit={handleAttachFileConfirm}>
          <div className="form-group">
            <label className="form-label" htmlFor="attach-file-name-txt">File Name</label>
            <input 
              type="text" 
              id="attach-file-name-txt" 
              className="form-control" 
              value={modalFileName}
              onChange={(e) => setModalFileName(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="attach-file-content-txt">File Raw Text (Summarizer Input)</label>
            <textarea 
              id="attach-file-content-txt" 
              className="form-control" 
              style={{ height: '150px' }} 
              placeholder="Paste text content of the PDF or TXT document here for AI Tutor ingestion..." 
              value={modalFileContent}
              onChange={(e) => setModalFileContent(e.target.value)}
              required
            ></textarea>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentAiTutor;
