import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Book, FolderPlus, UploadCloud, FileText, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';

const FacultyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);

  // Form states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('1.2 MB');
  const [targetModuleId, setTargetModuleId] = useState('');

  const fetchCourses = async () => {
    try {
      const data = await apiCall('/courses');
      setCourses(data);
      if (data.length > 0 && !activeCourseId) {
        setActiveCourseId(data[0]._id);
      }
      setLoading(false);
    } catch (err) {
      toast(err.message, 'danger');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    try {
      await apiCall(`/courses/${activeCourseId}/modules`, {
        method: 'POST',
        body: { title: newModuleTitle.trim() }
      });
      toast(`Module "${newModuleTitle}" created successfully!`, 'success');
      setShowAddModuleModal(false);
      setNewModuleTitle('');
      fetchCourses();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFileName.trim() || !targetModuleId) return;

    try {
      await apiCall(`/courses/${activeCourseId}/modules/${targetModuleId}/files`, {
        method: 'POST',
        body: { name: uploadFileName.trim(), size: uploadFileSize }
      });
      toast(`Document "${uploadFileName}" published into module!`, 'success');
      setShowUploadFileModal(false);
      setUploadFileName('');
      setUploadFileSize('1.2 MB');
      setTargetModuleId('');
      fetchCourses();
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  const activeCourse = courses.find(c => c._id === activeCourseId);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Course Syllabus Editor...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '1rem', display: 'inline-block' }} />
        <h3>No Courses Assigned</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please request the Super Admin to register a course and assign you as instructor.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }} className="animate-fade-in">
      {/* Course List Left panel */}
      <div className="glass-panel" style={{ padding: '1.25rem', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Select Course</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {courses.map((c, i) => (
            <button 
              key={i}
              className={`btn ${c._id === activeCourseId ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setActiveCourseId(c._id)}
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
            >
              <Book style={{ width: '16px', height: '16px' }} />
              <span>{c.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Course Details Right panel */}
      {activeCourse && (
        <div className="glass-panel">
          <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Syllabus Outline: {activeCourse.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Structure lessons and distribute downloadable references.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModuleModal(true)}>
              <FolderPlus style={{ width: '16px', height: '16px' }} /> Add Module
            </button>
          </div>
          <div className="panel-content">
            {activeCourse.modules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No modules created yet. Add a module to begin.</p>
            ) : (
              activeCourse.modules.map((mod, mIndex) => (
                <div className="glass-panel" key={mIndex} style={{ marginBottom: '1.25rem', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>
                      <BookOpen style={{ width: '16px', height: '16px', display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> {mod.title}
                    </h4>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setTargetModuleId(mod.id); setShowUploadFileModal(true); }}>
                      <UploadCloud style={{ width: '14px', height: '14px' }} /> Upload File
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {mod.files.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No uploaded materials in this module.</p>
                    ) : (
                      mod.files.map((f, fIndex) => (
                        <div className="material-item" key={fIndex}>
                          <div className="material-info">
                            <FileText className="material-icon" style={{ width: '16px', height: '16px' }} />
                            <div>
                              <span className="material-title">{f.name}</span>
                              <span className="material-size" style={{ marginLeft: '0.75rem' }}>({f.size})</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uploaded: {f.date}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      <Modal
        show={showAddModuleModal}
        title="Create Syllabus Module"
        onClose={() => setShowAddModuleModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModuleModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddModule}>Create Module</button>
          </>
        }
      >
        <form onSubmit={handleAddModule}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-module-title">Module Chapter Title</label>
            <input 
              type="text" 
              id="new-module-title" 
              className="form-control" 
              placeholder="E.g. Unit 3: Advanced Graphs" 
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              required 
            />
          </div>
        </form>
      </Modal>

      {/* Upload File Modal */}
      <Modal
        show={showUploadFileModal}
        title="Publish Reference File"
        onClose={() => setShowUploadFileModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowUploadFileModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUploadFile}>Upload File</button>
          </>
        }
      >
        <form onSubmit={handleUploadFile}>
          <div className="form-group">
            <label className="form-label" htmlFor="upload-file-name">Document Label Name</label>
            <input 
              type="text" 
              id="upload-file-name" 
              className="form-control" 
              placeholder="lecture_notes.pdf" 
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="upload-file-size">Estimated File Size</label>
            <select 
              id="upload-file-size" 
              className="form-control"
              value={uploadFileSize}
              onChange={(e) => setUploadFileSize(e.target.value)}
            >
              <option value="1.2 MB">1.2 MB</option>
              <option value="850 KB">850 KB</option>
              <option value="3.4 MB">3.4 MB</option>
              <option value="512 KB">512 KB</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dummy File Attachment</label>
            <input type="file" className="form-control" style={{ padding: '0.5rem' }} disabled />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Browsing files is mock-simulated. File parameters will be added to the registry metadata.</span>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacultyCourses;
