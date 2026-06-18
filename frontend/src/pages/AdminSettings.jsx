import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Eye, EyeOff, Save } from 'lucide-react';
import { toast } from '../utils/toast';

const AdminSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await apiCall('/auth/settings');
        setApiKey(settings.geminiApiKey || '');
        setLoading(false);
      } catch (err) {
        toast(err.message, 'danger');
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await apiCall('/auth/settings', {
        method: 'POST',
        body: { geminiApiKey: apiKey.trim() }
      });
      toast('Gemini API Key configuration saved successfully!', 'success');
    } catch (err) {
      toast(err.message, 'danger');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '650px' }}>
      <div className="panel-header">
        <h3>System API Configurations</h3>
      </div>
      <div className="panel-content">
        <div className="form-group" style={{ position: 'relative' }}>
          <label className="form-label" htmlFor="settings-api-key">Google Gemini API Key</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type={showKey ? 'text' : 'password'} 
              id="settings-api-key" 
              className="form-control" 
              placeholder="AI-tutor API authorization token..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={() => setShowKey(!showKey)} style={{ padding: '0.5rem 1rem' }}>
              {showKey ? (
                <EyeOff style={{ width: '18px', height: '18px' }} />
              ) : (
                <Eye style={{ width: '18px', height: '18px' }} />
              )}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
            Providing a Gemini API key allows the AI Tutor to use Google's <strong>Gemini 1.5 Flash</strong> models for answering questions. 
            If empty, the AI Tutor operates in offline simulation mode.
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleSaveSettings} style={{ marginTop: '1rem' }}>
          <Save style={{ width: '18px', height: '18px' }} /> Save Configurations
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
