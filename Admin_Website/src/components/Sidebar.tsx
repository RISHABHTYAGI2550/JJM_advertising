import React from 'react';
import {
  LayoutDashboard,
  Tv,
  Building2,
  Image as ImageIcon,
  ListVideo,
  Megaphone,
  FileText,
  Activity,
  Video,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onlineScreensCount: number;
  totalScreensCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onlineScreensCount,
  totalScreensCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'live-feeds',
      label: 'Live Feeds (CCTV)',
      icon: Video,
      badge: 'LIVE',
      isLiveBadge: true,
    },
    {
      id: 'screens',
      label: 'Screens / TVs',
      icon: Tv,
      badge: `${onlineScreensCount}/${totalScreensCount}`,
    },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'media', label: 'Media Assets', icon: ImageIcon },
    { id: 'playlists', label: 'Playlists', icon: ListVideo },
    { id: 'campaigns', label: 'Campaigns & Ads', icon: Megaphone },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <aside
      style={{
        width: '265px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        boxShadow: '2px 0 16px rgba(107, 58, 138, 0.03)',
      }}
    >
      {/* Brand Header with JJM Colors */}
      <div
        style={{
          padding: '22px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6B3A8A 0%, #9D6BBA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(107, 58, 138, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <h1
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: '#1F162B',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              fontFamily: 'var(--font-display)',
            }}
          >
            JJM HOSPITAL
          </h1>
          <span
            style={{
              fontSize: '0.725rem',
              color: 'var(--primary)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            KASHIPUR SIGNAGE HUB
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav
        style={{
          padding: '18px 14px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: isActive
                  ? '1px solid rgba(107, 58, 138, 0.25)'
                  : '1px solid transparent',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(107, 58, 138, 0.12) 0%, rgba(157, 107, 186, 0.10) 100%)'
                  : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 58, 138, 0.05)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon
                  size={19}
                  color={isActive ? '#6B3A8A' : '#766B82'}
                  strokeWidth={isActive ? 2.3 : 2}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.675rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    backgroundColor: item.isLiveBadge
                      ? 'rgba(239, 68, 68, 0.12)'
                      : onlineScreensCount > 0
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(107, 58, 138, 0.08)',
                    color: item.isLiveBadge
                      ? '#dc2626'
                      : onlineScreensCount > 0
                      ? '#047857'
                      : 'var(--text-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: item.isLiveBadge ? '4px' : '0',
                  }}
                >
                  {item.isLiveBadge && <span className="pulse-rec-dot" style={{ width: '6px', height: '6px' }} />}
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#FAF8FD',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulse-dot-online" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
            JJM Central Engine Connected
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
          Kashipur, Uttarakhand • Live Signage
        </div>
      </div>
    </aside>
  );
};
