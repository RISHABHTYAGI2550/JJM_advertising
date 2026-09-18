import React from 'react';
import { FileText, Clock } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsPageProps {
  logs: AuditLog[];
}

export const AuditLogsPage: React.FC<AuditLogsPageProps> = ({ logs }) => {
  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3
          style={{
            fontSize: '1.3rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            fontFamily: 'var(--font-display)',
          }}
        >
          Hospital Audit Logs & System Activity
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Traceability of screen pairings, queue URL changes, global advertisements, and remote commands
        </p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 150px 190px 1fr',
            padding: '14px 22px',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-subtle)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <div>Timestamp</div>
          <div>Action</div>
          <div>Entity / Target</div>
          <div>Operation Details</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 150px 190px 1fr',
                padding: '14px 22px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={13} />
                {new Date(log.timestamp).toLocaleString()}
              </div>

              <div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(107, 58, 138, 0.12)',
                    color: 'var(--primary)',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                  }}
                >
                  {log.action}
                </span>
              </div>

              <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.8rem' }}>
                {log.entity}{' '}
                <code style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>
                  ({log.entityId})
                </code>
              </div>

              <div style={{ color: 'var(--text-muted)' }}>{log.details}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
