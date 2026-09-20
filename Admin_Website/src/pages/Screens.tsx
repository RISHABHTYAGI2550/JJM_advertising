import React, { useState } from 'react';
import {
  Tv,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Play,
  Pause,
  Power,
  Trash2,
  Eye,
  Loader2,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { Screen, Department } from '../types';
import { api } from '../services/api';

interface ScreensPageProps {
  screens: Screen[];
  departments: Department[];
  onSelectScreen: (screen: Screen) => void;
  onOpenPairModal: () => void;
  onRefreshScreens: () => void;
  onOpenLiveFeed?: (screen: Screen) => void;
}

export const ScreensPage: React.FC<ScreensPageProps> = ({
  screens,
  departments,
  onSelectScreen,
  onOpenPairModal,
  onRefreshScreens,
  onOpenLiveFeed,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Toggle Ads (Pause Ads -> Only Queue / Resume Ads)
  const handleTogglePause = async (screenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActioningId(screenId);
    try {
      await api.post(`/screens/${screenId}/toggle-pause`);
      onRefreshScreens();
    } catch (err: any) {
      alert(`Failed to toggle screen playback: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  // Toggle Remote Screen Power (Standby on / off)
  const handleTogglePower = async (screen: Screen, e: React.MouseEvent) => {
    e.stopPropagation();
    setActioningId(screen.id);
    try {
      const nextState = screen.powerState === 'off' ? 'on' : 'off';
      await api.post(`/screens/${screen.id}/power`, { state: nextState });
      onRefreshScreens();
    } catch (err: any) {
      alert(`Failed to change power state: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  // Unpair TV screen
  const handleUnpairScreen = async (screen: Screen, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to unpair "${screen.name}"?\n\nThe TV kiosk will immediately disconnect and return to the 6-digit pairing code screen.`
      )
    ) {
      return;
    }
    setActioningId(screen.id);
    try {
      await api.post(`/screens/${screen.id}/unpair`);
      onRefreshScreens();
    } catch (err: any) {
      alert(`Failed to unpair screen: ${err.message}`);
    } finally {
      setActioningId(null);
    }
  };

  // Bulk: Pause or Resume all ads
  const handleBulkPause = async (isPaused: boolean) => {
    setBulkLoading(true);
    try {
      await api.post('/screens/pause-all', { isPaused });
      onRefreshScreens();
    } catch (err: any) {
      alert(`Bulk pause failed: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk: Turn all screens on or off
  const handleBulkPower = async (state: 'on' | 'off') => {
    setBulkLoading(true);
    try {
      await api.post('/screens/power-all', { state });
      onRefreshScreens();
    } catch (err: any) {
      alert(`Bulk power failed: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredScreens = screens.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.queueUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'all' || s.departmentId === selectedDept;
    const matchesStatus = selectedStatus === 'all' || s.connectionStatus === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filters & Fleet Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'var(--card-bg)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-subtle)" />
          <input
            type="text"
            className="input-field"
            placeholder="Search TV displays by name, room, queue URL, doctor code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 14px' }}
          />
        </div>

        {/* Filters and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: '8px 12px', minWidth: '160px', fontSize: '0.825rem' }}
          >
            <option value="all">All Departments ({screens.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 12px', minWidth: '130px', fontSize: '0.825rem' }}
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          <button className="btn btn-secondary" onClick={onRefreshScreens} title="Refresh Screen Fleet">
            <RefreshCw size={16} />
          </button>

          <button className="btn btn-primary" onClick={onOpenPairModal}>
            <Plus size={16} /> Pair New TV
          </button>
        </div>
      </div>

      {/* Fleet Quick Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Fleet-Wide Master Controls ({screens.length} Screens):
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleBulkPause(true)}
            disabled={bulkLoading}
            title="Stop ads on all TVs and show only Doctor Token Queue"
          >
            <Pause size={13} fill="currentColor" color="#DC2626" />
            <span>Pause All Ads (Queue Only)</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleBulkPause(false)}
            disabled={bulkLoading}
            title="Resume normal advertising loop across all TVs"
          >
            <Play size={13} fill="currentColor" color="#10B981" />
            <span>Resume All Ads</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleBulkPower('off')}
            disabled={bulkLoading}
            title="Turn all screen displays off (Standby black screen)"
          >
            <Power size={13} color="#64748B" />
            <span>Turn All Screens OFF</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleBulkPower('on')}
            disabled={bulkLoading}
            title="Wake and turn all screens on"
          >
            <Power size={13} color="#10B981" />
            <span>Turn All Screens ON</span>
          </button>
        </div>
      </div>

      {/* Screens Grid */}
      {filteredScreens.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Tv size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No TV Displays Found</h4>
          <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>Click "Pair New TV" above to connect your first hospital display.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredScreens.map((screen) => {
            const dept = departments.find((d) => d.id === screen.departmentId);
            const isStandby = screen.powerState === 'off';
            const isAdsPaused = !!screen.isPaused;
            const isLoadingThis = actioningId === screen.id;

            return (
              <div
                key={screen.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: isStandby
                    ? '1px solid rgba(100, 116, 139, 0.4)'
                    : isAdsPaused
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : undefined,
                  opacity: isStandby ? 0.85 : 1.0,
                }}
              >
                {/* Header with Title & Status Badges */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isStandby
                          ? '#1E293B'
                          : 'linear-gradient(135deg, rgba(107, 58, 138, 0.15) 0%, rgba(157, 107, 186, 0.2) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Tv size={22} color={isStandby ? '#94A3B8' : '#6B3A8A'} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {screen.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                        {dept?.name || 'Department'} • {screen.code}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isStandby && (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '10px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            backgroundColor: '#334155',
                            color: '#CBD5E1',
                          }}
                        >
                          STANDBY
                        </span>
                      )}
                      {isAdsPaused && !isStandby && (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '10px',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          QUEUE ONLY
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
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
                      Location: {screen.location}
                    </span>
                  </div>
                </div>

                {/* Queue URL & Telemetry Info */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Doctor HMS Live Queue URL
                    </span>
                    <a
                      href={screen.queueUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                    >
                      <span>Open Link</span> <ExternalLink size={10} />
                    </a>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-main)',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {screen.queueUrl}
                  </div>
                </div>

                {/* Device Telemetry Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)' }}>
                    App: v{screen.playerVersion || '1.0.0'}
                  </span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)' }}>
                    Device: {screen.deviceMetadata?.platform || 'Android TV'}
                  </span>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)' }}>
                    Token: {screen.deviceToken ? 'Bound' : 'Pending'}
                  </span>
                </div>

                {/* Direct Action Control Buttons */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    marginTop: 'auto',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  {/* Left Controls: Play/Pause Ads & Power */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Toggle Ads (Pause Ads -> Only Queue / Resume Ads) */}
                    <button
                      className={`btn btn-sm ${isAdsPaused ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={(e) => handleTogglePause(screen.id, e)}
                      disabled={isLoadingThis}
                      title={isAdsPaused ? 'Resume advertisement rotation' : 'Stop ads and display only Doctor Queue'}
                      style={
                        isAdsPaused
                          ? { backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF' }
                          : { color: '#059669', borderColor: 'rgba(16, 185, 129, 0.4)' }
                      }
                    >
                      {isLoadingThis ? (
                        <Loader2 size={13} className="spin" />
                      ) : isAdsPaused ? (
                        <Play size={13} fill="currentColor" />
                      ) : (
                        <Pause size={13} fill="currentColor" />
                      )}
                      <span>{isAdsPaused ? 'Resume Ads' : 'Pause Ads (Queue Only)'}</span>
                    </button>

                    {/* Remote Screen Power (Standby on / off) */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleTogglePower(screen, e)}
                      disabled={isLoadingThis}
                      title={isStandby ? 'Wake screen display' : 'Turn screen display OFF (Standby energy saver)'}
                      style={
                        isStandby
                          ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.4)' }
                          : { color: '#64748B' }
                      }
                    >
                      <Power size={13} />
                      <span>{isStandby ? 'Wake TV' : 'Screen OFF'}</span>
                    </button>
                  </div>

                  {/* Right Controls: CCTV Monitor & Unpair & Edit */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onSelectScreen(screen)}
                      title="Edit screen parameters"
                    >
                      <Edit2 size={13} />
                      <span>Settings</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleUnpairScreen(screen, e)}
                      disabled={isLoadingThis}
                      title="Disconnect and unpair this TV from ads and system"
                      style={{ color: '#DC2626', borderColor: 'rgba(220, 38, 38, 0.3)' }}
                    >
                      <Trash2 size={13} />
                      <span>Unpair</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
