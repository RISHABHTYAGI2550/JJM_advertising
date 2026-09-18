import React, { useState } from 'react';
import { X, Megaphone, CheckCircle } from 'lucide-react';
import { MediaItem } from '../types';
import { api } from '../services/api';

interface OneClickGlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  onBroadcastSuccess: () => void;
}

export const OneClickGlobalModal: React.FC<OneClickGlobalModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  onBroadcastSuccess,
}) => {
  if (!isOpen) return null;

  const [campaignName, setCampaignName] = useState('Hospital-Wide Emergency / Promotion Broadcast');
  const [selectedMediaId, setSelectedMediaId] = useState(mediaList[0]?.id || '');
  const [priority, setPriority] = useState(85);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMedia = mediaList.find((m) => m.id === selectedMediaId);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedMedia) {
        throw new Error('Please select a media item to broadcast');
      }

      await api.post('/campaigns/broadcast-global', {
        name: campaignName,
        mediaId: selectedMedia.id,
        mediaUrl: selectedMedia.url,
        priority: Number(priority),
      });

      setSuccess(true);
      setTimeout(() => {
        onBroadcastSuccess();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to broadcast global campaign');
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
                background: 'linear-gradient(135deg, #6B3A8A 0%, #9D6BBA 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(107, 58, 138, 0.3)',
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
                1-Click Global Advertisement Broadcast
              </h3>
              <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                Instantly push this advertisement to ALL hospital TV screens
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

        {success && (
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
            <span>Global Advertisement published to all screens via WebSocket!</span>
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              Broadcast Title
            </label>
            <input
              type="text"
              className="input-field"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>

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
              Select Media Asset
            </label>
            <select
              className="input-field"
              value={selectedMediaId}
              onChange={(e) => setSelectedMediaId(e.target.value)}
            >
              {mediaList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {selectedMedia && (
            <div
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                backgroundColor: '#0D0B12',
                height: '140px',
                position: 'relative',
              }}
            >
              {selectedMedia.type === 'image' && selectedMedia.url ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : selectedMedia.type === 'video' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#c4b5fd',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Video Preview: {selectedMedia.title}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#c4b5fd',
                  }}
                >
                  Text Announcement
                </div>
              )}
            </div>
          )}

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
              Broadcast Priority
            </label>
            <select
              className="input-field"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <option value="80">Normal Global Announcement (Priority 80)</option>
              <option value="85">High Priority Hospital Broadcast (Priority 85)</option>
              <option value="100">Critical Emergency (Priority 100 - Immediate Override)</option>
            </select>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
            }}
          >
            ⚡ Clicking broadcast will immediately send a real-time WebSocket packet to all registered TV clients.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Broadcasting...' : 'Broadcast to All Screens'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
