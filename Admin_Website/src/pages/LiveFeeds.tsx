import React, { useState, useEffect } from 'react';
import {
  Video,
  Tv,
  Maximize2,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Volume2,
  VolumeX,
  Megaphone,
} from 'lucide-react';
import { Screen, Department, Campaign, Playlist, MediaItem } from '../types';
import { api } from '../services/api';

interface LiveFeedsProps {
  screens: Screen[];
  departments: Department[];
  campaigns: Campaign[];
  playlists: Playlist[];
  media: MediaItem[];
  onRefresh: () => void;
  onOpenGlobalModal: () => void;
  onSelectScreen: (screen: Screen) => void;
}

export const LiveFeeds: React.FC<LiveFeedsProps> = ({
  screens,
  departments,
  campaigns,
  playlists,
  media,
  onRefresh,
  onOpenGlobalModal,
  onSelectScreen,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [gridCols, setGridCols] = useState<number>(3); // 2, 3, or 4 columns
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fullscreenFeed, setFullscreenFeed] = useState<Screen | null>(null);
  const [simulatedTick, setSimulatedTick] = useState<number>(0);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Loop simulation animation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTick((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredScreens = screens.filter(
    (s) => selectedDept === 'all' || s.departmentId === selectedDept
  );

  const onlineCount = screens.filter((s) => s.connectionStatus === 'online').length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active');

  const formatTimestamp = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  };

  // Helper to determine active content visual for a screen
  const getScreenLiveContent = (screen: Screen) => {
    const dept = departments.find((d) => d.id === screen.departmentId);

    // Check if there is an active emergency or global campaign
    const emergencyCamp = activeCampaigns.find((c) => c.type === 'emergency');
    const screenCamp = activeCampaigns.find(
      (c) =>
        (c.type === 'screen' && c.targetIds.includes(screen.id)) ||
        (c.type === 'department' && c.targetIds.includes(screen.departmentId)) ||
        (c.type === 'global' && (c.targetIds.includes('all') || c.targetIds.includes(screen.id)))
    );

    const winningCampaign = emergencyCamp || screenCamp;

    if (winningCampaign) {
      if (winningCampaign.contentType === 'only_queue') {
        return {
          mode: 'queue',
          title: `Doctor OPD Live Token Queue`,
          subtitle: dept?.name || 'Consultation Queue',
          badge: 'ONLY QUEUE CAMPAIGN',
          color: '#10b981',
          bgImage: null,
        };
      }

      if (winningCampaign.contentType === 'single_image' || winningCampaign.mediaUrl) {
        return {
          mode: 'image',
          title: winningCampaign.name,
          subtitle: 'Active JJM Advertisement',
          badge: 'SPONSORED AD OVERRIDE',
          color: '#9D6BBA',
          bgImage:
            winningCampaign.mediaUrl ||
            'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1920&q=80',
        };
      }

      if (winningCampaign.playlistId) {
        const pl = playlists.find((p) => p.id === winningCampaign.playlistId);
        const itemIdx = simulatedTick % (pl?.items.length || 1);
        const currentItem = pl?.items[itemIdx];
        return {
          mode: currentItem?.type || 'playlist',
          title: currentItem?.title || winningCampaign.name,
          subtitle: `Playlist: ${pl?.name || 'Hospital Loop'}`,
          badge: `PLAYLIST ITEM (${itemIdx + 1}/${pl?.items.length || 1})`,
          color: '#6B3A8A',
          bgImage: currentItem?.mediaUrl || null,
        };
      }
    }

    // Default: Alternating loop between Queue and Ads
    const isQueueCycle = simulatedTick % 2 === 0;
    if (isQueueCycle) {
      return {
        mode: 'queue',
        title: `OPD Token Queue: ${screen.name}`,
        subtitle: dept?.name || 'Specialist OPD',
        badge: 'LIVE QUEUE FEED',
        color: '#0d9488',
        bgImage: null,
      };
    } else {
      const sampleMedia = media[simulatedTick % (media.length || 1)];
      return {
        mode: 'image',
        title: sampleMedia?.title || 'JJM Health & Wellness Notice',
        subtitle: 'Automated Hospital Display Rotation',
        badge: 'ROTATING SIGNAGE',
        color: '#6B3A8A',
        bgImage:
          sampleMedia?.url ||
          'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1920&q=80',
      };
    }
  };

  const handleForceQueue = async (screenId: string) => {
    try {
      await api.patch(`/screens/${screenId}`, { currentContent: 'queue' });
      onRefresh();
    } catch (err: any) {
      alert(`Failed to set queue mode: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top CCTV Control Room Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#FFFFFF',
          padding: '16px 22px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e1329 0%, #3b2152 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(107, 58, 138, 0.25)',
            }}
          >
            <Video size={22} color="#9D6BBA" />
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
                CCTV Live Screen Control Wall
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#dc2626',
                  padding: '3px 9px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <span className="pulse-rec-dot" style={{ width: '7px', height: '7px' }} />
                REAL-TIME FEEDS
              </span>
            </div>
            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Live broadcast feeds and campaign preview for all connected TV screens
            </p>
          </div>
        </div>

        {/* Action Controls & Layout Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Department Filter */}
          <select
            className="input-field"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: '8px 14px', minWidth: '170px', fontSize: '0.825rem' }}
          >
            <option value="all">All Hospital Wards ({screens.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Matrix Grid Size Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            {[2, 3, 4].map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: gridCols === cols ? '#FFFFFF' : 'transparent',
                  color: gridCols === cols ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: gridCols === cols ? 700 : 500,
                  fontSize: '0.785rem',
                  cursor: 'pointer',
                  boxShadow: gridCols === cols ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {cols}x{cols}
              </button>
            ))}
          </div>

          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh Video Feeds"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={15} />
          </button>

          <button
            className="btn btn-primary"
            onClick={onOpenGlobalModal}
            style={{ padding: '8px 16px' }}
          >
            <Megaphone size={15} />
            <span>Global Broadcast</span>
          </button>
        </div>
      </div>

      {/* CCTV Camera Matrix Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gap: '18px',
        }}
      >
        {filteredScreens.map((screen, index) => {
          const dept = departments.find((d) => d.id === screen.departmentId);
          const liveContent = getScreenLiveContent(screen);
          const isOnline = screen.connectionStatus === 'online';
          const camNumber = (index + 1).toString().padStart(2, '0');

          return (
            <div
              key={screen.id}
              className="cctv-frame"
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: isOnline ? '2px solid #2d243a' : '2px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              {/* CCTV Aspect Ratio Display Monitor */}
              <div className="cctv-screen-aspect">
                {/* Camera Top HUD */}
                <div className="cctv-overlay-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        backgroundColor: '#dc2626',
                        color: '#ffffff',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 800,
                        fontSize: '0.625rem',
                      }}
                    >
                      CAM {camNumber}
                    </span>
                    <span style={{ fontWeight: 700, color: '#f3e8ff' }}>
                      {screen.name.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isOnline ? (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#4ade80',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }}
                      >
                        <span className="pulse-dot-online" style={{ width: '6px', height: '6px' }} />
                        30 FPS • 1080P
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#f87171',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }}
                      >
                        NO SIGNAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Camera Screen Content */}
                <div className="cctv-inner-content">
                  {isOnline ? (
                    liveContent.mode === 'queue' ? (
                      // Live OPD Queue Screen Simulation
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          background: 'linear-gradient(135deg, #181124 0%, #0d0914 100%)',
                          padding: '16px',
                          position: 'relative',
                        }}
                      >
                        {/* Token Call Card */}
                        <div
                          style={{
                            backgroundColor: 'rgba(107, 58, 138, 0.25)',
                            border: '1px solid rgba(157, 107, 186, 0.4)',
                            borderRadius: '12px',
                            padding: '12px 24px',
                            textAlign: 'center',
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#d8b4fe',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}
                          >
                            NOW CALLING PATIENT
                          </div>
                          <div
                            style={{
                              fontSize: '2.2rem',
                              fontWeight: 900,
                              color: '#34d399',
                              fontFamily: 'monospace',
                              letterSpacing: '0.05em',
                              lineHeight: 1.1,
                              margin: '4px 0',
                            }}
                          >
                            TOKEN #{(24 + (index * 3) + (simulatedTick % 5))}
                          </div>
                          <div
                            style={{
                              fontSize: '0.775rem',
                              color: '#FFFFFF',
                              fontWeight: 600,
                            }}
                          >
                            {dept?.name || 'General OPD'} • Room 10{index + 1}
                          </div>
                        </div>

                        {/* Next Tokens Mini Ticker */}
                        <div
                          style={{
                            marginTop: '12px',
                            fontSize: '0.675rem',
                            color: '#a78bfa',
                            display: 'flex',
                            gap: '8px',
                            fontFamily: 'monospace',
                          }}
                        >
                          <span>NEXT: #{25 + index * 3}</span>
                          <span>|</span>
                          <span>#{26 + index * 3}</span>
                          <span>|</span>
                          <span>#{27 + index * 3}</span>
                        </div>
                      </div>
                    ) : (
                      // Live Image / Video Campaign Simulation
                      <div
                        style={{
                          flex: 1,
                          backgroundImage: `url(${liveContent.bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                        }}
                      >
                        {/* Dark Gradient Overlay for text readability */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(to top, rgba(13,9,19,0.95) 0%, rgba(13,9,19,0.3) 60%, transparent 100%)',
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 5,
                            padding: '12px 14px',
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: 'rgba(107, 58, 138, 0.85)',
                              color: '#ffffff',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.625rem',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {liveContent.badge}
                          </span>
                          <h5
                            style={{
                              color: '#ffffff',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              marginTop: '4px',
                              lineHeight: 1.2,
                            }}
                          >
                            {liveContent.title}
                          </h5>
                          <p
                            style={{
                              color: '#c4b5fd',
                              fontSize: '0.675rem',
                              marginTop: '2px',
                            }}
                          >
                            {liveContent.subtitle}
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    // Offline TV Screen Static Look
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#120d1a',
                        color: '#6b5b7b',
                      }}
                    >
                      <Tv size={32} color="#4a3f57" />
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171' }}>
                        TV DISPLAY DISCONNECTED
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#827393' }}>
                        Check TV HDMI, WiFi, or Player App
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Bottom HUD */}
                <div className="cctv-overlay-footer">
                  <div>{formatTimestamp(currentTime)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#d8b4fe' }}>{dept?.code || 'GEN'}</span>
                    <span>•</span>
                    <span>{screen.location}</span>
                  </div>
                </div>

                {/* Running Ticker Marquee */}
                {isOnline && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(107, 58, 138, 0.92)',
                      color: '#ffffff',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      zIndex: 8,
                    }}
                  >
                    <span style={{ color: '#fed7aa', fontWeight: 800 }}>[JJM HOSPITAL]</span>
                    <span>
                      Emergency 24x7 Services Active • Dr. Consultation Available • Please Maintain Silence
                    </span>
                  </div>
                )}
              </div>

              {/* CCTV Camera Bottom Action Bar */}
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#161021',
                  borderTop: '1px solid #271e36',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onSelectScreen(screen)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c4b5fd',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Screen Configuration & Settings"
                  >
                    <Eye size={13} /> Details
                  </button>

                  <button
                    onClick={() => handleForceQueue(screen.id)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Switch TV directly to Doctor Queue Token"
                  >
                    Queue
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setFullscreenFeed(screen)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                    title="Enlarge CCTV Camera View"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Camera Modal */}
      {fullscreenFeed && (
        <div className="modal-overlay" onClick={() => setFullscreenFeed(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '900px',
              backgroundColor: '#0D0B12',
              border: '2px solid var(--primary)',
              padding: '0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '14px 20px',
                backgroundColor: '#181026',
                borderBottom: '1px solid #2a1b40',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="pulse-rec-dot" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  LIVE MONITOR: {fullscreenFeed.name.toUpperCase()} ({fullscreenFeed.code})
                </h4>
              </div>
              <button
                onClick={() => setFullscreenFeed(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#d8b4fe',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕ CLOSE
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#000000',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'radial-gradient(circle at center, #26163a 0%, #0d0815 100%)',
                  }}
                >
                  <div style={{ textAlign: 'center', color: '#ffffff' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                      NOW CALLING TOKEN #48
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#c4b5fd', marginTop: '6px' }}>
                      Dr. Consultation OPD • Room 102
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '12px' }}>
                      URL: {fullscreenFeed.queueUrl}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onSelectScreen(fullscreenFeed);
                    setFullscreenFeed(null);
                  }}
                >
                  Open Screen Settings
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleForceQueue(fullscreenFeed.id);
                    setFullscreenFeed(null);
                  }}
                >
                  Force Display Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
