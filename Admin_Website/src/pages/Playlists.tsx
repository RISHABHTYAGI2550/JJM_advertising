import React, { useState } from 'react';
import {
  ListVideo,
  Plus,
  Clock,
  Tv,
  Image as ImageIcon,
  Video,
  ArrowRight,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Playlist, PlaylistItem, MediaItem } from '../types';
import { api } from '../services/api';

interface PlaylistsPageProps {
  playlists: Playlist[];
  media: MediaItem[];
  onRefresh: () => void;
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({
  playlists,
  media,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [items, setItems] = useState<PlaylistItem[]>([]);

  const openAddModal = () => {
    setName('');
    setDescription('');
    setIsDefault(false);
    setItems([]);
    setShowAddModal(true);
  };

  const openEditModal = (pl: Playlist) => {
    setEditingPlaylist(pl);
    setName(pl.name);
    setDescription(pl.description || '');
    setIsDefault(pl.isDefault);
    setItems(pl.items && pl.items.length ? [...pl.items] : []);
  };

  const handleAddItem = (type: 'queue' | 'image' | 'video') => {
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      type,
      title:
        type === 'queue'
          ? 'Doctor Live Token Queue'
          : media[0]?.title || 'Hospital Media Slide',
      duration: type === 'queue' ? 30 : 15,
      mediaId: type !== 'queue' ? media[0]?.id : undefined,
      mediaUrl: type !== 'queue' ? media[0]?.url : undefined,
      order: items.length + 1,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemDurationChange = (index: number, newDuration: number) => {
    setItems(
      items.map((it, i) => (i === index ? { ...it, duration: Number(newDuration) } : it))
    );
  };

  const handleItemMediaChange = (index: number, mediaId: string) => {
    const m = media.find((item) => item.id === mediaId);
    setItems(
      items.map((it, i) =>
        i === index
          ? {
              ...it,
              mediaId: m?.id,
              mediaUrl: m?.url,
              title: m?.title || it.title,
              duration: m?.duration || it.duration,
            }
          : it
      )
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/playlists', {
        name,
        description,
        items,
        isDefault,
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error saving playlist: ${err.message}`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlaylist) return;
    try {
      await api.patch(`/playlists/${editingPlaylist.id}`, {
        name,
        description,
        items,
        isDefault,
      });
      setEditingPlaylist(null);
      onRefresh();
    } catch (err: any) {
      alert(`Error updating playlist: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, plName: string) => {
    if (!confirm(`Are you sure you want to delete playlist: ${plName}?`)) return;
    try {
      await api.delete(`/playlists/${id}`);
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
            Hospital Playlists & Rotations
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Configure playback sequences (e.g. Queue ➔ Promotional Banner ➔ Video ➔ Queue)
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Create New Playlist
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {playlists.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <ListVideo size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Playlists Configured</h4>
            <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>Click "Create New Playlist" above to set up automated playback loops.</p>
          </div>
        ) : (
          playlists.map((pl) => (
          <div key={pl.id} className="glass-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                    }}
                  >
                    {pl.name}
                  </h4>
                  {pl.isDefault && (
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(107, 58, 138, 0.12)',
                        color: 'var(--primary)',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                      }}
                    >
                      DEFAULT FOR ALL SCREENS
                    </span>
                  )}
                </div>
                {pl.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {pl.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEditModal(pl)}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(pl.id, pl.name)}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Sequence Flow visualization */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}
            >
              {pl.items.map((item, idx) => (
                <React.Fragment key={item.id || idx}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor:
                        item.type === 'queue'
                          ? 'rgba(13, 148, 136, 0.08)'
                          : 'rgba(107, 58, 138, 0.08)',
                      border:
                        item.type === 'queue'
                          ? '1px solid rgba(13, 148, 136, 0.25)'
                          : '1px solid rgba(107, 58, 138, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'queue' ? (
                      <Tv size={16} color="#0d9488" />
                    ) : item.type === 'video' ? (
                      <Video size={16} color="#9D6BBA" />
                    ) : (
                      <ImageIcon size={16} color="#6B3A8A" />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.675rem',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={10} />
                        {item.duration} seconds
                      </div>
                    </div>
                  </div>

                  {idx < pl.items.length - 1 && (
                    <ArrowRight size={14} color="var(--text-subtle)" style={{ flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )))}
      </div>

      {/* Add / Edit Playlist Modal */}
      {(showAddModal || editingPlaylist) && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '26px', maxWidth: '680px' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '18px',
                fontFamily: 'var(--font-display)',
              }}
            >
              {editingPlaylist ? `Edit Playlist: ${editingPlaylist.name}` : 'Create New Playlist'}
            </h3>
            <form
              onSubmit={editingPlaylist ? handleUpdate : handleCreate}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Playlist Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. OPD Queue & Health Promotion Rotation"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Description
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cycle description..."
                />
              </div>

              {/* Items Sequencer */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Display Sequence Items ({items.length})
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddItem('queue')}
                    >
                      + Queue (30s)
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAddItem('image')}
                    >
                      + Ad Slide
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    padding: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            width: '20px',
                          }}
                        >
                          #{index + 1}
                        </span>

                        {item.type === 'queue' ? (
                          <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#047857' }}>
                            Live OPD Token Queue Screen
                          </span>
                        ) : (
                          <select
                            className="input-field"
                            value={item.mediaId || ''}
                            onChange={(e) => handleItemMediaChange(index, e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1 }}
                          >
                            {media.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            className="input-field"
                            value={item.duration}
                            onChange={(e) => handleItemDurationChange(index, Number(e.target.value))}
                            style={{ width: '65px', padding: '6px 8px', fontSize: '0.8rem' }}
                            min={5}
                            max={300}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>sec</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label
                  htmlFor="defaultCheck"
                  style={{ fontSize: '0.825rem', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Set as Default Playlist for all Hospital TV screens
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPlaylist(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
