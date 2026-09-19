import React, { useState } from 'react';
import { X, RefreshCw, Send, Trash2, ExternalLink, Tv, Play, Pause } from 'lucide-react';
import { Screen, Department } from '../types';
import { api } from '../services/api';

interface ScreenDetailModalProps {
  screen: Screen | null;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onRefreshList: () => void;
}

export const ScreenDetailModal: React.FC<ScreenDetailModalProps> = ({
  screen,
  departments,
  isOpen,
  onClose,
  onRefreshList,
}) => {
  if (!isOpen || !screen) return null;

  const [queueUrl, setQueueUrl] = useState(screen.queueUrl);
  const [name, setName] = useState(screen.name);
  const [departmentId, setDepartmentId] = useState(screen.departmentId);
  const [location, setLocation] = useState(screen.location);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const dept = departments.find((d) => d.id === screen.departmentId);

  const handleUpdate = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await api.patch(`/screens/${screen.id}`, {
        name,
        queueUrl,
        departmentId,
        location,
      });
      setFeedback('Screen configuration updated and broadcasted to TV!');
      onRefreshList();
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteRefresh = async () => {
    try {
      await api.post(`/screens/${screen.id}/refresh`);
      setFeedback('Remote refresh command sent to screen!');
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleTestDisplay = async () => {
    try {
      await api.post(`/screens/${screen.id}/test-content`, {
        message: 'JJM Hospital Control Center Test Notification',
      });
      setFeedback('Test display trigger sent to screen!');
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleUnpair = async () => {
    if (
      !confirm(
        'Are you sure you want to unpair this TV? The TV will return to the pairing code screen.'
      )
    ) {
      return;
    }
    try {
      await api.post(`/screens/${screen.id}/unpair`);
      onRefreshList();
      onClose();
    } catch (err: any) {
      alert(`Failed to unpair: ${err.message}`);
    }
  };

  const handleTogglePause = async () => {
    if (!screen) return;
    setLoading(true);
    try {
      const res = await api.post(`/screens/${screen.id}/toggle-pause`);
      if (res.data.success) {
        setFeedback(`TV playback ${res.data.isPaused ? 'PAUSED' : 'RESUMED'} in real time!`);
        onRefreshList();
      }
    } catch (err: any) {
      setFeedback(`Error toggling playback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px', maxWidth: '640px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, rgba(107, 58, 138, 0.15) 0%, rgba(157, 107, 186, 0.22) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tv size={24} color="#6B3A8A" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {screen.name}
                </h3>
                <span className={`status-badge ${screen.connectionStatus}`}>
                  <span
                    className={
                      screen.connectionStatus === 'online'
                        ? 'pulse-dot-online'
                        : 'pulse-dot-offline'
                    }
                  />
                  {screen.connectionStatus}
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Screen ID: <code style={{ color: 'var(--primary)' }}>{screen.id}</code> •{' '}
                {dept?.name || 'Department'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {feedback && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: feedback.startsWith('Error')
                ? 'var(--danger-light)'
                : 'var(--success-light)',
              color: feedback.startsWith('Error') ? '#991b1b' : '#065f46',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '18px',
            }}
          >
            {feedback}
          </div>
        )}

        {/* Remote Control Actions */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Real-time Remote Control
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Send instant commands to the running TV kiosk
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${screen.isPaused ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleTogglePause}
              disabled={loading}
              title={screen.isPaused ? 'Resume Screen Playback' : 'Pause Screen Playback'}
              style={
                screen.isPaused
                  ? { backgroundColor: '#10B981', borderColor: '#10B981', color: '#fff' }
                  : { color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.3)' }
              }
            >
              {screen.isPaused ? (
                <Play size={13} fill="currentColor" />
              ) : (
                <Pause size={13} fill="currentColor" />
              )}
              <span>{screen.isPaused ? 'Resume TV' : 'Pause TV'}</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleRemoteRefresh}>
              <RefreshCw size={13} /> Refresh TV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleTestDisplay}>
              <Send size={13} /> Test Display
            </button>
          </div>
        </div>

        {/* Form Fields for Editing Screen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '6px',
              }}
            >
              Screen Display Name
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Department / Ward
              </label>
              <select
                className="input-field"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Physical Location / Room
              </label>
              <input
                type="text"
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '6px',
              }}
            >
              Doctor HMS Live Queue URL
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                className="input-field"
                value={queueUrl}
                onChange={(e) => setQueueUrl(e.target.value)}
              />
              {queueUrl && (
                <a
                  href={queueUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: 'none', padding: '0 12px' }}
                  title="Open Queue in New Tab"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Telemetry info */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Last Sync:</strong>{' '}
              {screen.lastHeartbeat
                ? new Date(screen.lastHeartbeat).toLocaleTimeString()
                : 'Never connected'}
            </div>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Player Version:</strong>{' '}
              {screen.playerVersion || '1.0.0'}
            </div>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Current Content:</strong>{' '}
              <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: 700 }}>
                {screen.currentContent}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Device Token:</strong>{' '}
              {screen.deviceToken ? 'Bound & Active' : 'Pending pairing'}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px',
          }}
        >
          <button className="btn btn-danger btn-sm" onClick={handleUnpair}>
            <Trash2 size={13} /> Unpair Screen
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Save & Push to TV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
