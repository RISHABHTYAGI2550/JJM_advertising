import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  XCircle,
  Sparkles,
  Tv,
  CheckCircle,
  Activity,
  Megaphone,
  Radio,
  Sliders,
} from 'lucide-react';
import { EmergencyAnnouncement, Screen } from '../types';
import { api } from '../services/api';

interface EmergencyAnnouncementsProps {
  screens: Screen[];
  onRefresh: () => void;
}

const EMERGENCY_PRESETS = [
  {
    title: 'IMPORTANT HOSPITAL ANNOUNCEMENT / महत्वपूर्ण सूचना',
    message: 'All patients and visitors: OPD registration will close early today at 4:00 PM for emergency sterilization. Please collect your tokens from Counter 2.',
    severity: 'warning' as const,
  },
  {
    title: 'CRITICAL EMERGENCY CODE RED / आपातकालीन सूचना',
    message: 'Medical Emergency in Ward 3. All non-emergency consultations are temporarily paused. Doctors please report immediately to Triage.',
    severity: 'critical' as const,
  },
  {
    title: 'BLOOD DONATION CAMP NOTICE / रक्तदान शिविर',
    message: 'Voluntary Blood Donation Camp is live today at Ground Floor Seminar Hall. Please support and donate to save lives.',
    severity: 'info' as const,
  },
  {
    title: 'SPECIALIST DOCTOR SCHEDULE NOTICE',
    message: 'Dr. Sharma (Cardiology DOC036) will be attending an emergency surgery from 1:00 PM to 2:30 PM. Token queue will resume shortly.',
    severity: 'info' as const,
  },
];

