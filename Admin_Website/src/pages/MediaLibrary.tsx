import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Video, Trash2, Tag, Play } from 'lucide-react';
import { MediaItem } from '../types';
import { api, getBackendBaseUrl } from '../services/api';

interface MediaLibraryPageProps {
  media: MediaItem[];
  onRefresh: () => void;
}

export const MediaLibraryPage: React.FC<MediaLibraryPageProps> = ({
  media,
  onRefresh,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [duration, setDuration] = useState(15);
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('Promotion');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('title', title);
      formData.append('customUrl', customUrl);
      formData.append('duration', duration.toString());
      formData.append('tags', tags);
      formData.append('category', category);

      await api.post('/media', formData);

      setShowUploadModal(false);
      setTitle('');
      setCustomUrl('');
      setFile(null);
      onRefresh();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      await api.delete(`/media/${id}`);
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3
            style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Hospital Media Library
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            High-definition promotional posters, medical guidelines, and department showcase videos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={16} /> Upload Media Asset
        </button>
      </div>

      {media.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <ImageIcon size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Media Assets Uploaded</h4>
          <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>Click "Upload Media Asset" above to upload promotional posters or videos.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '18px',
          }}
        >
          {media.map((item) => {
          const fullUrl = item.url.startsWith('/') ? `${getBackendBaseUrl()}${item.url}` : item.url;
          return (
            <div
              key={item.id}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {/* Media Preview Box */}
              <div
                style={{
                  height: '180px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#0D0B12',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                }}
              >
                {item.type === 'video' ? (
                  <video
                    src={fullUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    controls
                  />
                ) : item.type === 'image' && fullUrl ? (
                  <img
                    src={fullUrl}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-subtle)',
                    }}
                  >
                    Text Announcement
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '3px 9px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {item.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                  {item.duration}s
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.7rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                  {item.dimensions || '1920x1080'} • {item.category}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Delete media"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '26px' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '18px',
                fontFamily: 'var(--font-display)',
              }}
            >
              Upload Media Asset
            </h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Asset Title *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Health Checkup Package Flyer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Upload File (JPG, PNG, WEBP, MP4)
                </label>
                <input
                  type="file"
                  className="input-field"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.75rem', fontWeight: 600 }}>
                — OR PROVIDE WEB URL —
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Direct Media URL
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Display Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min={5}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Promotion">Promotion</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Information">Information</option>
                    <option value="Branding">Branding</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Checkup, OPD, Cardiology"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Uploading...' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
