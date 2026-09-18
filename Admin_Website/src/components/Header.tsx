import React from 'react';
import { Plus, Megaphone, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenPairModal: () => void;
  onOpenGlobalAdModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenPairModal,
  onOpenGlobalAdModal,
}) => {
  return (
    <header
      style={{
        height: '72px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(107, 58, 138, 0.04)',
      }}
    >
      <div>
        <h2
          style={{
            fontSize: '1.3rem',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* 1-Click Global Campaign Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenGlobalAdModal}
          title="Instant 1-Click Broadcast across all Hospital TVs"
        >
          <Megaphone size={16} color="#6B3A8A" />
          <span>1-Click Global Ad</span>
        </button>

        {/* Pair New TV Button */}
        <button className="btn btn-primary" onClick={onOpenPairModal}>
          <Plus size={16} />
          <span>Pair New Screen / TV</span>
        </button>

        <div
          style={{
            width: '1px',
            height: '28px',
            backgroundColor: 'var(--border-color)',
            margin: '0 4px',
          }}
        />

        {/* User Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '24px',
            backgroundColor: '#FAF8FD',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 6px rgba(107, 58, 138, 0.04)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6B3A8A 0%, #9D6BBA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(107, 58, 138, 0.3)',
            }}
          >
            <ShieldCheck size={16} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1,
              }}
            >
              Super Admin
            </div>
            <div style={{ fontSize: '0.675rem', color: 'var(--primary)', fontWeight: 600 }}>
              JJM Kashipur Control
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
