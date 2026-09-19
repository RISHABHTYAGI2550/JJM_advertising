import React, { useState } from 'react';
import {
  Tv,
  Building2,
  Megaphone,
  Image as ImageIcon,
  Activity,
  Plus,
  Clock,
  Send,
  Video,
  CheckCircle2,
  AlertTriangle,
  Pause,
} from 'lucide-react';
import { Screen, Department, MediaItem, Campaign } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  screens: Screen[];
  departments: Department[];
  media: MediaItem[];
  campaigns: Campaign[];
  onSelectScreen: (screen: Screen) => void;
  onOpenPairModal: () => void;
  onOpenGlobalModal: () => void;
  onNavigateToLiveFeeds?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  screens,
  departments,
  media,
  campaigns,
  onSelectScreen,
  onOpenPairModal,
  onOpenGlobalModal,
  onNavigateToLiveFeeds,
}) => {
  const onlineCount = screens.filter((s) => s.connectionStatus === 'online').length;
  const offlineCount = screens.length - onlineCount;
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'active').length;

  // 1-Click Instant Broadcast state on Dashboard
  const [quickTitle, setQuickTitle] = useState('Hospital-Wide Emergency / Promotion Broadcast');
  const [quickMediaId, setQuickMediaId] = useState(media[0]?.id || '');
  const [quickPriority, setQuickPriority] = useState(85);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  const handleQuickBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcasting(true);
    setBroadcastFeedback(null);
    try {
      const selectedMedia = media.find((m) => m.id === quickMediaId) || media[0];
      await api.post('/campaigns/broadcast-global', {
        name: quickTitle,
        mediaId: selectedMedia?.id,
        mediaUrl: selectedMedia?.url,
        priority: Number(quickPriority),
      });

      setBroadcastFeedback(`Successfully broadcasted to ALL ${screens.length} TV screens!`);
      setTimeout(() => setBroadcastFeedback(null), 5000);
    } catch (err: any) {
      setBroadcastFeedback(`Broadcast failed: ${err.message}`);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Top Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '18px',
        }}
      >
        {/* Total Screens */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(107, 58, 138, 0.15) 0%, rgba(157, 107, 186, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tv size={26} color="#6B3A8A" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Hospital TVs
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.15,
                fontFamily: 'var(--font-display)',
              }}
            >
              {screens.length}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
              Across {departments.length} Wards & OPDs
            </div>
          </div>
        </div>

        {/* Online TVs */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'var(--success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={26} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Active / Connected TVs
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#047857',
                lineHeight: 1.15,
                fontFamily: 'var(--font-display)',
              }}
            >
              {onlineCount}{' '}
              <span style={{ fontSize: '1rem', color: 'var(--text-subtle)', fontWeight: 500 }}>
                / {screens.length}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.725rem',
                color: offlineCount > 0 ? '#b91c1c' : '#047857',
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              {offlineCount > 0 ? `${offlineCount} TV(s) Offline` : 'All Displays Synced & Live'}
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Megaphone size={26} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Active Campaigns
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.15,
                fontFamily: 'var(--font-display)',
              }}
            >
              {activeCampaignsCount}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
              Broadcasting on Displays
            </div>
          </div>
        </div>

        {/* Media Library */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: 'rgba(157, 107, 186, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={26} color="#9D6BBA" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Media Assets
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.15,
                fontFamily: 'var(--font-display)',
              }}
            >
              {media.length}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '2px' }}>
              High-Res Posters & Videos
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Instant Global Broadcast Center (Requested by User) */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF7FD 100%)',
          border: '1.5px solid rgba(107, 58, 138, 0.25)',
          boxShadow: '0 10px 30px -4px rgba(107, 58, 138, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6B3A8A 0%, #9D6BBA 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(107, 58, 138, 0.35)',
              }}
            >
              <Megaphone size={22} color="#ffffff" />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                1-Click Global TV Campaign Broadcast
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Instant broadcast to ALL {screens.length} hospital TV displays in one single click
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(107, 58, 138, 0.1)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {onlineCount} Connected TVs Ready
            </span>
          </div>
        </div>

        {broadcastFeedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: broadcastFeedback.includes('failed')
                ? 'var(--danger-light)'
                : 'var(--success-light)',
              color: broadcastFeedback.includes('failed') ? '#991b1b' : '#065f46',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {broadcastFeedback.includes('failed') ? (
              <AlertTriangle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{broadcastFeedback}</span>
          </div>
        )}

        <form
          onSubmit={handleQuickBroadcast}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto',
            gap: '14px',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '6px',
              }}
            >
              Broadcast Title / Announcement
            </label>
            <input
              type="text"
              className="input-field"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="e.g. Health Checkup Camp Notice..."
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '6px',
              }}
            >
              Select Promotional Media / Banner
            </label>
            <select
              className="input-field"
              value={quickMediaId}
              onChange={(e) => setQuickMediaId(e.target.value)}
            >
              {media.length === 0 ? (
                <option value="">(No media uploaded yet — go to Media Assets)</option>
              ) : (
                media.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.type.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '6px',
              }}
            >
              Broadcast Priority
            </label>
            <select
              className="input-field"
              value={quickPriority}
              onChange={(e) => setQuickPriority(Number(e.target.value))}
            >
              <option value="80">Normal Priority (80)</option>
              <option value="90">High Priority Promotion (90)</option>
              <option value="100">Critical Emergency (100)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={broadcasting}
              style={{ width: '100%', height: '42px' }}
            >
              <Send size={16} />
              <span>{broadcasting ? 'Pushed to TVs...' : 'Broadcast to All TVs'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Hospital Screens Fleet List */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Hospital Screens Fleet & Doctor Queues
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Real-time monitoring and configuration for all doctor rooms and waiting lounge screens
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={onOpenPairModal}>
              <Plus size={16} /> Pair New Screen
            </button>
          </div>
        </div>

        {screens.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Tv size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No TV Displays Paired Yet</h4>
            <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>Click "Pair New Screen" above to connect your first hospital TV kiosk.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '18px',
            }}
          >
            {screens.map((screen) => {
              const dept = departments.find((d) => d.id === screen.departmentId);
              return (
              <div
                key={screen.id}
                className="glass-card"
                onClick={() => onSelectScreen(screen)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Status Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {screen.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {dept?.name || 'Department'} • {screen.location}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {screen.isPaused && (
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '10px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#DC2626',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Pause size={9} fill="currentColor" /> PAUSED
                      </span>
                    )}
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
                </div>

                {/* Queue Display URL Preview */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.675rem',
                      color: 'var(--text-subtle)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                    }}
                  >
                    Active HMS Queue URL
                  </div>
                  <div
                    style={{
                      fontSize: '0.785rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '3px',
                    }}
                  >
                    {screen.queueUrl}
                  </div>
                </div>

                {/* Meta details */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-subtle)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} />
                    {screen.lastHeartbeat
                      ? `Sync ${new Date(screen.lastHeartbeat).toLocaleTimeString()}`
                      : 'Never connected'}
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    Configure TV →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
