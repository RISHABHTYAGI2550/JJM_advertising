import React, { useState } from 'react';
import { Tv, Plus, Search, RefreshCw, Edit2, Settings, ExternalLink } from 'lucide-react';
import { Screen, Department } from '../types';

interface ScreensPageProps {
  screens: Screen[];
  departments: Department[];
  onSelectScreen: (screen: Screen) => void;
  onOpenPairModal: () => void;
  onRefreshScreens: () => void;
}

export const ScreensPage: React.FC<ScreensPageProps> = ({
  screens,
  departments,
  onSelectScreen,
  onOpenPairModal,
  onRefreshScreens,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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
      {/* Filters & Actions Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#FFFFFF',
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
            placeholder="Search TV displays by name, code, ward location, or queue URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 14px' }}
          />
        </div>

        {/* Department & Status Filters */}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
          }}
        >
          {filteredScreens.map((screen) => {
            const dept = departments.find((d) => d.id === screen.departmentId);
            return (
            <div
              key={screen.id}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
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
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background:
                        'linear-gradient(135deg, rgba(107, 58, 138, 0.15) 0%, rgba(157, 107, 186, 0.2) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Tv size={22} color="#6B3A8A" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {screen.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {dept?.name || 'Department'} • {screen.code}
                    </span>
                  </div>
                </div>
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

              {/* Location */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Physical Location: <strong style={{ color: 'var(--text-main)' }}>{screen.location}</strong>
              </div>

              {/* Queue URL */}
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.675rem',
                    color: 'var(--text-subtle)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Doctor HMS Queue URL
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-main)',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  {screen.queueUrl}
                </div>
              </div>

              {/* Action Buttons: Edit / Manage */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                  ID: {screen.id}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectScreen(screen)}
                  >
                    <Edit2 size={13} />
                    <span>Edit Screen</span>
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
