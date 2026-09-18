import React, { useState } from 'react';
import { X, Tv, ExternalLink, CheckCircle } from 'lucide-react';
import { Department } from '../types';
import { api } from '../services/api';

interface PairScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onScreenPaired: () => void;
}

export const PairScreenModal: React.FC<PairScreenModalProps> = ({
  isOpen,
  onClose,
  departments,
  onScreenPaired,
}) => {
  if (!isOpen) return null;

  const [pairingCode, setPairingCode] = useState('');
  const [screenName, setScreenName] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [location, setLocation] = useState('');
  const [queueUrl, setQueueUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (pairingCode.length !== 6) {
        throw new Error('Pairing code must be exactly 6 digits');
      }

      const res = await api.post('/screens/pair', {
        pairingCode: pairingCode.trim(),
        name: screenName.trim(),
        departmentId: departmentId || (departments[0]?.id || 'GENERAL'),
        location: location || 'Hospital Ward / Clinic',
        queueUrl: queueUrl.trim(),
      });

      if (res.data.success) {
        setSuccessMessage(`TV paired successfully with ${res.data.screen.name}!`);
        setTimeout(() => {
          onScreenPaired();
          onClose();
          setSuccessMessage(null);
          setPairingCode('');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to pair TV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, rgba(107, 58, 138, 0.15) 0%, rgba(157, 107, 186, 0.22) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tv size={22} color="#6B3A8A" />
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
                Pair Android TV Screen
              </h3>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                Enter the 6-digit code shown on the TV display
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--danger-light)',
              color: '#b91c1c',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--success-light)',
              color: '#065f46',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 6 Digit Pairing Code */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '5px',
              }}
            >
              6-Digit Pairing Code *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 583921"
              maxLength={6}
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, ''))}
              required
              style={{
                fontSize: '1.4rem',
                letterSpacing: '0.25em',
                textAlign: 'center',
                fontWeight: 800,
                color: 'var(--primary)',
                fontFamily: 'monospace',
              }}
            />
            <span
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-subtle)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              Find this 6-digit code on the newly installed Flutter TV Player screen.
            </span>
          </div>

          {/* Screen Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '5px',
              }}
            >
              Screen Display Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. OPD Room 1 — Doctor Consultation"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              required
            />
          </div>

          {/* Department */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '5px',
              }}
            >
              Hospital Department *
            </label>
            <select
              className="input-field"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {departments.length > 0 ? (
                departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))
              ) : (
                <option value="">General OPD (Default)</option>
              )}
            </select>
          </div>

          {/* Location / Room */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '5px',
              }}
            >
              Location / Floor
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Ground Floor, Wing A, Room 101"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Manual Queue URL */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.775rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '5px',
              }}
            >
              HMS Live Queue URL *
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://hms.jjmhospitalkashipur.com/qd/..."
              value={queueUrl}
              onChange={(e) => setQueueUrl(e.target.value)}
              required
            />
            <span
              style={{
                fontSize: '0.725rem',
                color: 'var(--text-subtle)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              Enter the patient token queue web address for this screen.
            </span>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Pairing TV...' : 'Complete Pairing & Bind Screen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
