import React from 'react';
import { Plus, Megaphone, ShieldCheck, LogOut, Menu } from 'lucide-react';

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
