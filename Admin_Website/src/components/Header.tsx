import React from 'react';
import { Plus, Megaphone, ShieldCheck, LogOut, Menu, Server } from 'lucide-react';
import { getActiveBackendUrl, setBackendTarget } from '../services/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenPairModal: () => void;
  onOpenGlobalAdModal: () => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenPairModal,
  onOpenGlobalAdModal,
  onLogout,
  onToggleMobileMenu,
}) => {
  const activeUrl = getActiveBackendUrl();
  const isLocal = activeUrl.includes('localhost') || activeUrl.includes('127.0.0.1');
  return (
    <header
      style={{
        minHeight: '72px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(107, 58, 138, 0.04)',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: 'var(--text-main)',
            }}
          >
            <Menu size={24} />
          </button>
        )}
        <div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 1.2,
              fontFamily: 'var(--font-display)',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Backend Server Target Indicator / Toggle */}
        <button
          onClick={() => setBackendTarget(isLocal ? 'live' : 'local')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            border: isLocal ? '1px solid #f59e0b' : '1px solid #10b981',
            backgroundColor: isLocal ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: isLocal ? '#b45309' : '#047857',
            fontSize: '0.725rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
          title={`Click to switch between Live Cloud and Local Backend (Current: ${activeUrl})`}
        >
          <span className={isLocal ? 'pulse-dot-offline' : 'pulse-dot-online'} style={{ width: '7px', height: '7px' }} />
          <span>{isLocal ? 'DEV: LOCAL (5000)' : 'LIVE CLOUD (RENDER)'}</span>
        </button>

        {/* 1-Click Global Campaign Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenGlobalAdModal}
          title="Instant 1-Click Broadcast across all Hospital TVs"
        >
          <Megaphone size={16} color="#6B3A8A" />
          <span className="hide-on-mobile">1-Click Global Ad</span>
        </button>

        {/* Pair New TV Button */}
        <button className="btn btn-primary btn-sm" onClick={onOpenPairModal}>
          <Plus size={16} />
          <span className="hide-on-mobile">Pair New TV</span>
        </button>

        <div
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: 'var(--border-color)',
            margin: '0 2px',
          }}
        />

        {/* User Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '24px',
            backgroundColor: '#FAF8FD',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B3A8A 0%, #9D6BBA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={14} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1,
              }}
            >
              Admin
            </div>
          </div>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              padding: '6px 10px',
            }}
            title="Secure Logout from JJM Admin"
          >
            <LogOut size={16} />
            <span className="hide-on-mobile">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
