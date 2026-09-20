import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  XCircle,
  Clock,
  Zap,
  Radio,
  Sliders,
  Tv,
  CheckCircle,
  Activity,
  ShieldAlert,
  BellRing,
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
    duration: 30,
  },
  {
    title: 'CRITICAL EMERGENCY CODE RED / आपातकालीन सूचना',
    message: 'Medical Emergency in Ward 3. All non-emergency consultations are temporarily paused. Doctors please report immediately to Triage.',
    severity: 'critical' as const,
    duration: 10,
  },
  {
    title: 'DOCTOR EMERGENCY ATTENDANCE NOTICE',
    message: 'Doctor is attending an emergency patient. Queue will resume in 5 minutes. Thank you for your patience.',
    severity: 'warning' as const,
    duration: 4, // 4s quick flash
  },
  {
    title: 'SPECIALIST OPD SCHEDULE NOTICE',
    message: 'Dr. Sharma (Cardiology DOC038) is in minor OT for 15 minutes. Token queue will resume shortly.',
    severity: 'info' as const,
    duration: 10,
  },
];

export const EmergencyAnnouncements: React.FC<EmergencyAnnouncementsProps> = ({
  screens,
  onRefresh,
}) => {
  const [activeAnnouncement, setActiveAnnouncement] = useState<EmergencyAnnouncement | null>(null);
  const [title, setTitle] = useState('IMPORTANT HOSPITAL ANNOUNCEMENT / महत्वपूर्ण सूचना');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [displayMode, setDisplayMode] = useState<'takeover' | 'banner' | 'both'>('takeover');
  const [highlightScreen, setHighlightScreen] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState<number>(4); // Default 4 seconds for quick flash
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchActiveAnnouncement = async () => {
    try {
      const res = await api.get('/emergency');
      if (res.data.success && res.data.announcement) {
        setActiveAnnouncement(res.data.announcement);
      } else {
        setActiveAnnouncement(null);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  // Live countdown timer for active broadcast
  useEffect(() => {
    if (!activeAnnouncement || !activeAnnouncement.active) {
      setRemainingSeconds(null);
      return;
    }

    if (activeAnnouncement.expiresAt) {
      const updateRemaining = () => {
        const diffMs = (activeAnnouncement.expiresAt || 0) - Date.now();
        const diffSec = Math.max(0, Math.ceil(diffMs / 1000));
        setRemainingSeconds(diffSec);

        if (diffSec <= 0) {
          setActiveAnnouncement(null);
          onRefresh();
        }
      };

      updateRemaining();
      const interval = setInterval(updateRemaining, 1000);
      return () => clearInterval(interval);
    } else {
      setRemainingSeconds(null);
    }
  }, [activeAnnouncement]);

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
        durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
      });

      if (res.data.success) {
        setActiveAnnouncement(res.data.announcement);
        const durMsg = durationSeconds > 0 ? ` for ${durationSeconds} seconds (auto-dismisses)` : '';
        setSuccessNotice(`🚨 Emergency broadcast sent to ALL TV displays${durMsg}!`);
        onRefresh();
      }
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setLoading(true);
    try {
      await api.post('/emergency/dismiss');
      setActiveAnnouncement(null);
      setRemainingSeconds(null);
      setSuccessNotice('Emergency broadcast dismissed. All TV screens restored to normal display.');
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
    setDurationSeconds(preset.duration);
  };

  const onlineScreensCount = screens.filter((s) => s.connectionStatus === 'online').length;

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.35) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)',
            }}
          >
            <ShieldAlert size={26} color="#EF4444" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Emergency Announcement Broadcast Center
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              Instant screen takeover & ticker broadcast across all hospital TV displays
            </p>
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
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            fontSize: '0.825rem',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Radio size={16} color="#10B981" />
          <span>
            Connected Fleet: <strong style={{ color: '#10B981' }}>{onlineScreensCount} Online TVs</strong> ({screens.length} total)
          </span>
        </div>
      </div>

      {/* Success Notice Toast */}
      {successNotice && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#047857',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} color="#10B981" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ACTIVE EMERGENCY BROADCAST MONITOR (IF LIVE) */}
      {activeAnnouncement && activeAnnouncement.active && (
        <div
          style={{
            padding: '22px 26px',
            borderRadius: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '2px solid #EF4444',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="pulse-dot-offline" style={{ width: '14px', height: '14px', backgroundColor: '#EF4444' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#DC2626',
                    }}
                  >
                    EMERGENCY BROADCAST IS LIVE ON ALL TV SCREENS
                  </span>
                  {remainingSeconds !== null && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={12} /> Auto-Dismiss in {remainingSeconds}s
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px', margin: 0 }}>
                  {activeAnnouncement.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              disabled={loading}
              className="btn btn-danger"
              style={{
                padding: '10px 22px',
                fontWeight: 800,
                fontSize: '0.9rem',
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
              }}
            >
              <XCircle size={18} />
              <span>Dismiss & Restore TV Now</span>
            </button>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              fontSize: '1rem',
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            "{activeAnnouncement.message}"
          </div>

          {/* Progress bar if has duration */}
          {activeAnnouncement.durationSeconds && remainingSeconds !== null && (
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#EF4444',
                  width: `${Math.min(100, (remainingSeconds / activeAnnouncement.durationSeconds) * 100)}%`,
                  transition: 'width 1s linear',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* MAIN BROADCAST COMPOSER & PREVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.2fr) minmax(320px, 1fr)', gap: '24px' }}>
        {/* Left Column: Form */}
        <div className="glass-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              1-Click Hospital Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EMERGENCY_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  {p.title.split('/')[0].trim()} ({p.duration}s)
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* DURATION SELECTOR - HIGHLIGHTED (User specifically requested 4s!) */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="var(--primary)" />
                  Display Duration (Auto-Dismiss)
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                  {durationSeconds === 0 ? 'Indefinite (Manual)' : `Auto-dismisses in ${durationSeconds}s`}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                {/* 4 SECONDS QUICK FLASH - USER FAVORITE */}
                <button
                  type="button"
                  onClick={() => setDurationSeconds(4)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: durationSeconds === 4 ? 'var(--primary)' : 'var(--card-bg)',
                    border: durationSeconds === 4 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: durationSeconds === 4 ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    boxShadow: durationSeconds === 4 ? '0 4px 12px rgba(107, 58, 138, 0.3)' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Zap size={13} fill="currentColor" /> 4s
                  </span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>Quick Flash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDurationSeconds(10)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: durationSeconds === 10 ? 'var(--primary)' : 'var(--card-bg)',
                    border: durationSeconds === 10 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: durationSeconds === 10 ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  10s
                </button>

                <button
                  type="button"
                  onClick={() => setDurationSeconds(30)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: durationSeconds === 30 ? 'var(--primary)' : 'var(--card-bg)',
                    border: durationSeconds === 30 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: durationSeconds === 30 ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  30s
                </button>

                <button
                  type="button"
                  onClick={() => setDurationSeconds(60)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: durationSeconds === 60 ? 'var(--primary)' : 'var(--card-bg)',
                    border: durationSeconds === 60 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: durationSeconds === 60 ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  1 min
                </button>

                <button
                  type="button"
                  onClick={() => setDurationSeconds(300)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: durationSeconds === 300 ? 'var(--primary)' : 'var(--card-bg)',
                    border: durationSeconds === 300 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: durationSeconds === 300 ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  5 min
                </button>

                <button
                  type="button"
                  onClick={() => setDurationSeconds(0)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    backgroundColor: durationSeconds === 0 ? 'var(--primary)' : 'var(--card-bg)',
                    border: durationSeconds === 0 ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: durationSeconds === 0 ? '#FFFFFF' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Manual
                </button>
              </div>
            </div>

            {/* Severity Level */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Alert Severity Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSeverity('critical')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-subtle)',
                    border: severity === 'critical' ? '2px solid #EF4444' : '1px solid var(--border-color)',
                    color: severity === 'critical' ? '#DC2626' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  🚨 Critical Red
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('warning')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: severity === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-subtle)',
                    border: severity === 'warning' ? '2px solid #F59E0B' : '1px solid var(--border-color)',
                    color: severity === 'warning' ? '#D97706' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  ⚠️ Warning Amber
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('info')}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: severity === 'info' ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-subtle)',
                    border: severity === 'info' ? '2px solid #0284C7' : '1px solid var(--border-color)',
                    color: severity === 'info' ? '#0284C7' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  ℹ️ Notice Blue
                </button>
              </div>
            </div>

            {/* Title / Heading */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Announcement Heading *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. IMPORTANT HOSPITAL ANNOUNCEMENT / महत्वपूर्ण सूचना"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Announcement Message (English / Hindi) *
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Enter the alert message to display on TV screens..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Display Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDisplayMode('takeover')}
                className={`btn btn-sm ${displayMode === 'takeover' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Full Screen Takeover
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('banner')}
                className={`btn btn-sm ${displayMode === 'banner' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Bottom Ticker Banner
              </button>
            </div>

            {/* Broadcast Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-danger"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Send size={18} />
              <span>
                {loading
                  ? 'Broadcasting to Fleet...'
                  : durationSeconds > 0
                  ? `⚡ Broadcast to All TVs (${durationSeconds}s Auto-Dismiss)`
                  : '🚨 Broadcast to All TVs (Until Dismissed)'}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Live TV Simulation Mockup */}
        <div className="glass-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Tv size={18} color="var(--primary)" />
              <span>Real-Time TV Display Preview</span>
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Aspect Ratio 16:9
            </span>
          </div>

          {/* TV Frame */}
          <div
            style={{
              flex: 1,
              minHeight: '260px',
              borderRadius: '14px',
              backgroundColor: '#0B1329',
              border:
                severity === 'critical'
                  ? '3px solid #EF4444'
                  : severity === 'warning'
                  ? '3px solid #F59E0B'
                  : '3px solid #0284C7',
              boxShadow:
                severity === 'critical'
                  ? '0 0 25px rgba(239, 68, 68, 0.3)'
                  : '0 0 20px rgba(245, 158, 11, 0.25)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity size={20} color="#FFFFFF" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                  JJM HOSPITAL KASHIPUR
                </div>
                <div style={{ fontSize: '0.625rem', color: '#38BDF8', fontWeight: 700, letterSpacing: '0.05em' }}>
                  CENTRAL BROADCAST SYSTEM
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
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
                fontSize: '0.85rem',
                marginBottom: '12px',
              }}
            >
              {title || 'IMPORTANT ANNOUNCEMENT'}
            </div>

            <p
              style={{
                fontSize: '0.95rem',
                color: '#F8FAFC',
                fontWeight: 600,
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '90%',
              }}
            >
              {message || 'Type your message to see preview. When broadcasted, all hospital screens will instantly display this message and auto-restore after the selected duration.'}
            </p>

            <div
              style={{
                marginTop: '16px',
                fontSize: '0.675rem',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Duration: {durationSeconds > 0 ? `${durationSeconds}s Auto-Dismiss` : 'Manual Dismiss'}</span>
              <span>•</span>
              <span>Mode: {displayMode.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