export const EmergencyAnnouncements: React.FC<EmergencyAnnouncementsProps> = ({
  screens,
  onRefresh,
}) => {
  const [activeAnnouncement, setActiveAnnouncement] = useState<EmergencyAnnouncement | null>(null);
  const [title, setTitle] = useState('IMPORTANT ANNOUNCEMENT / महत्वपूर्ण सूचना');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [displayMode, setDisplayMode] = useState<'takeover' | 'banner' | 'both'>('takeover');
  const [highlightScreen, setHighlightScreen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchActiveAnnouncement = async () => {
    try {
      const res = await api.get('/emergency');
      if (res.data.success) {
        setActiveAnnouncement(res.data.announcement);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter announcement text before broadcasting');
      return;
    }

    setLoading(true);
    setSuccessNotice(null);
    try {
      const res = await api.post('/emergency/broadcast', {
        title: title.trim(),
        message: message.trim(),
        severity,
        displayMode,
        highlightScreen,
      });

      if (res.data.success) {
        setActiveAnnouncement(res.data.announcement);
        setSuccessNotice('🚨 Emergency Announcement broadcasted to ALL TV screens successfully!');
        onRefresh();
      }
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!confirm('Are you sure you want to dismiss this emergency broadcast and restore normal TV playback?')) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/emergency/dismiss');
      setActiveAnnouncement(null);
      setSuccessNotice('Emergency announcement stopped. All TVs restored to normal queue and ads.');
      onRefresh();
    } catch (err: any) {
      alert(`Dismiss failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (preset: typeof EMERGENCY_PRESETS[0]) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setSeverity(preset.severity);
  };

  const onlineScreensCount = screens.filter((s) => s.connectionStatus === 'online').length;

  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={24} color="#EF4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
                Hospital Emergency & Important Announcements
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                Instant live text announcement & highlighted screen takeover across all hospital screens
              </p>
            </div>
          </div>
        </div>

        {/* Live Screens Fleet Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '24px',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            fontSize: '0.8rem',
            color: '#CBD5E1',
          }}
        >
          <Radio size={16} color="#10B981" />
          <span>
            Target Fleet: <strong style={{ color: '#34D399' }}>{onlineScreensCount} Online TVs</strong> ({screens.length} total)
          </span>
        </div>
      </div>

      {/* Success Notice Toast */}
      {successNotice && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6EE7B7',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle size={20} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ACTIVE EMERGENCY BROADCAST MONITOR (IF RUNNING) */}
      {activeAnnouncement && activeAnnouncement.active && (
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #EF4444',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  boxShadow: '0 0 12px #EF4444',
                  display: 'inline-block',
                }}
              />
              <div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#F87171',
                  }}
                >
                  BROADCAST CURRENTLY LIVE ON ALL SCREENS
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                  {activeAnnouncement.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              disabled={loading}
              className="btn"
              style={{
                backgroundColor: '#DC2626',
                color: 'white',
                padding: '10px 20px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)',
              }}
            >
              <XCircle size={18} />
              <span>Dismiss & Restore Normal Playback</span>
            </button>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              fontSize: '1rem',
              color: '#F8FAFC',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            "{activeAnnouncement.message}"
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '0.75rem', color: '#94A3B8' }}>
            <span>
              Mode: <strong style={{ color: '#F8FAFC' }}>{activeAnnouncement.displayMode.toUpperCase()}</strong>
            </span>
            <span>
              Severity: <strong style={{ color: '#F87171' }}>{activeAnnouncement.severity.toUpperCase()}</strong>
            </span>
            <span>
              Highlight Screen: <strong style={{ color: '#10B981' }}>{activeAnnouncement.highlightScreen ? 'ACTIVE' : 'OFF'}</strong>
            </span>
            <span>
              Started: <strong style={{ color: '#F8FAFC' }}>{new Date(activeAnnouncement.createdAt).toLocaleTimeString()}</strong>
            </span>
          </div>
        </div>
      )}

      {/* BROADCAST FORM & LIVE PREVIEW GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Announcement Configuration Form */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#38BDF8" />
            <span>Configure New Emergency Announcement</span>
          </h3>

          {/* Quick Presets */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
              Quick Hospital Notice Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {EMERGENCY_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    color: '#CBD5E1',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0284C7';
                    e.currentTarget.style.color = '#38BDF8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.color = '#CBD5E1';
                  }}
                >
                  {p.title.split('/')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Title / Heading */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Announcement Heading *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. IMPORTANT ANNOUNCEMENT / महत्वपूर्ण सूचना"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Announcement Message Text (English / Hindi) *
              </label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Type your urgent message here. This will be shown prominently on all TV screens..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

            {/* Severity Level */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Alert Severity Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSeverity('critical')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    backgroundColor: severity === 'critical' ? 'rgba(239, 68, 68, 0.25)' : '#0F172A',
                    border: severity === 'critical' ? '2px solid #EF4444' : '1px solid #334155',
                    color: severity === 'critical' ? '#F87171' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  🚨 Critical Red
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('warning')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    backgroundColor: severity === 'warning' ? 'rgba(245, 158, 11, 0.25)' : '#0F172A',
                    border: severity === 'warning' ? '2px solid #F59E0B' : '1px solid #334155',
                    color: severity === 'warning' ? '#FBBF24' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  ⚠️ Warning Amber
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('info')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    backgroundColor: severity === 'info' ? 'rgba(2, 132, 199, 0.25)' : '#0F172A',
                    border: severity === 'info' ? '2px solid #0284C7' : '1px solid #334155',
                    color: severity === 'info' ? '#38BDF8' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  ℹ️ General Blue
                </button>
              </div>
            </div>

            {/* Display Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                TV Display Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setDisplayMode('takeover')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    backgroundColor: displayMode === 'takeover' ? 'rgba(2, 132, 199, 0.25)' : '#0F172A',
                    border: displayMode === 'takeover' ? '2px solid #0284C7' : '1px solid #334155',
                    color: displayMode === 'takeover' ? '#38BDF8' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Full-Screen Takeover
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('banner')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    backgroundColor: displayMode === 'banner' ? 'rgba(2, 132, 199, 0.25)' : '#0F172A',
                    border: displayMode === 'banner' ? '2px solid #0284C7' : '1px solid #334155',
                    color: displayMode === 'banner' ? '#38BDF8' : '#94A3B8',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Bottom Ticker Banner
                </button>
              </div>
            </div>

            {/* Highlight Screen Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={highlightScreen}
                onChange={(e) => setHighlightScreen(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#EF4444' }}
              />
              <span style={{ fontSize: '0.825rem', color: '#F8FAFC', fontWeight: 600 }}>
                Highlight TV Screen with Glowing Emergency Border
              </span>
            </label>

            {/* Broadcast Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-danger"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                marginTop: '10px',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
              }}
            >
              <Send size={18} />
              <span>{loading ? 'Broadcasting...' : '🚨 Broadcast to All Screens Now'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live TV Simulation Preview */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tv size={18} color="#10B981" />
            <span>TV Display Live Simulation Preview</span>
          </h3>

          <div
            style={{
              flex: 1,
              borderRadius: '16px',
              backgroundColor: '#070D1E',
              border: highlightScreen
                ? severity === 'critical'
                  ? '4px solid #EF4444'
                  : severity === 'warning'
                  ? '4px solid #F59E0B'
                  : '4px solid #0284C7'
                : '1px solid #334155',
              boxShadow: highlightScreen
                ? severity === 'critical'
                  ? '0 0 25px rgba(239, 68, 68, 0.4)'
                  : '0 0 25px rgba(245, 158, 11, 0.4)'
                : 'none',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              minHeight: '280px',
              textAlign: 'center',
            }}
          >
            {/* Hospital Brand Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={22} color="#FFFFFF" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
                  JJM HOSPITAL KASHIPUR
                </div>
                <div style={{ fontSize: '0.675rem', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.05em' }}>
                  CENTRAL EMERGENCY BROADCAST
                </div>
              </div>
            </div>

            {/* Announcement Title Banner */}
            <div
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor:
                  severity === 'critical'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : severity === 'warning'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(2, 132, 199, 0.25)',
                border:
                  severity === 'critical'
                    ? '1px solid #EF4444'
                    : severity === 'warning'
                    ? '1px solid #F59E0B'
                    : '1px solid #0284C7',
                color: severity === 'critical' ? '#F87171' : severity === 'warning' ? '#FBBF24' : '#38BDF8',
                fontWeight: 800,
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                marginBottom: '14px',
              }}
            >
              {title || 'IMPORTANT ANNOUNCEMENT'}
            </div>

            {/* Announcement Message */}
            <p
              style={{
                fontSize: '1.05rem',
                color: '#F8FAFC',
                fontWeight: 600,
                lineHeight: 1.5,
                maxWidth: '90%',
              }}
            >
              {message || 'Your announcement message will render here in high contrast, legible font on Android TV screens...'}
            </p>

            <div
              style={{
                marginTop: '18px',
                fontSize: '0.7rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Broadcast Authority: JJM Hospital Administration</span>
              <span>•</span>
              <span>Kashipur Campus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
